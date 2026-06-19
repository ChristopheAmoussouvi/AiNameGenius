import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { generateBrandKit } from "@/lib/llm/brandkit"
import { generateImage, geminiImageEnabled } from "@/lib/images/gemini"
import { uploadBase64Image } from "@/lib/storage/upload"
import { buildLogoPrompt, LOGO_STYLES, type LogoStyle } from "@/lib/prompts/brandkit"
import { BrandKitRequestSchema } from "@/lib/validation/project"
import { trackEvent } from "@/lib/events/track"
import type { BrandKitData, BrandLogo, ProjectBrief } from "@/types/ainamegenius"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, brief")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!project) return fail("NOT_FOUND", "Project not found.", 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body.")
  }

  const parsed = BrandKitRequestSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const { name, styles } = parsed.data
  const brief = project.brief as ProjectBrief
  const logoStyles: LogoStyle[] = styles ?? LOGO_STYLES

  try {
    // 1. Brand kit text (palette, typography, tagline, voice) via OpenRouter LLM
    const kit = await generateBrandKit(brief, name)
    const primaryHex =
      kit.palette.find((c) => c.role === "primary")?.hex ?? kit.palette[0]?.hex ?? "#6367FF"

    // 2. Logo concepts via Gemini image generation (parallel), persisted to storage
    let logos: BrandLogo[] = []
    if (geminiImageEnabled()) {
      const settled = await Promise.allSettled(
        logoStyles.map(async (style): Promise<BrandLogo> => {
          const img = await generateImage(buildLogoPrompt({ name, brief, primaryHex, style }))
          const url = await uploadBase64Image(img.base64, img.mimeType, `${projectId}/${style}`)
          return { url, style }
        }),
      )
      logos = settled
        .filter((r): r is PromiseFulfilledResult<BrandLogo> => r.status === "fulfilled")
        .map((r) => r.value)
    }

    const data: BrandKitData = { name, ...kit, logos }

    // 3. Persist (one brand kit per project — unique on project_id)
    const { error: upsertError } = await supabaseAdmin
      .from("brand_kits")
      .upsert(
        { project_id: projectId, status: "completed", data, updated_at: new Date().toISOString() },
        { onConflict: "project_id" },
      )

    if (upsertError) return fail("INTERNAL_ERROR", upsertError.message, 500)

    await trackEvent({
      userId: auth.userId,
      projectId,
      type: "brand_kit_generated",
      properties: { name, logos: logos.length },
    })

    const warning = !geminiImageEnabled()
      ? "Logo generation skipped — GEMINI_API_KEY is not configured."
      : logos.length === 0
        ? "Brand kit generated, but logo generation failed. Try regenerating."
        : undefined

    return ok({ ...data, ...(warning && { warning }) })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return fail("INTERNAL_ERROR", `Brand kit generation failed: ${message}`, 500)
  }
}
