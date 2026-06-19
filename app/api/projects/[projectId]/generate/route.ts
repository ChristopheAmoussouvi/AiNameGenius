// P0 FIX: added maxDuration=60, runtime=nodejs, and deterministic scoring via computeScore
import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"
import { generateNameCandidates, scoreNameCandidates } from "@/lib/llm/naming"
import { computeScore } from "@/lib/scoring/score"
import { GenerateNamesSchema } from "@/lib/validation/project"
import { trackEvent } from "@/lib/events/track"
import { spendCredits, grantCredits } from "@/lib/credits/ledger"
import { CREDIT_COSTS } from "@/lib/credits/costs"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", auth.userId)
    .single()

  if (projectError || !project) {
    return fail("NOT_FOUND", "Project not found.", 404)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const parsed = GenerateNamesSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const { count } = parsed.data
  const brief = project.brief

  const spend = await spendCredits({
    userId: auth.userId,
    projectId,
    amount: CREDIT_COSTS.name_generation,
    reason: "name_generation",
  })
  if (!spend.ok) {
    return fail("PAYMENT_REQUIRED", "Not enough credits. Buy more to generate names.", 402)
  }

  try {
    const candidates = await generateNameCandidates(brief, count)
    const subjectiveScores = await scoreNameCandidates(brief, candidates)

    const candidateInserts = candidates.map((c) => ({
      project_id: projectId,
      name: c.name,
      rationale: c.rationale,
    }))

    const { data: insertedCandidates, error: insertError } = await supabaseAdmin
      .from("name_candidates")
      .insert(candidateInserts)
      .select()

    if (insertError) {
      return fail("INTERNAL_ERROR", insertError.message, 500)
    }

    const scoreInserts = insertedCandidates
      .map((candidate) => {
        const subjective = subjectiveScores[candidate.name]
        if (!subjective) return null

        const breakdown = computeScore({
          subjective,
          domains: [],
          trademark: "incomplete",
        })

        return {
          candidate_id: candidate.id,
          project_id: projectId,
          brandability: subjective.brandability,
          memorability: subjective.memorability,
          pronounceability: subjective.pronounceability,
          distinctiveness: subjective.distinctiveness,
          international_fit: subjective.internationalFit,
          descriptive_risk: subjective.descriptiveRisk,
          linguistic_risk: subjective.linguisticRisk,
          brand_score: breakdown.brandScore,
          linguistic_score: breakdown.linguisticScore,
          domain_score: breakdown.domainScore,
          trademark_score: breakdown.trademarkScore,
          total: breakdown.total,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)

    if (scoreInserts.length > 0) {
      await supabaseAdmin.from("scores").insert(scoreInserts)
    }

    await trackEvent({
      userId: auth.userId,
      projectId,
      type: "names_generated",
      properties: { count: candidates.length },
    })

    return ok({
      candidates: insertedCandidates,
      scored: scoreInserts.length,
    })
  } catch (err) {
    // Refund the credit if generation failed.
    await grantCredits({
      userId: auth.userId,
      projectId,
      amount: CREDIT_COSTS.name_generation,
      reason: "refund:name_generation",
    }).catch(() => {})
    const message = err instanceof Error ? err.message : "Unknown error"
    return fail("INTERNAL_ERROR", `Generation failed: ${message}`, 500)
  }
}
