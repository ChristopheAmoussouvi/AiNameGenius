// Core types for AINameGenius

export type JobStatus = "pending" | "running" | "completed" | "failed"
export type DomainStatus = "available" | "taken" | "premium" | "unknown"
export type TrademarkStatus = "clear" | "caution" | "conflict" | "incomplete"
export type RiskLevel = "low" | "medium" | "high"
export type Tld = ".com" | ".fr"

export interface ProjectBrief {
  industry: string
  keywords: string[]
  targetAudience: string
  tone: string
  languages: string[]
  avoidWords?: string[]
}

export interface NameCandidate {
  id: string
  name: string
  rationale: string
}

// P0 FIX: removed `total: number` — total is computed server-side by lib/scoring/score.ts
export interface NameScore {
  brandability: number
  memorability: number
  pronounceability: number
  distinctiveness: number
  internationalFit: number
  descriptiveRisk: number
  linguisticRisk: number
}

export interface DomainCheckResult {
  name: string
  tld: Tld
  status: DomainStatus
  affiliateUrl?: string
}

export interface JobPayload {
  jobId: string
  projectId: string
  userId: string
  type: string
  status: JobStatus
  createdAt: string
  updatedAt: string
  result?: unknown
  error?: string
}
