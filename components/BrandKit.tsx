"use client"

import { useState } from "react"
import type { BrandKitData } from "@/types/ainamegenius"

function googleFontHref(families: string[]): string {
  const params = families
    .map(f => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join("&")
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

function Swatch({ hex, name, role }: { hex: string; name: string; role: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
      style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, overflow: "hidden", background: "transparent", cursor: "pointer", textAlign: "left" }}
    >
      <div style={{ height: 64, background: hex }} />
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F2F1FF" }}>{name}</div>
        <div style={{ fontSize: 11, color: "#737a8f", fontFamily: "monospace" }}>{copied ? "Copied!" : hex}</div>
        <div style={{ fontSize: 10, color: "#5b6275", marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{role}</div>
      </div>
    </button>
  )
}

export function BrandKit({
  data, onRegenerate, regenerating,
}: {
  data: BrandKitData
  onRegenerate?: () => void
  regenerating?: boolean
}) {
  const fonts = [data.typography.heading.family, data.typography.body.family]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* Load the kit's Google Fonts so the previews are accurate */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontHref(fonts)} />

      {/* tagline + voice */}
      <div style={{ padding: 22, borderRadius: 16, background: "linear-gradient(165deg,rgba(31,36,51,.7),rgba(21,24,39,.85))", border: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8494FF", marginBottom: 10 }}>TAGLINE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", fontFamily: `'${data.typography.heading.family}', sans-serif`, letterSpacing: "-.01em" }}>{data.tagline}</div>
        <div style={{ fontSize: 13.5, color: "#9aa0b4", marginTop: 12, fontFamily: `'${data.typography.body.family}', sans-serif` }}>{data.voice}</div>
      </div>

      {/* logos */}
      {data.logos.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8494FF" }}>LOGO CONCEPTS</div>
            {onRegenerate && (
              <button onClick={onRegenerate} disabled={regenerating} style={{ height: 32, padding: "0 14px", borderRadius: 9, background: "transparent", border: "1px solid rgba(132,148,255,.4)", color: "#8494FF", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: regenerating ? "default" : "pointer", opacity: regenerating ? .6 : 1 }}>
                {regenerating ? "Regenerating…" : "↻ Regenerate"}
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
            {data.logos.map((logo, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", background: "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.url} alt={`${data.name} ${logo.style} logo`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "contain", display: "block" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", background: "#15182a" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#C9CCDA", textTransform: "capitalize" }}>{logo.style}</span>
                  <a href={logo.url} download target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 700, color: "#8494FF", textDecoration: "none" }}>Download ↓</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* palette */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8494FF", marginBottom: 12 }}>COLOR PALETTE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12 }}>
          {data.palette.map((c, i) => <Swatch key={i} hex={c.hex} name={c.name} role={c.role} />)}
        </div>
      </div>

      {/* typography */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8494FF", marginBottom: 12 }}>TYPOGRAPHY</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {([["Heading", data.typography.heading], ["Body", data.typography.body]] as const).map(([label, font]) => (
            <div key={label} style={{ padding: 18, borderRadius: 14, background: "rgba(21,24,39,.6)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", color: "#737a8f", marginBottom: 8 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 28, color: "#fff", fontFamily: `'${font.family}', sans-serif`, fontWeight: font.weight as number }}>Aa</div>
              <div style={{ fontSize: 13, color: "#C9CCDA", marginTop: 6, fontFamily: `'${font.family}', sans-serif` }}>{font.family} {font.weight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
