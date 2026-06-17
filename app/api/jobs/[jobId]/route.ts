import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from("generation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", auth.userId)
    .single()

  if (error || !data) {
    return fail("NOT_FOUND", "Job not found.", 404)
  }

  return ok(data)
}
