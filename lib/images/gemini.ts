import { GoogleGenAI, Modality } from "@google/genai"

// Gemini image generation ("Nano Banana"). Model is configurable; the 2.5 flash
// image model is the stable default. See https://ai.google.dev/gemini-api/docs/image-generation
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image"

export interface GeneratedImage {
  base64: string
  mimeType: string
}

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY")
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

export function geminiImageEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const ai = getClient()

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const inline = part.inlineData
    if (inline?.data) {
      return { base64: inline.data, mimeType: inline.mimeType ?? "image/png" }
    }
  }
  throw new Error("Gemini returned no image data")
}
