"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"

interface ProjectRow {
  id: string
  name: string
  brief: { industry?: string } | null
  created_at: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, session, signOut, loading: authLoading } = useAuth()

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!session) { router.push("/login"); return }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/projects", { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (!res.ok) throw new Error("Failed to load projects.")
        const { data } = await res.json()
        if (!cancelled) { setProjects(data ?? []); setLoading(false) }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [session, authLoading, router])

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E19", color: "#F2F1FF", fontFamily: "var(--font-jakarta), Inter, sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px,5vw,64px)", background: "rgba(11,14,25,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <Image src="/mascot.png" alt="AINameGenius" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>
            <span style={{ color: "#8494FF" }}>AI</span><span style={{ color: "#FFFFFF" }}>Name</span><span style={{ color: "#6367FF" }}>Genius</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/" style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>New project</Link>
          {user && <button onClick={() => signOut()} style={{ height: 36, padding: "0 16px", borderRadius: 9, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#C9CCDA", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Sign out</button>}
        </div>
      </nav>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(28px,5vh,56px) 24px clamp(56px,9vh,100px)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>My projects</h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "#9aa0b4" }}>Your saved name searches and results.</p>
          </div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 20px", borderRadius: 11, background: "#6367FF", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 22px rgba(99,103,255,.4)" }}>+ New project</Link>
        </div>

        {authLoading || loading ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "#737a8f", fontSize: 15 }}>Loading…</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "#F48F68", fontSize: 15 }}>{error}</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <Image src="/mascot.png" alt="mascot" width={88} height={88} style={{ opacity: .4, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F2F1FF", marginBottom: 8 }}>No projects yet</div>
            <p style={{ fontSize: 14, color: "#9aa0b4", marginBottom: 20 }}>Generate your first batch of names to get started.</p>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 11, background: "#6367FF", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Generate names →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                padding: "18px 22px", borderRadius: 16, textDecoration: "none",
                background: "linear-gradient(165deg,rgba(31,36,51,.6),rgba(21,24,39,.8))",
                border: "1px solid rgba(255,255,255,.08)", transition: "border-color .15s",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 12.5, color: "#737a8f", flexWrap: "wrap" }}>
                    {p.brief?.industry && <span style={{ color: "#8494FF", fontWeight: 600 }}>{p.brief.industry}</span>}
                    <span>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                <span style={{ flexShrink: 0, color: "#8494FF", fontSize: 18, fontWeight: 700 }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
