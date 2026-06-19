"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"
import {
  NameCard, TLD_ORDER,
  type PoolEntry, type TmRisk, type DomStatus,
} from "@/components/results"
import { BrandKit } from "@/components/BrandKit"
import type { BrandKitData } from "@/types/ainamegenius"

// ─── API row shapes ─────────────────────────────────────────────────────────

interface Candidate { id: string; name: string; rationale: string | null }
interface Score {
  candidate_id: string; brandability: number; memorability: number
  pronounceability: number; distinctiveness: number; international_fit: number; total: number
}
interface TrademarkRow { name: string; status: string }
interface DomainRow { name: string; tld: string; status: string }
interface BrandKitRow { data: BrandKitData | null }
interface ProjectDetail {
  id: string
  name: string
  brief: { industry?: string } | null
  created_at: string
  name_candidates: Candidate[]
  scores: Score[]
  trademark_results: TrademarkRow[]
  brand_kits: BrandKitRow[]
}

function buildPool(detail: ProjectDetail, domains: DomainRow[]): PoolEntry[] {
  return detail.name_candidates.map(c => {
    const sc = detail.scores.find(s => s.candidate_id === c.id)
    const dom: Record<string, DomStatus> = Object.fromEntries(TLD_ORDER.map(t => [t, "taken" as DomStatus]))
    for (const d of domains.filter(r => r.name === c.name)) {
      if (d.status === "available" || d.status === "taken" || d.status === "premium") dom[d.tld] = d.status
    }
    const st = detail.trademark_results.find(t => t.name === c.name)?.status
    const tm: TmRisk = st === "clear" || st === "caution" || st === "conflict" ? st : "caution"
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, session, signOut, loading: authLoading } = useAuth()

  const [detail, setDetail]     = useState<ProjectDetail | null>(null)
  const [pool, setPool]         = useState<PoolEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [domLoading, setDomLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [buyOpen, setBuyOpen]   = useState<string | null>(null)

  const [brandKit, setBrandKit]       = useState<BrandKitData | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [bkGenerating, setBkGenerating] = useState(false)
  const [bkRegenerating, setBkRegenerating] = useState(false)
  const [bkError, setBkError]         = useState<string | null>(null)

  const toggleBuy = useCallback((key: string | null) => setBuyOpen(k => k === key ? null : key), [])

  const generateBrandKit = useCallback(async () => {
    if (!session || !selectedName) return
    setBkGenerating(true)
    setBkError(null)
    try {
      const res = await fetch(`/api/projects/${id}/brand-kit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Generation failed.")
      setBrandKit(json.data)
    } catch (err) {
      setBkError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setBkGenerating(false)
    }
  }, [session, selectedName, id])

  const regenerateLogos = useCallback(async () => {
    if (!session) return
    setBkRegenerating(true)
    setBkError(null)
    try {
      const res = await fetch(`/api/projects/${id}/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Regeneration failed.")
      setBrandKit(json.data)
    } catch (err) {
      setBkError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setBkRegenerating(false)
    }
  }, [session, id])

  useEffect(() => {
    if (authLoading) return
    if (!session) { router.push("/login"); return }

    const token = session.access_token
    const h = { Authorization: `Bearer ${token}` }
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, { headers: h })
        if (!res.ok) throw new Error(res.status === 404 ? "Project not found." : "Failed to load project.")
        const { data } = await res.json()
        if (cancelled) return

        setDetail(data)
        setPool(buildPool(data, []))
        setLoading(false)

        const existingKit = (data.brand_kits as BrandKitRow[] | undefined)?.[0]?.data ?? null
        setBrandKit(existingKit)

        const names: string[] = (data.name_candidates as Candidate[]).map(c => c.name)
        setSelectedName(existingKit?.name ?? names[0] ?? "")
        if (names.length === 0) { setDomLoading(false); return }

        const domRes = await fetch(`/api/projects/${id}/domains`, {
          method: "POST",
          headers: { ...h, "Content-Type": "application/json" },
          body: JSON.stringify({ names, tlds: TLD_ORDER }),
        })
        const domJson = domRes.ok ? await domRes.json() : { data: [] }
        if (cancelled) return
        setPool(buildPool(data, domJson.data ?? []))
        setDomLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Unknown error")
        setLoading(false)
        setDomLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [id, session, authLoading, router])

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#0B0E19", color: "#F2F1FF", fontFamily: "var(--font-jakarta), Inter, sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px,5vw,64px)", background: "rgba(11,14,25,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <Image src="/mascot.png" alt="AINameGenius" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>
            <span style={{ color: "#8494FF" }}>AI</span><span style={{ color: "#FFFFFF" }}>Name</span><span style={{ color: "#6367FF" }}>Genius</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/projects" style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>My projects</Link>
          <Link href="/pricing" style={{ color: "#8494FF", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Buy credits</Link>
          {user && <button onClick={() => signOut()} style={{ height: 36, padding: "0 16px", borderRadius: 9, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#C9CCDA", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Sign out</button>}
        </div>
      </nav>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(28px,5vh,56px) 24px clamp(56px,9vh,100px)" }}>
        {children}
      </main>
    </div>
  )

  if (authLoading || loading) {
    return shell(
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#737a8f", fontSize: 15 }}>Loading project…</div>
    )
  }

  if (error || !detail) {
    return shell(
      <div style={{ textAlign: "center", padding: "70px 20px" }}>
        <Image src="/mascot.png" alt="mascot" width={80} height={80} style={{ opacity: .4, marginBottom: 16 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: "#F2F1FF", marginBottom: 8 }}>{error ?? "Project not found."}</div>
        <Link href="/projects" style={{ color: "#8494FF", textDecoration: "none", fontWeight: 700 }}>← Back to my projects</Link>
      </div>
    )
  }

  return shell(
    <>
      <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8a90a4", textDecoration: "none", fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>← My projects</Link>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>{detail.name}</h1>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13.5, color: "#737a8f" }}>
          {detail.brief?.industry && <span style={{ padding: "3px 11px", borderRadius: 100, background: "rgba(132,148,255,.12)", color: "#8494FF", fontWeight: 700 }}>{detail.brief.industry}</span>}
          <span>{detail.name_candidates.length} names</span>
          <span>· Created {new Date(detail.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {pool.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#737a8f" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>No names generated for this project yet.</div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 11, background: "#6367FF", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Generate names →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
          {pool.map((entry, i) => (
            <NameCard
              key={entry.name + i}
              entry={entry}
              cardIdx={i}
              domLoading={domLoading}
              tmLoading={false}
              expanded={!!expanded[i]}
              buyOpen={buyOpen}
              onToggleExpand={() => setExpanded(ex => ({ ...ex, [i]: !ex[i] }))}
              onToggleBuy={toggleBuy}
            />
          ))}
        </div>
      )}

      {/* ── BRAND IDENTITY ── */}
      {pool.length > 0 && (
        <section style={{ marginTop: 48, paddingTop: 36, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>Brand identity</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#9aa0b4" }}>Palette, typography, tagline and logo concepts for your chosen name.</p>
            </div>
            {!brandKit && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select value={selectedName} onChange={e => setSelectedName(e.target.value)} disabled={bkGenerating}
                  style={{ height: 44, padding: "0 12px", borderRadius: 11, background: "#0F1320", border: "1px solid rgba(255,255,255,.1)", color: "#F2F1FF", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                  {detail.name_candidates.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <button onClick={generateBrandKit} disabled={bkGenerating || !selectedName}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", border: "none", borderRadius: 11, background: bkGenerating ? "#3a3e63" : "linear-gradient(95deg,#6367FF,#8494FF)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: bkGenerating ? "default" : "pointer", boxShadow: "0 8px 22px rgba(99,103,255,.4)" }}>
                  {bkGenerating ? "Generating… (~30s)" : "Generate brand identity →"}
                </button>
              </div>
            )}
          </div>

          {bkError && (
            <div style={{ padding: "11px 15px", borderRadius: 11, background: "rgba(244,143,104,.1)", border: "1px solid rgba(244,143,104,.3)", fontSize: 13.5, color: "#F48F68", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>{bkError}</span>
              {bkError.toLowerCase().includes("credit") && (
                <Link href="/pricing" style={{ color: "#8494FF", fontWeight: 700, textDecoration: "none" }}>Buy credits →</Link>
              )}
            </div>
          )}

          {brandKit ? (
            <BrandKit data={brandKit} onRegenerate={regenerateLogos} regenerating={bkRegenerating} />
          ) : bkGenerating ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#9aa0b4", fontSize: 14.5 }}>
              Designing your brand — palette, fonts, tagline and logo concepts…
            </div>
          ) : (
            <div style={{ padding: "30px 24px", borderRadius: 16, background: "rgba(21,24,39,.5)", border: "1px dashed rgba(255,255,255,.12)", textAlign: "center", color: "#737a8f", fontSize: 14 }}>
              Pick a name above and generate its full brand identity.
            </div>
          )}
        </section>
      )}

      <p style={{ textAlign: "center", margin: "34px auto 0", maxWidth: 540, fontSize: 12.5, color: "#5b6275", lineHeight: 1.6 }}>
        AINameGenius provides domain and trademark pre-checks, not legal advice. Always confirm availability before registering.
      </p>
    </>
  )
}
