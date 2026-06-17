import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { checkTrademarks } from "@/lib/trademark/check"
import { z } from "zod"

export const runtime = "nodejs"
export const maxDuration = 60

const TrademarkCheckSchema = z.object({
  names: z.array(z.string().min(1).max(100)).min(1).max(30),
})

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

  const parsed = TrademarkCheckSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const { names } = parsed.data
  const results = await checkTrademarks(names)

  // Persist results to trademark_results for project history
  const rows = results.map((r) => ({
    project_id: projectId,
    name: r.name,
    jurisdiction: "FR",
    status: r.risk,
    raw: { total: r.total, hits: r.hits, source: r.source },
    checked_at: new Date().toISOString(),
  }))

  await supabaseAdmin.from("trademark_results").upsert(rows, {
    onConflict: "project_id,name,jurisdiction",
    ignoreDuplicates: false,
  })

  const hasIncomplete = results.some((r) => r.risk === "incomplete")

  return ok({
    results,
    ...(hasIncomplete && {
      warning:
        "Some results are incomplete. Configure INPI_API_KEY to enable live trademark checks. Register at https://data.inpi.fr/register",
    }),
  })
}
