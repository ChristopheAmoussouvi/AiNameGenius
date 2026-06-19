import { randomUUID } from "crypto"
import { supabaseAdmin } from "@/lib/supabase/server"

const BUCKET = "brand-assets"

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

/**
 * Persists a base64 image (e.g. from Gemini) to the public `brand-assets`
 * bucket and returns its permanent public URL.
 */
export async function uploadBase64Image(
  base64: string,
  mimeType: string,
  pathPrefix: string,
): Promise<string> {
  const buffer = Buffer.from(base64, "base64")
  const ext = EXT[mimeType] ?? "png"
  const path = `${pathPrefix}/${randomUUID()}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
