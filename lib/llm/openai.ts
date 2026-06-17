import OpenAI from "openai"
import { z } from "zod"

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_BASE_URL ?? "https://ainamegenius.com",
    "X-Title": "AiNameGenius",
  },
})

export async function generateStrictJson<T>({
  system,
  user,
  schema,
  model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
}: {
  system: string
  user: string
  schema: z.ZodType<T>
  model?: string
}): Promise<T> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  })

  const text = response.choices[0]?.message?.content ?? ""
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("LLM returned invalid JSON")
  }
  return schema.parse(parsed)
}
