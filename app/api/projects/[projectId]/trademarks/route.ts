import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createJob } from "@/lib/jobs/jobs"
import { getIdempotencyKey } from "@/lib/api/response"

export const runtime = "nodejs"

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

  const idempotencyKey = getIdempotencyKey(req) ?? undefined

  const job = await createJob({
    projectId,
    userId: auth.userId,
    type: "trademark_check",
    idempotencyKey,
  })

  return ok(
    {
      jobId: job.id,
      status: job.status,
      note: "Trademark check via INPI/EUIPO is not yet connected. Connect the integration to enable real results.",
    },
    { status: 202 },
  )
}
