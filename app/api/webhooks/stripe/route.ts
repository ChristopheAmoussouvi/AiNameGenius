import { fail, ok } from "@/lib/api/response"
import { supabaseAdmin } from "@/lib/supabase/server"

// TODO: install stripe SDK and verify webhook signature
// import Stripe from "stripe"
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return fail("BAD_REQUEST", "Missing stripe-signature header.", 400)
  }

  // TODO: verify signature
  // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  // const body = await req.text()
  // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = await req.json()
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON payload.", 400)
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // TODO: credit user account
      const session = event.data.object
      console.log("Checkout completed:", session)
      break
    }
    case "invoice.payment_succeeded": {
      // TODO: handle subscription renewal credits
      break
    }
    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return ok({ received: true })
}
