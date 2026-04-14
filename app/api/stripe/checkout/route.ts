import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const effectiveTier = getEffectivePlanTierForUser(user.email);

    if (effectiveTier === "pro") {
      return NextResponse.json(
        { error: "This account already has Pro access." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL." },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRO_PRICE_ID." },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing/cancel`,
      customer_email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE CHECKOUT ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected checkout error.",
      },
      { status: 500 }
    );
  }
}