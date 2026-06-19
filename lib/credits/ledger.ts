import { supabaseAdmin } from "@/lib/supabase/server"

interface SpendInput {
  userId: string
  amount: number
  reason: string
  projectId?: string
}

export async function getCredits(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("id", userId)
    .maybeSingle()
  return data?.credits ?? 0
}

/**
 * Atomically debits credits via the `spend_credits` SQL function.
 * Returns { ok: false } when the balance is insufficient.
 */
export async function spendCredits(
  input: SpendInput,
): Promise<{ ok: true; balance: number } | { ok: false }> {
  const { data, error } = await supabaseAdmin.rpc("spend_credits", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_project_id: input.projectId ?? null,
  })

  if (error) {
    if (error.message?.includes("insufficient")) return { ok: false }
    throw new Error(`spend_credits failed: ${error.message}`)
  }
  return { ok: true, balance: data as number }
}

/** Atomically grants credits via the `grant_credits` SQL function. */
export async function grantCredits(input: SpendInput): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("grant_credits", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_project_id: input.projectId ?? null,
  })
  if (error) throw new Error(`grant_credits failed: ${error.message}`)
  return data as number
}
