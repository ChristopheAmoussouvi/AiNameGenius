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

// ─── API row shapes ─────────────────────────────────────────────────────────

interface Candidate { id: string; name: string; rationale: string | null }
interface Score {
  candidate_id: string; brandability: number; memorability: number
  pronounceability: number; distinctiveness: number; international_fit: number; total: number
}
interface TrademarkRow { name: string; status: string }
interface DomainRow { name: string; tld: string; status: string }
interface ProjectDetail {
  id: string
  name: string
  brief: { industry?: string } | null
  created_at: string
  name_candidates: Candidate[]
  scores: Score[]
  trademark_results: TrademarkRow[]
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

  const toggleBuy = useCallback((key: string | null) => setBuyOpen(k => k === key ? null : key), [])

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

        const names: string[] = (data.name_candidates as Candidate[]).map(c => c.name)
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
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/projects" style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>My projects</Link>
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

      <p style={{ textAlign: "center", margin: "34px auto 0", maxWidth: 540, fontSize: 12.5, color: "#5b6275", lineHeight: 1.6 }}>
        AINameGenius provides domain and trademark pre-checks, not legal advice. Always confirm availability before registering.
      </p>
    </>
  )
}
