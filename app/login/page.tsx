"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { supabaseBrowser } from "@/lib/supabase/client"

function Spinner() {
  return (
    <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/")
    router.refresh()
  }

  const inp: React.CSSProperties = {
    width: "100%", height: 46, padding: "0 14px", borderRadius: 11,
    background: "#0F1320", border: "1px solid rgba(255,255,255,.1)",
    color: "#F2F1FF", fontFamily: "inherit", fontSize: 15, outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E19", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: "#F2F1FF", fontFamily: "var(--font-jakarta), Inter, sans-serif" }}>
      {/* blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "10%", width: 400, height: 400, borderRadius: "50%", background: "#6367FF", filter: "blur(130px)", opacity: .2 }} />
        <div style={{ position: "absolute", bottom: -80, right: "5%", width: 360, height: 360, borderRadius: "50%", background: "#8494FF", filter: "blur(120px)", opacity: .15 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, textDecoration: "none" }}>
          <Image src="/mascot.png" alt="AINameGenius" width={34} height={34} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>
            <span style={{ color: "#8494FF" }}>AI</span><span style={{ color: "#FFFFFF" }}>Name</span><span style={{ color: "#6367FF" }}>Genius</span>
          </span>
        </Link>

        <div style={{ width: "100%", padding: "32px 28px", borderRadius: 22, background: "linear-gradient(165deg,rgba(31,36,51,.9),rgba(21,24,39,.95))", border: "1px solid rgba(255,255,255,.09)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          <div style={{ position: "absolute", top: -1, left: 24, right: 24, height: 1, background: "linear-gradient(90deg,transparent,#6367FF,transparent)", opacity: .7 }} />
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>Welcome back</h1>
          <p style={{ margin: "0 0 26px", fontSize: 14, color: "#9aa0b4" }}>Sign in to your AINameGenius account</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#8a90a4", marginBottom: 7 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#8a90a4", marginBottom: 7 }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(244,143,104,.1)", border: "1px solid rgba(244,143,104,.3)", fontSize: 13.5, color: "#F48F68" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, marginTop: 6, border: "none", borderRadius: 13, background: loading ? "#3a3e63" : "linear-gradient(95deg,#6367FF,#8494FF)", color: "#fff", fontFamily: "inherit", fontSize: 15.5, fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: "0 10px 28px rgba(99,103,255,.4)" }}>
              {loading && <Spinner />}
              <span>{loading ? "Signing in…" : "Sign in →"}</span>
            </button>
          </form>

          <p style={{ marginTop: 22, textAlign: "center", fontSize: 13.5, color: "#737a8f" }}>
            No account?{" "}
            <Link href="/signup" style={{ color: "#8494FF", fontWeight: 700, textDecoration: "none" }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
