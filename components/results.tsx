"use client"

import { useRef, useEffect, type CSSProperties } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type TmRisk = "clear" | "caution" | "conflict"
export type DomStatus = "available" | "taken" | "premium"

export interface PoolEntry {
  name: string
  tagline: string
  score: number
  tm: TmRisk
  chips: string[]
  bars: Record<string, number>
  dom: Record<string, DomStatus>
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TLD_ORDER = [".com", ".net", ".org", ".io", ".co", ".ai", ".fr", ".eu"]

const CHIP_STYLE: Record<string, { color: string; bg: string }> = {
  "AI Suggested": { color: "#8494FF", bg: "rgba(132,148,255,.14)" },
  "Brandable":    { color: "#C9BEFF", bg: "rgba(201,190,255,.13)" },
  "Short":        { color: "#FFDBFD", bg: "rgba(255,219,253,.11)" },
  "Tech":         { color: "#8494FF", bg: "rgba(132,148,255,.10)" },
}

const TM_INFO: Record<TmRisk, { label: string; color: string; icon: string; bg: string; border: string; meta: string }> = {
  clear:    { label: "Trademark clear",      color: "#6FCF97", icon: "✓", bg: "rgba(111,207,151,.10)", border: "rgba(111,207,151,.28)", meta: "0 exact matches" },
  caution:  { label: "Review similar marks", color: "#FFCF95", icon: "⚠", bg: "rgba(255,207,149,.10)", border: "rgba(255,207,149,.28)", meta: "similar marks found" },
  conflict: { label: "Potential conflict",   color: "#F48F68", icon: "✕", bg: "rgba(244,143,104,.10)", border: "rgba(244,143,104,.28)", meta: "exact match" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function scoreColor(s: number) {
  return s >= 70 ? "#6FCF97" : s >= 50 ? "#FFCF95" : "#F48F68"
}

function scoreBg(s: number) {
  const rgb = s >= 70 ? "111,207,151" : s >= 50 ? "255,207,149" : "244,143,104"
  return { bg: `rgba(${rgb},.12)`, border: `rgba(${rgb},.3)` }
}

function buyLinks(name: string, tld: string) {
  const slug = (name + tld).toLowerCase()
  return [
    { name: "Namecheap", url: `https://www.namecheap.com/domains/registration/results/?domain=${slug}` },
    { name: "GoDaddy",   url: `https://www.godaddy.com/domainsearch/find?domainToCheck=${slug}` },
    { name: "Hostinger", url: `https://www.hostinger.com/domain-name-search?domain=${slug}` },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span className="spin" style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid rgba(132,148,255,.3)`, borderTopColor: "#8494FF", borderRadius: "50%",
    }} />
  )
}

export function SkeletonCard() {
  return (
    <div style={{ padding: 24, borderRadius: 18, background: "rgba(21,24,39,.6)", border: "1px solid rgba(255,255,255,.06)" }}>
      <div className="shimmer" style={{ height: 30, width: "55%", borderRadius: 8, background: "linear-gradient(90deg,#1c2030,#272c40,#1c2030)" }} />
      <div className="shimmer" style={{ height: 14, width: "80%", marginTop: 14, borderRadius: 6, background: "linear-gradient(90deg,#1c2030,#272c40,#1c2030)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 20 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ height: 34, borderRadius: 8, background: "#171b28" }} />)}
      </div>
      <div className="shimmer" style={{ height: 40, width: "100%", marginTop: 18, borderRadius: 10, background: "linear-gradient(90deg,#1c2030,#272c40,#1c2030)" }} />
    </div>
  )
}

function TldButton({
  name, cardIdx, tld, status, domLoading, buyOpen, onToggleBuy,
}: {
  name: string; cardIdx: number; tld: string; status: DomStatus; domLoading: boolean
  buyOpen: string | null; onToggleBuy: (key: string | null) => void
}) {
  const key = `${cardIdx}${tld}`
  const resolved = !domLoading
  const clickable = resolved && (status === "available" || status === "premium")
  const menuOpen = buyOpen === key
  const statusColor = status === "available" ? "#6FCF97" : status === "premium" ? "#FFCF95" : "#F48F68"
  const statusLabel = status === "available" ? "Free" : status === "premium" ? "Prem" : "Taken"

  const baseBtn: CSSProperties = {
    width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 2, padding: "8px 4px", borderRadius: 9, fontFamily: "inherit",
    background: "transparent", cursor: "default",
  }
  const btnStyle: CSSProperties = resolved
    ? clickable
      ? { ...baseBtn, background: status === "premium" ? "rgba(255,207,149,.07)" : "rgba(111,207,151,.07)", border: `1px solid ${status === "premium" ? "rgba(255,207,149,.35)" : "rgba(111,207,151,.32)"}`, cursor: "pointer" }
      : { ...baseBtn, background: "rgba(244,143,104,.05)", border: "1px solid rgba(244,143,104,.18)", opacity: 0.7 }
    : { ...baseBtn, background: "#161a27", border: "1px solid rgba(255,255,255,.05)" }

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggleBuy(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen, onToggleBuy])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={clickable ? () => onToggleBuy(menuOpen ? null : key) : undefined} style={btnStyle}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#C9CCDA" }}>{tld}</span>
        {!resolved
          ? <span style={{ fontSize: 10, color: "#5b6275" }}>···</span>
          : <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
        }
      </button>
      {menuOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 20, width: 158, padding: 8, borderRadius: 13,
          background: "#1F2433", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 18px 40px rgba(0,0,0,.55)",
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: "#737a8f", padding: "2px 6px 8px" }}>
            BUY {(name + tld).toLowerCase()} ON
          </div>
          {buyLinks(name, tld).map(b => (
            <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 10px", borderRadius: 9, textDecoration: "none", color: "#F2F1FF",
              fontSize: 13, fontWeight: 600,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,103,255,.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span>{b.name}</span><span style={{ color: "#8494FF" }}>→</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function NameCard({
  entry, cardIdx, domLoading, tmLoading, expanded, buyOpen,
  onToggleExpand, onToggleBuy,
}: {
  entry: PoolEntry; cardIdx: number; domLoading: boolean; tmLoading: boolean
  expanded: boolean; buyOpen: string | null
  onToggleExpand: () => void; onToggleBuy: (key: string | null) => void
}) {
  const sc = scoreColor(entry.score)
  const { bg: sBg, border: sBorder } = scoreBg(entry.score)
  const tm = TM_INFO[entry.tm]

  return (
    <div style={{
      display: "flex", flexDirection: "column", padding: 22, borderRadius: 18,
      background: "linear-gradient(165deg,rgba(31,36,51,.7),rgba(21,24,39,.85))",
      border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 16px 40px rgba(0,0,0,.35)",
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>{entry.name}</div>
          <div style={{ fontSize: 13, color: "#9aa0b4", marginTop: 3 }}>{entry.tagline}</div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, borderRadius: 13, background: sBg, border: `1px solid ${sBorder}` }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: sc }}>{entry.score}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", color: sc }}>/ 100</span>
        </div>
      </div>

      {/* chips */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
        {entry.chips.map(c => {
          const cs = CHIP_STYLE[c] ?? CHIP_STYLE["Brandable"]
          return <span key={c} style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 100, color: cs.color, background: cs.bg }}>{c}</span>
        })}
      </div>

      {/* trademark row */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, padding: "11px 13px", borderRadius: 11, background: tmLoading ? "rgba(255,255,255,.03)" : tm.bg, border: `1px solid ${tmLoading ? "rgba(255,255,255,.07)" : tm.border}` }}>
        {tmLoading
          ? <><Spinner /><span style={{ fontSize: 13, fontWeight: 600, color: "#8a90a4" }}>Checking trademark…</span></>
          : <><span style={{ fontSize: 14 }}>{tm.icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: tm.color }}>{tm.label}</span><span style={{ fontSize: 12, color: "#737a8f", marginLeft: "auto" }}>{tm.meta}</span></>
        }
      </div>

      {/* TLD grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(62px,1fr))", gap: 7, marginTop: 14 }}>
        {TLD_ORDER.map(tld => (
          <TldButton key={tld} name={entry.name} cardIdx={cardIdx} tld={tld} status={entry.dom[tld] ?? "taken"} domLoading={domLoading} buyOpen={buyOpen} onToggleBuy={onToggleBuy} />
        ))}
      </div>

      {/* expanded score bars */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", gap: 11 }}>
          {Object.entries(entry.bars).map(([label, val]) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#9aa0b4", fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#C9CCDA" }}>{val}</span>
              </div>
              <div style={{ height: 5, borderRadius: 100, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${val}%`, borderRadius: 100, background: scoreColor(val) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onToggleExpand} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 42, padding: "0 14px", borderRadius: 11, background: "transparent", border: "1px solid rgba(132,148,255,.4)", color: "#8494FF", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          {expanded ? "Hide" : "Scores"}
        </button>
        <a href="#" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, height: 42, borderRadius: 11, background: "#6367FF", color: "#fff", textDecoration: "none", fontSize: 13.5, fontWeight: 700, boxShadow: "0 8px 22px rgba(99,103,255,.4)" }}>
          Register domain →
        </a>
      </div>
    </div>
  )
}
