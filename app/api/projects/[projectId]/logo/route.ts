import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createJob } from "@/lib/jobs/jobs"
import { getIdempotencyKey } from "@/lib/api/response"

export const runtime = "nodejs"

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", params.projectId)
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!project) return fail("NOT_FOUND", "Project not found.", 404)

  const idempotencyKey = getIdempotencyKey(req) ?? undefined

  const job = await createJob({
    projectId: params.projectId,
    userId: auth.userId,
    type: "logo_generation",
    idempotencyKey,
  })

  return ok({ jobId: job.id, status: job.status }, { status: 202 })
}
