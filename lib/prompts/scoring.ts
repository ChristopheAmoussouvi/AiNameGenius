import type { ProjectBrief, NameCandidate } from "@/types/ainamegenius"

// P0 FIX: removed `total` from example JSON and instructions.
// Total is computed deterministically server-side by lib/scoring/score.ts.
export function buildScoringSystemPrompt(): string {
  return `You are a brand name scoring expert. Score each name on subjective linguistic and brand criteria.

RULES:
- Return ONLY valid JSON: {"scores": {"<name>": { ...scores }}}
- Score each criterion 0–100 (integers)
- DO NOT include a "total" field — it will be computed server-side
- DO NOT assess domain or trademark availability — you have no access to those systems
- Be calibrated: avoid inflating scores; reserve 90+ for exceptional names

CRITERIA (all 0–100):
- brandability: How strong is this as a brand name? (memorable, distinct, evocative)
- memorability: How easy is it to remember after hearing once?
- pronounceability: How easy to say in the target languages?
- distinctiveness: How different from existing brands in the industry?
- internationalFit: How well does it work across cultures and languages?
- descriptiveRisk: How likely is it to be refused trademark for being too descriptive? (higher = more risk)
- linguisticRisk: Any negative connotations, homophones, or offensive meanings? (higher = more risk)

EXAMPLE OUTPUT:
{
  "scores": {
    "Lumevo": {
      "brandability": 82,
      "memorability": 78,
      "pronounceability": 90,
      "distinctiveness": 85,
      "internationalFit": 80,
      "descriptiveRisk": 10,
      "linguisticRisk": 5
    }
  }
}

OUTPUT: JSON only. No markdown, no text outside the JSON object.`
}

export function buildScoringUserPrompt(
  brief: ProjectBrief,
  candidates: NameCandidate[],
): string {
  const nameList = candidates.map((c) => `- ${c.name}`).join("\n")
  return `Score the following brand name candidates for this brief:

Industry: ${brief.industry}
Target audience: ${brief.targetAudience}
Tone: ${brief.tone}
Languages: ${brief.languages.join(", ")}

Names to score:
${nameList}

Return JSON: {"scores": {"<name>": { brandability, memorability, pronounceability, distinctiveness, internationalFit, descriptiveRisk, linguisticRisk }}}`
}
