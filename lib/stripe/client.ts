import Stripe from "stripe"

const secret = process.env.STRIPE_SECRET_KEY

// apiVersion is intentionally omitted — the SDK pins a compatible default,
// which avoids the version-literal type mismatch on upgrades.
export const stripe = new Stripe(secret ?? "")

export function stripeEnabled(): boolean {
  return Boolean(secret)
}
