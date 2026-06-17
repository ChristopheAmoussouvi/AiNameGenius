import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { CreateProjectSchema } from "@/lib/validation/project"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })

  if (error) return fail("INTERNAL_ERROR", error.message, 500)
  return ok(data)
}

export async function POST(req: Request) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body.")
  }

  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const { name, brief } = parsed.data

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert({ user_id: auth.userId, name, brief })
    .select()
    .single()

  if (error) return fail("INTERNAL_ERROR", error.message, 500)
  return ok(data, { status: 201 })
}
