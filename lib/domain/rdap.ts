// P0 VERSION — bounded concurrency, retry/backoff, Supabase cache
import { supabaseAdmin } from "@/lib/supabase/server"
import type { DomainStatus } from "@/types/ainamegenius"

const CONCURRENCY = Number(process.env.RDAP_CONCURRENCY ?? 4)
const MAX_RETRIES = 3
const TIMEOUT_MS = 4500

const RDAP_ENDPOINTS: Record<string, string> = {
  ".com": "https://rdap.verisign.com/com/v1/domain/",
  ".net": "https://rdap.verisign.com/net/v1/domain/",
  ".org": "https://rdap.publicinterestregistry.org/rdap/domain/",
  ".io":  "https://rdap.nic.io/domain/",
  ".co":  "https://rdap.nic.co/domain/",
  ".ai":  "https://rdap.nic.ai/domain/",
  ".fr":  "https://rdap.nic.fr/domain/",
  ".eu":  "https://rdap.eu/domain/",
}

// Dependency-free bounded parallel map
async function mapWithConcurrency<I, O>(
  items: I[],
  limit: number,
  worker: (item: I) => Promise<O>,
): Promise<O[]> {
  const results: O[] = new Array(items.length)
  let index = 0

  async function run(): Promise<void> {
    while (index < items.length) {
      const i = index++
      results[i] = await worker(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, run)
  await Promise.all(workers)
  return results
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

async function fetchRdapOnce(url: string): Promise<{ status: number; ok: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return { status: res.status, ok: res.ok }
  } finally {
    clearTimeout(timer)
  }
}

export async function checkDomainRdap(
  name: string,
  tld: string,
  options?: { skipCache?: boolean },
): Promise<DomainStatus> {
  // Check cache first
  if (!options?.skipCache) {
    const { data } = await supabaseAdmin
      .from("domain_results")
      .select("status")
      .eq("name", name)
      .eq("tld", tld)
      .gt("checked_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (data?.status) return data.status as DomainStatus
  }

  const baseUrl = RDAP_ENDPOINTS[tld]
  if (!baseUrl) return "unknown"

  const url = `${baseUrl}${name}${tld}`
  let status: DomainStatus = "unknown"

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 500 + Math.random() * 200
        await new Promise((r) => setTimeout(r, delay))
      }

      const res = await fetchRdapOnce(url)

      if (res.status === 404) {
        status = "available"
        break
      } else if (res.ok) {
        status = "taken"
        break
      } else if (!isRetryable(res.status)) {
        status = "unknown"
        break
      }
      // retryable: loop
    } catch {
      // timeout or network error — retry
    }
  }

  // Write to cache
  await supabaseAdmin.from("domain_results").upsert(
    { name, tld, status, checked_at: new Date().toISOString() },
    { onConflict: "name,tld" },
  )

  return status
}

export async function checkDomainsRdap(
  names: string[],
  tlds: string[],
): Promise<Array<{ name: string; tld: string; status: DomainStatus }>> {
  const pairs = names.flatMap((name) => tlds.map((tld) => ({ name, tld })))

  const results = await mapWithConcurrency(pairs, CONCURRENCY, async (pair) => {
    const status = await checkDomainRdap(pair.name, pair.tld)
    return { ...pair, status }
  })

  return results
}
