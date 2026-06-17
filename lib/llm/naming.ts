import { generateStrictJson } from "@/lib/llm/openai"
import {
  buildNamingSystemPrompt,
  buildNamingUserPrompt,
} from "@/lib/prompts/naming"
import {
  buildScoringSystemPrompt,
  buildScoringUserPrompt,
} from "@/lib/prompts/scoring"
import {
  GenerateNamesResponseSchema,
  ScoreNamesResponseSchema,
} from "@/lib/validation/llm"
import type { ProjectBrief, NameCandidate } from "@/types/ainamegenius"

export async function generateNameCandidates(
  brief: ProjectBrief,
  count: number,
): Promise<NameCandidate[]> {
  const result = await generateStrictJson({
    system: buildNamingSystemPrompt(),
    user: buildNamingUserPrompt(brief, count),
    schema: GenerateNamesResponseSchema,
  })

  return result.names.map((n, i) => ({
    id: `candidate-${i}`,
    name: n.name,
    rationale: n.rationale,
  }))
}

// P0 FIX: removed `total: s.total` — total is computed server-side by lib/scoring/score.ts
export async function scoreNameCandidates(
  brief: ProjectBrief,
  candidates: NameCandidate[],
): Promise<Record<string, Omit<import("@/types/ainamegenius").NameScore, never>>> {
  const result = await generateStrictJson({
    system: buildScoringSystemPrompt(),
    user: buildScoringUserPrompt(brief, candidates),
    schema: ScoreNamesResponseSchema,
  })

  const out: Record<string, import("@/types/ainamegenius").NameScore> = {}
  for (const [name, s] of Object.entries(result.scores)) {
    out[name] = {
      brandability: s.brandability,
      memorability: s.memorability,
      pronounceability: s.pronounceability,
      distinctiveness: s.distinctiveness,
      internationalFit: s.internationalFit,
      descriptiveRisk: s.descriptiveRisk,
      linguisticRisk: s.linguisticRisk,
    }
  }
  return out
}
