import { supabaseAdmin } from "@/lib/supabase/server"

interface TrackEventInput {
  userId?: string
  projectId?: string
  type: string
  properties?: Record<string, unknown>
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  await supabaseAdmin.from("events").insert({
    user_id: input.userId ?? null,
    project_id: input.projectId ?? null,
    type: input.type,
    properties: input.properties ?? {},
  })
}
