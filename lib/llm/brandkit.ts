import { generateStrictJson } from "@/lib/llm/openai"
import {
  buildBrandKitSystemPrompt,
  buildBrandKitUserPrompt,
} from "@/lib/prompts/brandkit"
import { BrandKitResponseSchema } from "@/lib/validation/llm"
import type { ProjectBrief, BrandKitContent } from "@/types/ainamegenius"

export async function generateBrandKit(
  brief: ProjectBrief,
  name: string,
): Promise<BrandKitContent> {
  const result = await generateStrictJson({
    system: buildBrandKitSystemPrompt(),
    user: buildBrandKitUserPrompt(brief, name),
    schema: BrandKitResponseSchema,
  })

  return {
    tagline: result.tagline,
    voice: result.voice,
    palette: result.palette,
    typography: result.typography,
  }
}
