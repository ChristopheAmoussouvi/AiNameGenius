// One-time credit packs (no subscriptions). Prices are created inline in the
// Stripe Checkout Session via price_data — no Stripe dashboard products needed.

export interface CreditPack {
  id: string
  name: string
  credits: number
  priceEur: number
  highlight?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 50, priceEur: 9 },
  { id: "pro", name: "Pro", credits: 150, priceEur: 19, highlight: true },
  { id: "business", name: "Business", credits: 500, priceEur: 49 },
]

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}
