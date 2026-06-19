"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import {
  Spinner, SkeletonCard, NameCard, TLD_ORDER,
  type PoolEntry, type TmRisk, type DomStatus,
} from "@/components/results"

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "done" | "skeleton" | "names" | "tm"
type Filter = "all" | "available" | "lowrisk"

// ─── Constants ────────────────────────────────────────────────────────────────

const POOL: PoolEntry[] = [
  {
    name: "Lumevo", tagline: "Bright ideas. Smarter growth.", score: 91, tm: "clear",
    chips: ["AI Suggested", "Brandable", "Short"],
    bars: { Brandability: 94, Memorability: 88, Distinctiveness: 90, Pronunciation: 92, "International fit": 89 },
    dom: { ".com": "available", ".net": "available", ".org": "taken", ".io": "available", ".co": "available", ".ai": "premium", ".fr": "available", ".eu": "available" },
  },
  {
    name: "Zephyra", tagline: "Calm power for ambitious teams.", score: 88, tm: "clear",
    chips: ["AI Suggested", "Brandable"],
    bars: { Brandability: 90, Memorability: 85, Distinctiveness: 92, Pronunciation: 80, "International fit": 91 },
    dom: { ".com": "taken", ".net": "available", ".org": "available", ".io": "available", ".co": "taken", ".ai": "available", ".fr": "available", ".eu": "available" },
  },
  {
    name: "Fluxio", tagline: "Momentum, built in.", score: 82, tm: "clear",
    chips: ["Brandable", "Short", "Tech"],
    bars: { Brandability: 85, Memorability: 84, Distinctiveness: 78, Pronunciation: 88, "International fit": 80 },
    dom: { ".com": "available", ".net": "taken", ".org": "taken", ".io": "available", ".co": "available", ".ai": "available", ".fr": "taken", ".eu": "available" },
  },
  {
    name: "Novaq", tagline: "A new spark for your category.", score: 84, tm: "caution",
    chips: ["AI Suggested", "Short"],
    bars: { Brandability: 82, Memorability: 90, Distinctiveness: 75, Pronunciation: 86, "International fit": 83 },
    dom: { ".com": "available", ".net": "available", ".org": "available", ".io": "available", ".co": "premium", ".ai": "available", ".fr": "taken", ".eu": "available" },
  },
  {
    name: "Quanto", tagline: "Measured. Trusted. Bold.", score: 76, tm: "clear",
    chips: ["Brandable"],
    bars: { Brandability: 78, Memorability: 74, Distinctiveness: 70, Pronunciation: 82, "International fit": 75 },
    dom: { ".com": "taken", ".net": "available", ".org": "available", ".io": "taken", ".co": "taken", ".ai": "premium", ".fr": "available", ".eu": "available" },
  },
  {
    name: "Verdano", tagline: "Grounded growth, naturally.", score: 67, tm: "caution",
    chips: ["Brandable", "Short"],
    bars: { Brandability: 70, Memorability: 66, Distinctiveness: 62, Pronunciation: 72, "International fit": 64 },
    dom: { ".com": "taken", ".net": "taken", ".org": "available", ".io": "available", ".co": "available", ".ai": "taken", ".fr": "available", ".eu": "taken" },
  },
]

const INDUSTRIES = ["Tech", "E-commerce", "Health", "Finance", "Education", "Food & Drink", "Travel", "Creative", "Other"]

const PROGRESS: Record<Phase, { pct: string; label: string }> = {
  skeleton: { pct: "28%",  label: "Generating name candidates…" },
  names:    { pct: "60%",  label: "Running trademark pre-checks…" },
  tm:       { pct: "86%",  label: "Checking domain availability…" },
  done:     { pct: "100%", label: "Done" },
}

const STEPS = [
  { n: "1", icon: "✏️", iconBg: "rgba(132,148,255,.15)", title: "Describe your brief",    body: "Tell us your idea, industry and tone. A sentence or two is enough for the model to work with." },
  { n: "2", icon: "⚡", iconBg: "rgba(99,103,255,.18)",  title: "Generate & verify",      body: "We craft brandable names, score them, run INPI trademark pre-checks and check 8 domain extensions — in parallel." },
  { n: "3", icon: "🚀", iconBg: "rgba(201,190,255,.16)", title: "Register in one click",  body: "Found the one? Grab the domain instantly through Namecheap, GoDaddy or Hostinger." },
]

