import { supabaseAdmin } from "@/lib/supabase/server"

interface LedgerEntry {
  userId: string
  projectId?: string
  amount: number
  reason: string
}

export async function debitCredits(input: LedgerEntry): Promise<void> {
  await supabaseAdmin.from("credits_ledger").insert({
    user_id: input.userId,
    project_id: input.projectId ?? null,
    amount: -Math.abs(input.amount),
    reason: input.reason,
  })
}

export async function creditCredits(input: LedgerEntry): Promise<void> {
  await supabaseAdmin.from("credits_ledger").insert({
    user_id: input.userId,
    project_id: input.projectId ?? null,
    amount: Math.abs(input.amount),
    reason: input.reason,
  })
}
