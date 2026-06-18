// INPI API Gateway — Diffusion PI
// Endpoint: POST https://api-gateway.inpi.fr/services/apidiffusion/api/marques/search
// Auth: JHipster session + XSRF-TOKEN cookie
// Response: XML (application/xml)
//
// Required env vars:
//   INPI_USERNAME=amoussouvichris+ainamegenius@gmail.com
//   INPI_PASSWORD=<your password>

import { XMLParser } from "fast-xml-parser"

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
const SEARCH_URL = `${GATEWAY}/services/apidiffusion/api/marques/search`
const AUTH_URL = `${GATEWAY}/api/authentication`
const TIMEOUT_MS = 15_000

// In-process session cache (resets on Vercel cold start)
let sessionCookies: string | null = null
let xsrfToken: string | null = null
let sessionExpiresAt = 0

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["result", "field"].includes(name),
  allowBooleanAttributes: true,
})

// Extract a named field value from the INPI fields array
function getField(
  fields: Array<Record<string, unknown>>,
  name: string,
): string {
  const field = fields.find((f) => f["@_name"] === name)
  if (!field) return ""
  const val = field.value ?? (field.values as Record<string, unknown>)?.value
  if (Array.isArray(val)) return String(val[0] ?? "")
  return String(val ?? "")
}

function parseTrademarksXml(xml: string): { total: number; hits: TrademarkHit[] } {
  try {
    const doc = xmlParser.parse(xml)
    const search = doc?.trademarkSearch
    const total = Number(search?.metadata?.count ?? 0)
    const results: Array<Record<string, unknown>> =
      search?.results?.result ?? []

    const hits: TrademarkHit[] = results.map((result) => {
      const resultFields = (result as { fields?: { field?: Array<Record<string, unknown>> } })?.fields?.field
      const fields: Array<Record<string, unknown>> = Array.isArray(resultFields) ? resultFields : []
      return {
        name: getField(fields, "Mark"),
        status: getField(fields, "MarkCurrentStatusCode"),
        applicationNumber: getField(fields, "ApplicationNumber") || undefined,
      }
    })

    return { total, hits }
  } catch (err) {
    console.error("[trademark/inpi] XML parse error:", err)
    return { total: 0, hits: [] }
  }
}

function extractCookies(headers: Headers): {
  session: string | null
  xsrf: string | null
} {
  // Node.js 18+ fetch supports getSetCookie() — cast to any to avoid TS lib mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = headers as any
  const setCookieHeader: string[] =
    typeof h.getSetCookie === "function"
      ? (h.getSetCookie() as string[])
      : [h.get("set-cookie") ?? ""]

  let session: string | null = null
  let xsrf: string | null = null

  for (const cookie of setCookieHeader) {
    const parts = cookie.split(";")[0]
    if (parts.startsWith("JSESSIONID=") || parts.startsWith("SESSION=")) {
      session = parts
    }
    const xsrfMatch = cookie.match(/XSRF-TOKEN=([^;]+)/)
    if (xsrfMatch) xsrf = decodeURIComponent(xsrfMatch[1])
  }

  return { session, xsrf }
}

async function login(): Promise<boolean> {
  const username = process.env.INPI_USERNAME
  const password = process.env.INPI_PASSWORD
  if (!username || !password) return false

  try {
    // Step 1: get initial XSRF-TOKEN cookie from gateway
    const initRes = await fetch(GATEWAY, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const { xsrf: initXsrf } = extractCookies(initRes.headers)
    const csrf = initXsrf ?? ""

    // Step 2: authenticate
    const authRes = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrf,
        Cookie: `XSRF-TOKEN=${csrf}`,
      },
      body: JSON.stringify({ username, password, rememberMe: true }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    })

    if (!authRes.ok && authRes.status !== 302) {
      console.error(`[trademark/inpi] login failed: ${authRes.status}`)
      return false
    }

    const { session, xsrf: newXsrf } = extractCookies(authRes.headers)
    if (!session) {
      console.error("[trademark/inpi] no session cookie in auth response")
      return false
    }

    sessionCookies = `${session}; XSRF-TOKEN=${newXsrf ?? csrf}`
    xsrfToken = newXsrf ?? csrf
    // Sessions last ~30 min; refresh after 25 min
    sessionExpiresAt = Date.now() + 25 * 60 * 1000
    return true
  } catch (err) {
    console.error("[trademark/inpi] login error:", err)
    return false
  }
}

async function ensureSession(): Promise<boolean> {
  if (sessionCookies && xsrfToken && Date.now() < sessionExpiresAt) return true
  return login()
}

function isExactMatch(hit: string, query: string): boolean {
  return hit.trim().toLowerCase() === query.trim().toLowerCase()
}

function isSimilar(hit: string, query: string): boolean {
  const h = hit.trim().toLowerCase()
  const q = query.trim().toLowerCase()
  return h.startsWith(q) || q.startsWith(h) || h.includes(q) || q.includes(h)
}

// Only show active/registered trademarks as conflicts — expired ones are informational
const ACTIVE_STATUSES = [
  "marque enregistrée",
  "marque renouvelée",
  "marque publiée",
  "registered",
  "filed",
]

function isActive(status: string): boolean {
  return ACTIVE_STATUSES.some((s) => status.toLowerCase().includes(s))
}

export async function checkTrademarkInpi(name: string): Promise<TrademarkResult> {
  const ok = await ensureSession()
  if (!ok) {
    return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
  }

  try {
    const body = {
      collections: ["FR", "EU"],
      fields: ["ApplicationNumber", "Mark", "MarkCurrentStatusCode", "ukey"],
      position: 0,
      query: `[Mark=${name}]`,
      size: 10,
      sortList: ["APPLICATION_DATE DESC", "MARK ASC"],
      withCTMRevendication: false,
      withFacets: false,
    }

    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/xml",
        Cookie: sessionCookies!,
        "X-XSRF-TOKEN": xsrfToken!,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status === 401 || res.status === 403) {
      sessionCookies = null // force re-login next call
      console.error(`[trademark/inpi] ${res.status} — session expired`)
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    if (!res.ok) {
      console.error(`[trademark/inpi] search error ${res.status}`)
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    const xml = await res.text()
    const { total, hits } = parseTrademarksXml(xml)

    const activeHits = hits.filter((h) => isActive(h.status))
    const hasExactActive = activeHits.some((h) => isExactMatch(h.name, name))
    const hasSimilarActive = activeHits.some((h) => isSimilar(h.name, name))

    let risk: TrademarkRisk
    if (hasExactActive) {
      risk = "conflict"
    } else if (hasSimilarActive) {
      risk = "caution"
    } else if (total > 0) {
      // Expired/inactive trademarks found — low risk
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
