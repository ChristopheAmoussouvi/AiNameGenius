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

export const BrandKitResponseSchema = z.object({
  tagline: z.string().min(1).max(120),
  voice: z.string().min(1).max(240),
  palette: z
    .array(
      z.object({
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be #RRGGBB hex"),
        role: z.string().min(1).max(40),
        name: z.string().min(1).max(40),
      }),
    )
    .min(3)
    .max(6),
  typography: z.object({
    heading: z.object({
      family: z.string().min(1).max(60),
      weight: z.number().int().min(100).max(900),
    }),
    body: z.object({
      family: z.string().min(1).max(60),
      weight: z.number().int().min(100).max(900),
    }),
  }),
})