// ─── API helpers ──────────────────────────────────────────────────────────────

function mergeApiData(
  candidates: Array<{ id: string; name: string; rationale: string }>,
  scores: Array<{ candidate_id: string; brandability: number; memorability: number; pronounceability: number; distinctiveness: number; international_fit: number; total: number }>,
  domResults: Array<{ name: string; tld: string; status: string }>,
  tmResults: Array<{ name: string; risk: string }>,
): PoolEntry[] {
  return candidates.map(c => {
    const sc = scores.find(s => s.candidate_id === c.id)
    const dom: Record<string, DomStatus> = Object.fromEntries(TLD_ORDER.map(t => [t, "taken" as DomStatus]))
    for (const d of domResults.filter(r => r.name === c.name)) {
      if (d.status === "available" || d.status === "taken" || d.status === "premium") {
        dom[d.tld] = d.status as DomStatus
      }
    }
    const risk = tmResults.find(t => t.name === c.name)?.risk
    const tm: TmRisk = risk === "clear" || risk === "caution" || risk === "conflict" ? risk : "caution"
    return {
      name: c.name,
      tagline: c.rationale?.slice(0, 80) ?? "",
      score: sc?.total ?? 75,
      tm,
      chips: ["AI Suggested"],
      bars: {
        Brandability: sc?.brandability ?? 75,
        Memorability: sc?.memorability ?? 75,
        Distinctiveness: sc?.distinctiveness ?? 75,
        Pronunciation: sc?.pronounceability ?? 75,
        "International fit": sc?.international_fit ?? 75,
      },
      dom,
    }
  })
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, session, signOut } = useAuth()

  const [brief, setBrief]       = useState("")
  const [industry, setIndustry] = useState("Tech")
  const [count, setCount]       = useState(10)
  const [phase, setPhase]       = useState<Phase>("done")
  const [filter, setFilter]     = useState<Filter>("all")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [buyOpen, setBuyOpen]   = useState<string | null>(null)
  const [livePool, setLivePool] = useState<PoolEntry[] | null>(null)

  const resultsRef = useRef<HTMLElement>(null)
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const handleGenerate = useCallback(async () => {
    clearTimers()
    setPhase("skeleton")
    setFilter("all")
    setExpanded({})
    setBuyOpen(null)
    setLivePool(null)
    requestAnimationFrame(() => {
      if (resultsRef.current) {
        const y = resultsRef.current.getBoundingClientRect().top + window.scrollY - 70
        window.scrollTo({ top: y, behavior: "smooth" })
      }
    })

    const token = session?.access_token
    if (!token) {
      timers.current.push(setTimeout(() => setPhase("names"), 1500))
      timers.current.push(setTimeout(() => setPhase("tm"),    2900))
      timers.current.push(setTimeout(() => setPhase("done"),  4100))
      return
    }

    try {
      const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

      const projRes = await fetch("/api/projects", {
        method: "POST", headers: h,
        body: JSON.stringify({
          name: brief.slice(0, 50) || "My Brand",
          brief: { industry, keywords: [industry.toLowerCase()], targetAudience: "Entrepreneurs and startups", tone: "Professional and innovative", languages: ["fr", "en"] },
          disclaimer_accepted: true,
        }),
      })
      if (!projRes.ok) throw new Error("create project failed")
      const { data: proj } = await projRes.json()

      const genRes = await fetch(`/api/projects/${proj.id}/generate`, {
        method: "POST", headers: h,
        body: JSON.stringify({ count }),
      })
      if (!genRes.ok) throw new Error("generate failed")
      const { data: genData } = await genRes.json()
      const candidates: Array<{ id: string; name: string; rationale: string }> = genData.candidates ?? []
      const cNames = candidates.map(c => c.name)

      setLivePool(candidates.slice(0, count).map(c => ({
        name: c.name, tagline: c.rationale?.slice(0, 80) ?? "", score: 75,
        tm: "caution" as TmRisk, chips: ["AI Suggested"],
        bars: { Brandability: 75, Memorability: 75, Distinctiveness: 75, Pronunciation: 75, "International fit": 75 },
        dom: Object.fromEntries(TLD_ORDER.map(t => [t, "taken" as DomStatus])),
      })))
      setPhase("names")

      const [domRes, tmRes] = await Promise.all([
        fetch(`/api/projects/${proj.id}/domains`, { method: "POST", headers: h, body: JSON.stringify({ names: cNames, tlds: TLD_ORDER }) }),
        fetch(`/api/projects/${proj.id}/trademarks`, { method: "POST", headers: h, body: JSON.stringify({ names: cNames }) }),
      ])
      setPhase("tm")

      const [domJson, tmJson] = await Promise.all([
        domRes.ok ? domRes.json() : { data: [] },
        tmRes.ok ? tmRes.json() : { data: [] },
      ])

      const detailRes = await fetch(`/api/projects/${proj.id}`, { headers: h })
      const { data: detail } = detailRes.ok ? await detailRes.json() : { data: null }

      setLivePool(mergeApiData(candidates, detail?.scores ?? [], domJson.data ?? [], tmJson.data?.results ?? []))
      setPhase("done")
    } catch (err) {
      console.error("Generate error:", err)
      setLivePool(null)
      setPhase("done")
    }
  }, [session, brief, industry, count])

  useEffect(() => () => clearTimers(), [])

  const generating  = phase !== "done"
  const domLoading  = phase !== "done"
  const tmLoading   = phase === "skeleton" || phase === "names"
  const showSkeleton = phase === "skeleton"
  const showCards   = !showSkeleton
  const showFilters = phase === "done"
  const prog        = PROGRESS[phase]

  const displayPool = livePool ?? POOL
  const visiblePool = displayPool.slice(0, Math.min(count, displayPool.length))

  const filteredCards = showFilters ? visiblePool.filter(p => {
    if (filter === "available") return p.dom[".com"] === "available"
    if (filter === "lowrisk")  return p.score >= 70 && p.tm === "clear"
    return true
  }) : visiblePool

  const toggleBuy = useCallback((key: string | null) => setBuyOpen(k => k === key ? null : key), [])

  return (
    <div style={{ position: "relative", overflowX: "hidden", minHeight: "100vh", background: "#0B0E19", color: "#F2F1FF" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px,5vw,64px)", background: "rgba(11,14,25,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Image src="/mascot.png" alt="AINameGenius logo" width={38} height={38} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>
            <span style={{ color: "#8494FF" }}>AI</span><span style={{ color: "#FFFFFF" }}>Name</span><span style={{ color: "#6367FF" }}>Genius</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px,2vw,26px)", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a href="#how"      style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>How it works</a>
          <a href="#examples" style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Examples</a>
          {user ? (
            <>
              <Link href="/projects" style={{ color: "#C9CCDA", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>My projects</Link>
              <span style={{ fontSize: 13.5, color: "#8a90a4", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
              <button onClick={() => signOut()} style={{ height: 36, padding: "0 16px", borderRadius: 9, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#C9CCDA", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: "#C9CCDA", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Log in</Link>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 40, padding: "0 18px", borderRadius: 10, background: "#6367FF", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 22px rgba(99,103,255,.45)" }}>Sign up free</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative" }}>
        {/* background blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -120, left: "8%", width: 460, height: 460, borderRadius: "50%", background: "#6367FF", filter: "blur(120px)", opacity: .32 }} />
          <div style={{ position: "absolute", top: 120, right: -80, width: 420, height: 420, borderRadius: "50%", background: "#8494FF", filter: "blur(130px)", opacity: .22 }} />
          <div style={{ position: "absolute", bottom: -160, left: "40%", width: 380, height: 380, borderRadius: "50%", background: "#FFDBFD", filter: "blur(150px)", opacity: .12 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 38, maxWidth: 760, margin: "0 auto", padding: "clamp(44px,8vh,104px) 24px 60px", position: "relative", zIndex: 2 }}>
          {/* text block */}
          <div style={{ textAlign: "center", maxWidth: 720 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "rgba(132,148,255,.12)", border: "1px solid rgba(132,148,255,.28)", marginBottom: 22 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6FCF97", boxShadow: "0 0 10px #6FCF97" }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", color: "#C9BEFF", whiteSpace: "nowrap" }}>SMART NAMES. VERIFIED POTENTIAL.</span>
            </div>
            <h1 style={{ margin: "0 0 18px", fontSize: "clamp(38px,5.4vw,64px)", lineHeight: 1.04, fontWeight: 800, letterSpacing: "-.03em", color: "#fff" }}>
              Find the perfect name <br />for your{" "}
              <span style={{ background: "linear-gradient(100deg,#8494FF,#6367FF 55%,#C9BEFF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>brand</span>.
            </h1>
            <p style={{ margin: "0 0 26px auto", fontSize: "clamp(16px,1.6vw,19px)", lineHeight: 1.6, color: "#A9AFC3", maxWidth: 520 }}>
              Describe your idea and get brandable names — each with domain availability, INPI trademark pre-checks, and one-click registration. In about ten seconds.
            </p>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap", justifyContent: "center" }}>
              {[["10M+", "Names analyzed"], ["500K+", "Domains checked"], ["98%", "Love their name"]].map(([val, lbl], i, arr) => (
                <>
                  <div key={lbl}><div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{val}</div><div style={{ fontSize: 12.5, color: "#737a8f", fontWeight: 500 }}>{lbl}</div></div>
                  {i < arr.length - 1 && <div key={`sep${i}`} style={{ width: 1, background: "rgba(255,255,255,.1)" }} />}
                </>
              ))}
            </div>
          </div>

          {/* form card */}
          <div style={{ width: "100%", maxWidth: 620 }}>
            <div style={{ position: "relative", padding: 26, borderRadius: 22, background: "linear-gradient(165deg,rgba(31,36,51,.85),rgba(21,24,39,.92))", border: "1px solid rgba(255,255,255,.09)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", boxShadow: "0 24px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)" }}>
              <div style={{ position: "absolute", top: -1, left: 24, right: 24, height: 1, background: "linear-gradient(90deg,transparent,#6367FF,transparent)", opacity: .7 }} />
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#C9CCDA", marginBottom: 9, textAlign: "left" }}>Describe your project</label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Ex: a mobile coaching app for busy, active women…"
                rows={3}
                style={{ width: "100%", resize: "none", padding: "14px 15px", borderRadius: 12, background: "#0F1320", border: "1px solid rgba(255,255,255,.1)", color: "#F2F1FF", fontFamily: "inherit", fontSize: 15, lineHeight: 1.5, outline: "none" }}
              />
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 16 }}>
                <div style={{ flex: "1 1 150px", textAlign: "left" }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#8a90a4", marginBottom: 7 }}>Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: "100%", height: 44, padding: "0 12px", borderRadius: 11, background: "#0F1320", border: "1px solid rgba(255,255,255,.1)", color: "#F2F1FF", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, outline: "none", cursor: "pointer", appearance: "none" }}>
                    {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ flex: "1 1 150px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#8a90a4" }}>Suggestions</label>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#8494FF" }}>{count}</span>
                  </div>
                  <input type="range" min={5} max={20} step={1} value={count} onChange={e => setCount(+e.target.value)} style={{ width: "100%", height: 44, accentColor: "#6367FF", cursor: "pointer" }} />
                </div>
              </div>
              <button onClick={handleGenerate} disabled={generating} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 50, marginTop: 18, border: "none", borderRadius: 13, background: generating ? "#3a3e63" : "linear-gradient(95deg,#6367FF,#8494FF)", color: "#fff", fontFamily: "inherit", fontSize: 15.5, fontWeight: 800, cursor: generating ? "default" : "pointer", whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(99,103,255,.5)" }}>
                {generating && <Spinner size={16} />}
                <span>{generating ? "Generating…" : "Generate my names →"}</span>
              </button>
              {!user && <div style={{ marginTop: 11, fontSize: 12, color: "#6b7287", textAlign: "center" }}>No signup needed — your first batch is on us.</div>}
              {user && <div style={{ marginTop: 11, fontSize: 12, color: "#6b7287", textAlign: "center" }}>Generates real names with trademark & domain checks.</div>}
            </div>
          </div>
        </div>

        {/* floating badges */}
        <div className="float-a" style={{ position: "absolute", top: 140, right: "6%", zIndex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12, background: "rgba(21,24,39,.7)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(10px)", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(111,207,151,.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#6FCF97", fontSize: 11 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>lumevo.com</span>
          <span style={{ fontSize: 11, color: "#6FCF97", fontWeight: 600 }}>Free</span>
        </div>
        <div className="float-b" style={{ position: "absolute", bottom: 40, left: "5%", zIndex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 12, background: "rgba(21,24,39,.7)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(10px)", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#8494FF" }}>91</span>
          <span style={{ fontSize: 12, color: "#A9AFC3", fontWeight: 600 }}>Excellent potential</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(48px,8vh,90px) 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", color: "#8494FF", marginBottom: 12 }}>HOW IT WORKS</div>
          <h2 style={{ margin: 0, fontSize: "clamp(28px,3.6vw,40px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>From idea to owned domain in three steps</h2>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ flex: "1 1 280px", padding: 28, borderRadius: 18, background: "rgba(21,24,39,.6)", border: "1px solid rgba(255,255,255,.07)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -18, right: -6, fontSize: 96, fontWeight: 800, color: "rgba(99,103,255,.07)", lineHeight: 1 }}>{s.n}</div>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18, position: "relative" }}>{s.icon}</div>
              <h3 style={{ margin: "0 0 9px", fontSize: 19, fontWeight: 700, color: "#fff" }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#9aa0b4" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXAMPLES / RESULTS ── */}
      <section ref={resultsRef} id="examples" style={{ maxWidth: 1120, margin: "0 auto", padding: "8px 24px clamp(56px,9vh,100px)" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", color: "#8494FF", marginBottom: 12 }}>
            {generating ? "GENERATING" : "LIVE EXAMPLE"}
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "clamp(28px,3.6vw,40px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>
            {generating ? "Crafting your shortlist…" : "Names you could own today"}
          </h2>
          <p style={{ margin: "0 auto", maxWidth: 560, fontSize: 15, color: "#9aa0b4" }}>
            {generating
              ? "We generate, score, pre-check trademarks and verify domains in parallel."
              : "A sample run. Each name is scored, trademark-checked, and matched to available domains."}
          </p>
        </div>

        {/* progress bar */}
        {generating && (
          <div style={{ maxWidth: 520, margin: "26px auto 30px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
              <Spinner size={15} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#C9CCDA" }}>{prog.label}</span>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: prog.pct, borderRadius: 100, background: "linear-gradient(90deg,#6367FF,#8494FF)", boxShadow: "0 0 14px rgba(99,103,255,.6)", transition: "width .6s ease" }} />
            </div>
          </div>
        )}

        {/* filter chips */}
        {showFilters && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", margin: "24px 0 26px" }}>
            {(["all", "available", "lowrisk"] as Filter[]).map(f => {
              const labels: Record<Filter, string> = { all: "All", available: ".com available", lowrisk: "Low risk" }
              const active = filter === f
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ height: 36, padding: "0 16px", borderRadius: 100, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", background: active ? "#6367FF" : "rgba(255,255,255,.04)", color: active ? "#fff" : "#A9AFC3", border: `1px solid ${active ? "#6367FF" : "rgba(255,255,255,.1)"}` }}>
                  {labels[f]}
                </button>
              )
            })}
          </div>
        )}

        {/* skeleton cards */}
        {showSkeleton && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 20, marginTop: 30 }}>
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* name cards */}
        {showCards && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20, marginTop: 8 }}>
            {filteredCards.map((entry, i) => (
              <NameCard
                key={entry.name}
                entry={entry}
                cardIdx={visiblePool.indexOf(entry)}
                domLoading={domLoading}
                tmLoading={tmLoading}
                expanded={!!expanded[i]}
                buyOpen={buyOpen}
                onToggleExpand={() => setExpanded(ex => ({ ...ex, [i]: !ex[i] }))}
                onToggleBuy={toggleBuy}
              />
            ))}
          </div>
        )}

        {showFilters && filteredCards.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#737a8f" }}>
            <Image src="/mascot.png" alt="mascot" width={80} height={80} style={{ opacity: .4, marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No names match this filter.</div>
          </div>
        )}

        <p style={{ textAlign: "center", margin: "34px auto 0", maxWidth: 540, fontSize: 12.5, color: "#5b6275", lineHeight: 1.6 }}>
          AINameGenius provides domain and trademark pre-checks, not legal advice. Always confirm availability before registering.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "40px clamp(20px,5vw,64px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/mascot.png" alt="mascot" width={30} height={30} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>
              <span style={{ color: "#8494FF" }}>AI</span>Name<span style={{ color: "#6367FF" }}>Genius</span>
            </span>
            <span style={{ fontSize: 12, color: "#5b6275", marginLeft: 8 }}>Smart names. Verified potential.</span>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={{ color: "#9aa0b4", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>{l}</a>
            ))}
            <span style={{ color: "#5b6275", fontSize: 13 }}>© 2026 AINameGenius</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
