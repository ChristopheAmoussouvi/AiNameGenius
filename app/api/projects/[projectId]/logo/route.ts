import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { generateImage, geminiImageEnabled } from "@/lib/images/gemini"
import { uploadBase64Image } from "@/lib/storage/upload"
import { buildLogoPrompt, LOGO_STYLES, type LogoStyle } from "@/lib/prompts/brandkit"
import { trackEvent } from "@/lib/events/track"
import type { BrandKitData, BrandLogo, ProjectBrief } from "@/types/ainamegenius"

export const runtime = "nodejs"
export const maxDuration = 60

// Regenerates logo concepts for an existing brand kit, reusing its palette.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  if (!geminiImageEnabled()) {
    return fail("INTERNAL_ERROR", "Logo generation is not configured (GEMINI_API_KEY).", 503)
  }

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, brief")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!project) return fail("NOT_FOUND", "Project not found.", 404)

  const { data: kitRow } = await supabaseAdmin
    .from("brand_kits")
    .select("data")
    .eq("project_id", projectId)
    .maybeSingle()

  if (!kitRow?.data) {
    return fail("BAD_REQUEST", "Generate a brand kit before regenerating logos.", 400)
  }

  const kit = kitRow.data as BrandKitData
  const brief = project.brief as ProjectBrief
  const primaryHex =
    kit.palette.find((c) => c.role === "primary")?.hex ?? kit.palette[0]?.hex ?? "#6367FF"
  const styles: LogoStyle[] = LOGO_STYLES

  try {
    const settled = await Promise.allSettled(
      styles.map(async (style): Promise<BrandLogo> => {
        const img = await generateImage(buildLogoPrompt({ name: kit.name, brief, primaryHex, style }))
        const url = await uploadBase64Image(img.base64, img.mimeType, `${projectId}/${style}`)
        return { url, style }
      }),
    )
    const logos = settled
      .filter((r): r is PromiseFulfilledResult<BrandLogo> => r.status === "fulfilled")
      .map((r) => r.value)

    if (logos.length === 0) {
      return fail("UPSTREAM_ERROR", "Logo generation failed. Please try again.", 502)
    }

    const data: BrandKitData = { ...kit, logos }

    const { error } = await supabaseAdmin
      .from("brand_kits")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("project_id", projectId)

    if (error) return fail("INTERNAL_ERROR", error.message, 500)

    await trackEvent({
      userId: auth.userId,
      projectId,
      type: "logos_regenerated",
      properties: { logos: logos.length },
    })

    return ok(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return fail("INTERNAL_ERROR", `Logo generation failed: ${message}`, 500)
  }
}
