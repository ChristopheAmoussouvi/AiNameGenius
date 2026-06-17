// P0 FIX: added maxDuration=60 and runtime=nodejs
import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { checkDomainsRdap } from "@/lib/domain/rdap"
import { buildNamecheapAffiliateUrl } from "@/lib/domain/affiliate"
import { toDomainSld } from "@/lib/projects/normalize"
import { DomainCheckSchema } from "@/lib/validation/project"
import { trackEvent } from "@/lib/events/track"

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
    .select("id")
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

  const parsed = DomainCheckSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const { names, tlds } = parsed.data
  const slds = names.map(toDomainSld)

  try {
    const results = await checkDomainsRdap(slds, tlds)

    const enriched = results.map((r) => ({
      ...r,
      affiliateUrl:
        r.status === "available"
          ? buildNamecheapAffiliateUrl(r.name, r.tld)
          : null,
    }))

    await trackEvent({
      userId: auth.userId,
      projectId,
      type: "domains_checked",
      properties: { count: results.length },
    })

    return ok(enriched)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return fail("UPSTREAM_ERROR", `RDAP check failed: ${message}`, 502)
  }
}
