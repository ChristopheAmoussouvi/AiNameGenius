// P0 NEW FILE — deterministic scoring. LLM never returns `total`.
import type { DomainStatus } from "@/types/ainamegenius"

export type TrademarkStatus = "clear" | "caution" | "conflict" | "incomplete"

export interface SubjectiveScore {
  brandability: number
  memorability: number
  pronounceability: number
  distinctiveness: number
  internationalFit: number
  descriptiveRisk: number
  linguisticRisk: number
}

export interface DomainFact {
  tld: string
  status: DomainStatus
}

export interface ScoreInputs {
  subjective: SubjectiveScore
  domains: DomainFact[]
  trademark: TrademarkStatus
}

export interface ScoreBreakdown {
  brandScore: number
  linguisticScore: number
  domainScore: number
  trademarkScore: number
  total: number
  weights: typeof WEIGHTS
}

export const WEIGHTS = {
  brand: 0.3,
  linguistic: 0.15,
  domain: 0.3,
  trademark: 0.25,
} as const

const TLD_WEIGHTS: Record<string, number> = { ".com": 0.6, ".fr": 0.4 }

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

function domainAvailabilityScore(status: DomainStatus): number {
  switch (status) {
    case "available":
      return 1
    case "premium":
      return 0.5
    case "taken":
      return 0
    default:
      return 0.25
  }
}

export function computeDomainScore(domains: DomainFact[]): number {
  if (!domains.length) return 25
  let weightSum = 0
  let acc = 0
  for (const d of domains) {
    const w = TLD_WEIGHTS[d.tld] ?? 0.1
    weightSum += w
    acc += w * domainAvailabilityScore(d.status)
  }
  if (weightSum === 0) return 25
  return clamp((acc / weightSum) * 100)
}

export function computeTrademarkScore(status: TrademarkStatus): number {
  switch (status) {
    case "clear":
      return 100
    case "caution":
      return 55
    case "conflict":
      return 10
    default:
      return 40
  }
}

export function computeBrandScore(s: SubjectiveScore): number {
  return clamp((s.brandability + s.memorability + s.distinctiveness) / 3)
}

export function computeLinguisticScore(s: SubjectiveScore): number {
  const positive = (s.pronounceability + s.internationalFit) / 2
  const penalty = 0.5 * s.descriptiveRisk + 0.5 * s.linguisticRisk
  return clamp(positive - penalty * 0.5)
}

export function computeScore(inputs: ScoreInputs): ScoreBreakdown {
  const brandScore = computeBrandScore(inputs.subjective)
  const linguisticScore = computeLinguisticScore(inputs.subjective)
  const domainScore = computeDomainScore(inputs.domains)
  const trademarkScore = computeTrademarkScore(inputs.trademark)
  const total = clamp(
    WEIGHTS.brand * brandScore +
      WEIGHTS.linguistic * linguisticScore +
      WEIGHTS.domain * domainScore +
      WEIGHTS.trademark * trademarkScore,
  )
  return {
    brandScore: Math.round(brandScore),
    linguisticScore: Math.round(linguisticScore),
    domainScore: Math.round(domainScore),
    trademarkScore: Math.round(trademarkScore),
    total: Math.round(total),
    weights: WEIGHTS,
  }
}
