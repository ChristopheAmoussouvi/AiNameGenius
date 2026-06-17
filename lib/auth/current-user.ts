// P0 FIX — Real authentication: derives the user id from a verified Supabase JWT.
// SECURITY: never trust a client-provided user id. The id comes from the verified token only.
import { fail } from "@/lib/api/response"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization")
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (!token || scheme.toLowerCase() !== "bearer") return null
  return token.trim()
}

export type AuthResult =
  | { userId: string; email: string | null; token: string; error: null }
  | { userId: null; email: null; token: null; error: Response }

export async function requireUserId(req: Request): Promise<AuthResult> {
  const token = getBearerToken(req)
  if (!token) {
    return {
      userId: null,
      email: null,
      token: null,
      error: fail(
        "UNAUTHORIZED",
        "Missing or malformed Authorization header (expected: Bearer <token>).",
        401,
      ),
    }
  }

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data?.user) {
    return {
      userId: null,
      email: null,
      token: null,
      error: fail("UNAUTHORIZED", "Invalid or expired session.", 401),
    }
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    token,
    error: null,
  }
}
