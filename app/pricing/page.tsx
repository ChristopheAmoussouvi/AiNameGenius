"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth/context"
import { CREDIT_PACKS } from "@/lib/billing/packs"

function Spinner() {
  return <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
}

export default function PricingPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function buy(packId: string) {
    if (authLoading) return
    if (!session) { router.push("/login"); return }
    setBusy(packId)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      })
      const json = await res.json()
      if (!res.ok || !json.data?.url) throw new Error(json?.error?.message ?? "Checkout failed.")
      window.location.href = json.data.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setBusy(null)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E19", color: "#F2F1FF", fontFamily: "var(--font-jakarta), Inter, sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(20px,5vw,64px)", background: "rgba(11,14,25,.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <Image src="/mascot.png" alt="AINameGenius" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>
            <span style={{ color: "#8494FF" }}>AI</span><span style={{ color: "#FFFFFF" }}>Name</span><span style={{ color: "#6367FF" }}>Genius</span>
          </span>
        </Link>
        <Link href="/projects" style={{ color: "#A9AFC3", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>My projects</Link>
      </nav>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(40px,7vh,80px) 24px clamp(56px,9vh,100px)" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", color: "#8494FF", marginBottom: 12 }}>CREDITS</div>
          <h1 style={{ margin: "0 0 10px", fontSize: "clamp(30px,4.4vw,46px)", fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>Buy credits</h1>
          <p style={{ margin: "0 auto", maxWidth: 520, fontSize: 15.5, color: "#9aa0b4", lineHeight: 1.6 }}>
            Pay as you go — no subscription. Credits never expire. Name generation costs 1, a full brand kit with logos costs 5.
          </p>
        </div>

        {error && (
          <div style={{ maxWidth: 520, margin: "20px auto 0", padding: "11px 15px", borderRadius: 11, background: "rgba(244,143,104,.1)", border: "1px solid rgba(244,143,104,.3)", fontSize: 13.5, color: "#F48F68", textAlign: "center" }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 40 }}>
          {CREDIT_PACKS.map(pack => (
            <div key={pack.id} style={{
              position: "relative", display: "flex", flexDirection: "column", padding: 26, borderRadius: 20,
              background: pack.highlight ? "linear-gradient(165deg,rgba(99,103,255,.18),rgba(21,24,39,.9))" : "linear-gradient(165deg,rgba(31,36,51,.6),rgba(21,24,39,.85))",
              border: `1px solid ${pack.highlight ? "rgba(132,148,255,.5)" : "rgba(255,255,255,.08)"}`,
              boxShadow: pack.highlight ? "0 20px 50px rgba(99,103,255,.3)" : "0 16px 40px rgba(0,0,0,.35)",
            }}>
              {pack.highlight && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: 100, background: "#6367FF", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", color: "#fff" }}>POPULAR</div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: "#C9CCDA" }}>{pack.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>€{pack.priceEur}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: "#8494FF" }}>{pack.credits} credits</div>
              <div style={{ fontSize: 12.5, color: "#737a8f", marginTop: 4 }}>
                ≈ {pack.credits} name batches · {Math.floor(pack.credits / 5)} brand kits
              </div>
              <button onClick={() => buy(pack.id)} disabled={busy !== null} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, marginTop: 22, border: "none", borderRadius: 13,
                background: busy === pack.id ? "#3a3e63" : pack.highlight ? "linear-gradient(95deg,#6367FF,#8494FF)" : "rgba(255,255,255,.08)",
                color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer",
                border: pack.highlight ? "none" : "1px solid rgba(255,255,255,.14)",
              }}>
                {busy === pack.id && <Spinner />}
                <span>{busy === pack.id ? "Redirecting…" : "Buy now →"}</span>
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", margin: "34px auto 0", maxWidth: 540, fontSize: 12.5, color: "#5b6275", lineHeight: 1.6 }}>
          Secure payment via Stripe. New accounts start with 10 free credits.
        </p>
      </main>
    </div>
  )
}
