import OpenAI from "openai"
import { z } from "zod"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateStrictJson<T>({
  system,
  user,
  schema,
  model = "gpt-4.1-mini",
}: {
  system: string
  user: string
  schema: z.ZodType<T>
  model?: string
}): Promise<T> {
  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: { format: { type: "json_object" } },
  })

  const text = response.output_text
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("LLM returned invalid JSON")
  }
  return schema.parse(parsed)
}
