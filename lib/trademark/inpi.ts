// INPI Data API — https://data.inpi.fr
// Requires: INPI_API_KEY env var (get it at https://data.inpi.fr/register)
//
// Authentication: Bearer token
// Endpoint: GET /marques?q=QUERY&range=0-9&sort=score

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

const INPI_API = "https://data.inpi.fr"
const TIMEOUT_MS = 10_000

function isExactMatch(hit: string, query: string): boolean {
  return hit.trim().toLowerCase() === query.trim().toLowerCase()
}

function isSimilar(hit: string, query: string): boolean {
  const h = hit.trim().toLowerCase()
  const q = query.trim().toLowerCase()
  return h.startsWith(q) || q.startsWith(h) || h.includes(q) || q.includes(h)
}

export async function checkTrademarkInpi(name: string): Promise<TrademarkResult> {
  const apiKey = process.env.INPI_API_KEY
  if (!apiKey) {
    return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
  }

  try {
    const url = new URL(`${INPI_API}/marques`)
    url.searchParams.set("q", name)
    url.searchParams.set("range", "0-9")
    url.searchParams.set("sort", "score")

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status === 401) {
      console.error("[trademark/inpi] Invalid API key")
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    if (!res.ok) {
      console.error(`[trademark/inpi] API error ${res.status}`)
      return { risk: "incomplete", total: 0, hits: [], source: "inpi" }
    }

    const data = await res.json()

    // INPI response: { total: number, marques: Array<{ denomination, etat, numeroDepot, classes }> }
    const trademarks: Array<Record<string, unknown>> = data?.marques ?? data?.hits ?? data?.results ?? []
    const total: number = data?.total ?? trademarks.length

    const hits: TrademarkHit[] = trademarks.map((t) => ({
      name: String(t.denomination ?? t.name ?? t.titre ?? ""),
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
