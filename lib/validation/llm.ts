import { z } from "zod"

// P0 FIX: removed `total` — computed server-side by lib/scoring/score.ts
export const NameScoreSchema = z.object({
  brandability: z.number().int().min(0).max(100),
  memorability: z.number().int().min(0).max(100),
  pronounceability: z.number().int().min(0).max(100),
  distinctiveness: z.number().int().min(0).max(100),
  internationalFit: z.number().int().min(0).max(100),
  descriptiveRisk: z.number().int().min(0).max(100),
  linguisticRisk: z.number().int().min(0).max(100),
})

export const NameCandidateSchema = z.object({
  name: z.string().min(1).max(50),
  rationale: z.string().min(1).max(300),
})

export const GenerateNamesResponseSchema = z.object({
  names: z.array(NameCandidateSchema).min(1).max(200),
})

export const ScoreNamesResponseSchema = z.object({
  scores: z.record(z.string(), NameScoreSchema),
})
