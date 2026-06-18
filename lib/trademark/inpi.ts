// INPI API Gateway — Diffusion PI
// Service: apidiffusion — https://api-gateway.inpi.fr/services/apidiffusion
// Swagger: https://api-gateway.inpi.fr/swagger-ui/index.html (select "apidiffusion")
//
// Auth: JHipster UAA — OAuth2 password grant via gateway
//   POST /oauth/token (client: web_app / changeit)
//
// Required env vars:
//   INPI_USERNAME=amoussouvichris+ainamegenius@gmail.com
//   INPI_PASSWORD=<your password>

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

const GATEWAY = "https://api-gateway.inpi.fr"
const TOKEN_URL = `${GATEWAY}/oauth/token`
const SEARCH_URL = `${GATEWAY}/services/apidiffusion/api/marques/search`
const TIMEOUT_MS = 12_000

// JHipster default client credentials (base64 of "web_app:changeit")
const CLIENT_BASIC = "d2ViX2FwcDpjaGFuZ2VpdA=="

// In-process token cache (resets on cold start / Vercel function restart)
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${CLIENT_BASIC}`,
      },
      body: new URLSearchParams({
        grant_type: "password",
        username,
        password,
        scope: "openid",
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
    const body = {
      denomination: name,
      office: ["FR", "EU"],
      from: 0,
      size: 10,
    }

    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status === 401) {
      cachedToken = null
      console.error("[trademark/inpi] 401 — token expired, will refresh next call")
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    if (!res.ok) {
      console.error(`[trademark/inpi] search error ${res.status}`)
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    const data = await res.json()

    // Response shape: { total, results: [...] } or { hits: { total, hits: [...] } }
    // Adjust once confirmed from Swagger UI "Try it out"
    const trademarks: Array<Record<string, unknown>> =
      data?.trademarks ??
      data?.results ??
      data?.hits?.hits ??
      data?.content ??
      []

    const total: number =
      data?.total ??
      data?.hits?.total ??
      data?.totalElements ??
      trademarks.length

    const hits: TrademarkHit[] = trademarks.map((t) => {
      const denomination =
        t.denomination ??
        t.markLabel ??
        t.trademarkName ??
        t.name ??
        t.titre ??
        ""
      return {
        name: String(denomination),
        status: String(t.status ?? t.etat ?? t.statusLabel ?? ""),
        applicationNumber: t.applicationNumber
          ? String(t.applicationNumber)
          : t.numeroDepot
            ? String(t.numeroDepot)
            : undefined,
        classes: Array.isArray(t.classes) ? (t.classes as number[]) : undefined,
      }
    })

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
    console.error("[trademark/inpi] search failed:", err)
    return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
  }
}
