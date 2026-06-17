import type { ProjectBrief } from "@/types/ainamegenius"

export function buildNamingSystemPrompt(): string {
  return `You are an expert brand naming consultant. Your task is to generate creative, memorable business names.

RULES:
- Return ONLY valid JSON matching the schema: {"names": [{"name": "...", "rationale": "..."}]}
- Generate between 80 and 150 names unless explicitly told otherwise
- Names should be 1–3 words, brandable, and easy to spell
- DO NOT make any claims about domain availability — you do not have access to domain registrars
- DO NOT include trademark or legal availability assessments
- Rationale should be 1–2 sentences explaining the name's appeal
- Vary the style: coined words, compound words, metaphors, acronyms, foreign words

OUTPUT: JSON only. No markdown, no explanation outside the JSON object.`
}

export function buildNamingUserPrompt(
  brief: ProjectBrief,
  count: number,
): string {
  return `Generate ${count} brand name candidates for the following brief:

Industry: ${brief.industry}
Keywords: ${brief.keywords.join(", ")}
Target audience: ${brief.targetAudience}
Tone: ${brief.tone}
Languages: ${brief.languages.join(", ")}
${brief.avoidWords?.length ? `Avoid words: ${brief.avoidWords.join(", ")}` : ""}

Return JSON: {"names": [{"name": "...", "rationale": "..."}]}`
}
