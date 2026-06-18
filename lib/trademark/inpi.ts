// INPI API Gateway — https://api-gateway.inpi.fr
// Docs: https://api-gateway.inpi.fr/docs
//
// Auth: OAuth2 resource-owner password flow
//   POST /oauth/token  { username, password, grant_type: "password" }
//   → { access_token, expires_in }
//
// Required env vars:
//   INPI_USERNAME=amoussouvichris+ainamegenius@gmail.com
//   INPI_PASSWORD=<your password>
//
// The token is cached in-process (valid for ~3600s).

export type TrademarkRisk = "clear" | "caution" | "conflict" | "incomplete"

export type TrademarkHit = {
  name: string
  status: string
  applicationNumber?: string
  classes?: number[]
}

export type TrademarkResult = {
  risk: TrademarkRisk
  total: number
  hits: TrademarkHit[]
  source: "inpi"
}

const BASE = "https://api-gateway.inpi.fr"
const TOKEN_URL = `${BASE}/oauth/token`
const TIMEOUT_MS = 10_000

// In-process token cache (reset on cold start)
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getToken(): Promise<string | null> {
  const username = process.env.INPI_USERNAME
  const password = process.env.INPI_PASSWORD
  if (!username || !password) return null

  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) return cachedToken

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        username,
        password,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(`[trademark/inpi] token error ${res.status}`)
      return null
    }

    const data = await res.json()
    cachedToken = data.access_token ?? null
    tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000
    return cachedToken
  } catch (err) {
    console.error("[trademark/inpi] token fetch failed:", err)
    return null
  }
}

function isExactMatch(hit: string, query: string): boolean {
  return hit.trim().toLowerCase() === query.trim().toLowerCase()
}

function isSimilar(hit: string, query: string): boolean {
  const h = hit.trim().toLowerCase()
  const q = query.trim().toLowerCase()
  return h.startsWith(q) || q.startsWith(h) || h.includes(q) || q.includes(h)
}

export async function checkTrademarkInpi(name: string): Promise<TrademarkResult> {
  const token = await getToken()
  if (!token) {
    return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
  }

  try {
    // Marques endpoint — adjust path once confirmed in /docs
    const url = new URL(`${BASE}/api/v1/marques`)
    url.searchParams.set("q", name)
    url.searchParams.set("range", "0-9")
    url.searchParams.set("sort", "score")

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status === 401) {
      cachedToken = null // force refresh next call
      console.error("[trademark/inpi] 401 — token may be expired")
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    if (!res.ok) {
      console.error(`[trademark/inpi] API error ${res.status}`)
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    const data = await res.json()

    const trademarks: Array<Record<string, unknown>> =
      data?.marques ?? data?.hits ?? data?.results ?? data?.content ?? []
    const total: number = data?.total ?? data?.totalElements ?? trademarks.length

    const hits: TrademarkHit[] = trademarks.map((t) => ({
      name: String(t.denomination ?? t.name ?? t.titre ?? t.label ?? ""),
      status: String(t.etat ?? t.status ?? t.statut ?? ""),
      applicationNumber: t.numeroDepot ? String(t.numeroDepot) : undefined,
      classes: Array.isArray(t.classes) ? (t.classes as number[]) : undefined,
    }))

    const hasExact = hits.some((h) => isExactMatch(h.name, name))
    const hasSimilar = hits.some((h) => isSimilar(h.name, name))

    let risk: TrademarkRisk
    if (hasExact) {
      risk = "conflict"
    } else if (hasSimilar || total > 0) {
      risk = "caution"
    } else {
      risk = "clear"
    }

    return { risk, total, hits, source: "inpi" }
  } catch (err) {
    console.error("[trademark/inpi] fetch failed:", err)
    return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
  }
}
