import Stripe from "stripe"

let client: Stripe | null = null

// Lazy init — never construct Stripe at module load (it throws without a key,
// which would break `next build` page-data collection when the key is unset).
export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error("Missing STRIPE_SECRET_KEY")
  if (!client) client = new Stripe(secret)
  return client
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
