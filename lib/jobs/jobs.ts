import { supabaseAdmin } from "@/lib/supabase/server"
import type { JobStatus } from "@/types/ainamegenius"

interface CreateJobInput {
  projectId: string
  userId: string
  type: string
  idempotencyKey?: string
}

export async function createJob(input: CreateJobInput) {
  // Idempotency check
  if (input.idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from("generation_jobs")
      .select("*")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle()

    if (existing) return existing
  }

  const { data, error } = await supabaseAdmin
    .from("generation_jobs")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      type: input.type,
      status: "pending",
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)
  return data
}

export async function updateJob(
  jobId: string,
  status: JobStatus,
  patch?: { result?: unknown; error?: string },
) {
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (patch?.result !== undefined) update.result = patch.result
  if (patch?.error !== undefined) update.error = patch.error

  const { error } = await supabaseAdmin
    .from("generation_jobs")
    .update(update)
    .eq("id", jobId)

  if (error) throw new Error(`Failed to update job: ${error.message}`)
}
