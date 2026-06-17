import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(
      `
      *,
      name_candidates(*),
      trademark_results(*),
      scores(*),
      reports(*),
      logo_jobs(*),
      brand_kits(*)
    `,
    )
    .eq("id", params.projectId)
    .eq("user_id", auth.userId)
    .single()

  if (error || !data) {
    return fail("NOT_FOUND", "Project not found.", 404)
  }

  return ok(data)
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { error } = await supabaseAdmin
    .from("projects")
    .delete()
    .eq("id", params.projectId)
    .eq("user_id", auth.userId)

  if (error) return fail("INTERNAL_ERROR", error.message, 500)
  return ok({ deleted: true })
}
