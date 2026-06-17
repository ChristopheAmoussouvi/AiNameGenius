export type RegistrarLinks = {
  namecheap: string
  godaddy: string
  hostinger: string
}

export function buildAffiliateLinks(name: string, tld: string): RegistrarLinks {
  const domain = `${name}${tld}`

  const namecheapUrl = new URL(
    process.env.AFFILIATE_NAMECHEAP_BASE_URL ??
      "https://www.namecheap.com/domains/registration/results/",
  )
  namecheapUrl.searchParams.set("domain", domain)
  if (process.env.AFFILIATE_NAMECHEAP_ID) {
    namecheapUrl.searchParams.set("aff", process.env.AFFILIATE_NAMECHEAP_ID)
  }

  const godaddyUrl = new URL("https://www.godaddy.com/domainsearch/find")
  godaddyUrl.searchParams.set("domainToCheck", domain)
  if (process.env.AFFILIATE_GODADDY_ID) {
    godaddyUrl.searchParams.set("isc", process.env.AFFILIATE_GODADDY_ID)
  }

  // Hostinger uses `ref` as affiliate param on their domain search
  const hostingerUrl = new URL("https://www.hostinger.fr/domaines")
  hostingerUrl.searchParams.set("domain", domain)
  if (process.env.AFFILIATE_HOSTINGER_ID) {
    hostingerUrl.searchParams.set("ref", process.env.AFFILIATE_HOSTINGER_ID)
  }

  return {
    namecheap: namecheapUrl.toString(),
    godaddy: godaddyUrl.toString(),
    hostinger: hostingerUrl.toString(),
  }
}

// Kept for backward compatibility
export function buildNamecheapAffiliateUrl(name: string, tld: string): string {
  return buildAffiliateLinks(name, tld).namecheap
}
