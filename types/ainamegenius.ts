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

export interface BrandPaletteColor {
  hex: string
  role: string
  name: string
}

export interface BrandFont {
  family: string
  weight: number
}

export interface BrandKitContent {
  tagline: string
  voice: string
  palette: BrandPaletteColor[]
  typography: { heading: BrandFont; body: BrandFont }
}

export interface BrandLogo {
  url: string
  style: string
}

// Shape stored in brand_kits.data (jsonb)
export interface BrandKitData extends BrandKitContent {
  name: string
  logos: BrandLogo[]
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
