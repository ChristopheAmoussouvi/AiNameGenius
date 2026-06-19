import { requireUserId } from "@/lib/auth/current-user"
import { ok, fail } from "@/lib/api/response"
import { stripe, stripeEnabled } from "@/lib/stripe/client"
import { getPack } from "@/lib/billing/packs"
import { z } from "zod"

export const runtime = "nodejs"

const CheckoutSchema = z.object({ packId: z.string().min(1).max(40) })

export async function POST(req: Request) {
  const auth = await requireUserId(req)
  if (auth.error) return auth.error

  if (!stripeEnabled()) {
    return fail("INTERNAL_ERROR", "Payments are not configured (STRIPE_SECRET_KEY).", 503)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body.")
  }

  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Validation error.", 400, parsed.error.flatten())
  }

  const pack = getPack(parsed.data.packId)
  if (!pack) return fail("NOT_FOUND", "Unknown credit pack.", 404)

  const base = process.env.APP_BASE_URL ?? new URL(req.url).origin

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: auth.userId,
      ...(auth.email ? { customer_email: auth.email } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: pack.priceEur * 100,
            product_data: {
              name: `${pack.name} — ${pack.credits} credits`,
              description: `AINameGenius credit pack (${pack.credits} credits)`,
            },
          },
        },
      ],
      metadata: {
        userId: auth.userId,
        packId: pack.id,
        credits: String(pack.credits),
      },
      success_url: `${base}/projects?purchase=success`,
      cancel_url: `${base}/pricing?canceled=1`,
    })

    return ok({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return fail("UPSTREAM_ERROR", `Stripe checkout failed: ${message}`, 502)
  }
}
