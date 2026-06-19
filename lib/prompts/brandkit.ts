import type { ProjectBrief } from "@/types/ainamegenius"

export function buildBrandKitSystemPrompt(): string {
  return `You are a senior brand identity designer. Given a brand name and its brief, you produce a concise, professional brand kit.

RULES:
- Return ONLY valid JSON matching this schema:
  {
    "tagline": "...",                       // 2–6 words, punchy
    "voice": "...",                         // 1 sentence describing tone of voice
    "palette": [                             // 4 to 5 colors
      { "hex": "#RRGGBB", "role": "primary|secondary|accent|neutral|background", "name": "Human color name" }
    ],
    "typography": {
      "heading": { "family": "Google Font name", "weight": 700 },
      "body":    { "family": "Google Font name", "weight": 400 }
    }
  }
- All hex values MUST be 6-digit uppercase hex starting with '#'.
- The palette must be cohesive and fit the industry and tone. Include one primary, supporting colors, and a neutral/background.
- Typography families MUST be real, free Google Fonts (e.g. Inter, Sora, Manrope, Plus Jakarta Sans, Fraunces, Space Grotesk, DM Sans, Poppins). Pair a distinctive heading font with a readable body font.
- Keep everything brand-appropriate; no markdown, no commentary outside the JSON.

OUTPUT: JSON only.`
}

export function buildBrandKitUserPrompt(brief: ProjectBrief, name: string): string {
  return `Create a brand kit for the brand name "${name}".

Industry: ${brief.industry}
Keywords: ${brief.keywords.join(", ")}
Target audience: ${brief.targetAudience}
Tone: ${brief.tone}
Languages: ${brief.languages.join(", ")}

Return JSON only.`
}

// ─── Logo image prompts (Gemini image generation) ──────────────────────────────

export type LogoStyle = "wordmark" | "emblem" | "abstract"

export const LOGO_STYLES: LogoStyle[] = ["wordmark", "emblem", "abstract"]

export function buildLogoPrompt(opts: {
  name: string
  brief: ProjectBrief
  primaryHex: string
  style: LogoStyle
}): string {
  const { name, brief, primaryHex, style } = opts
  const styleDirection: Record<LogoStyle, string> = {
    wordmark: `a clean modern wordmark logo spelling "${name}" in a custom, distinctive typeface`,
    emblem: `a compact emblem / badge logo for "${name}", with a simple iconic symbol paired with the name`,
    abstract: `a minimalist abstract logo mark symbolizing "${name}", a single memorable geometric icon`,
  }
  return `Design ${styleDirection[style]}.
Industry: ${brief.industry}. Brand tone: ${brief.tone}.
Use the primary brand color ${primaryHex} with a clean, professional palette.
Flat vector style, high contrast, centered, generous padding, plain solid white background.
No mockups, no photography, no extra text, no watermark. Production-ready logo, crisp edges.`
}
