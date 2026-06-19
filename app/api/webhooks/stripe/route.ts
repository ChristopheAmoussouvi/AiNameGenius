import { ok, fail } from "@/lib/api/response"
import { stripe, stripeEnabled } from "@/lib/stripe/client"
import { supabaseAdmin } from "@/lib/supabase/server"
import { grantCredits } from "@/lib/credits/ledger"
import type Stripe from "stripe"

export const runtime = "nodejs"

export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return fail("INTERNAL_ERROR", "Payments are not configured.", 503)
  }

  const signature = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) {
    return fail("BAD_REQUEST", "Missing stripe-signature header or webhook secret.", 400)
  }

  // Stripe signature verification requires the raw, unparsed request body.
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return fail("BAD_REQUEST", `Webhook signature verification failed: ${message}`, 400)
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const credits = Number(session.metadata?.credits ?? 0)
    const reason = `stripe:${session.id}`

    if (userId && credits > 0 && session.payment_status === "paid") {
      // Idempotency — Stripe may retry; only credit a session once.
      const { data: existing } = await supabaseAdmin
        .from("credits_ledger")
        .select("id")
        .eq("reason", reason)
        .maybeSingle()

      if (!existing) {
        await grantCredits({ userId, amount: credits, reason })
      }
    }
  }

  return ok({ received: true })
}
