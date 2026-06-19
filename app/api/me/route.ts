import { requireUserId } from "@/lib/auth/current-user"
import { ok } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data } = await supabaseAdmin
    .from("users")
    .select("email, credits, plan")
    .eq("id", auth.userId)
    .maybeSingle()

  return ok({
    id: auth.userId,
    email: auth.email ?? data?.email ?? null,
    credits: data?.credits ?? 0,
    plan: data?.plan ?? "free",
  })
}
