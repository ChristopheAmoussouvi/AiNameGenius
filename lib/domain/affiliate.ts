export function buildNamecheapAffiliateUrl(name: string, tld: string): string {
  const base =
    process.env.AFFILIATE_NAMECHEAP_BASE_URL ||
    "https://www.namecheap.com/domains/registration/results/"
  const domain = `${name}${tld}`
  const url = new URL(base)
  url.searchParams.set("domain", domain)
  return url.toString()
}
