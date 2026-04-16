import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { getAccessSourceForUser } from "@/lib/billing/getEffectivePlanTier";

type BillingProfile = {
  plan_tier?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
};

async function ensureStripeCustomer(args: {
  stripe: ReturnType<typeof getStripe>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email?: string | null;
  existingCustomerId?: string | null;
}) {
  const { stripe, supabase, userId, email, existingCustomerId } = args;

  if (existingCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(existingCustomerId);

      if (!("deleted" in existingCustomer && existingCustomer.deleted)) {
        return existingCustomer.id;
      }
    } catch (error) {
      console.warn("Saved Stripe customer could not be retrieved, creating a new one.", {
        userId,
        existingCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customer.id,
    })
    .eq("id", userId);

  if (updateProfileError) {
    throw new Error(updateProfileError.message);
  }

  return customer.id;
}

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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("plan_tier, subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const profile = (profileData ?? undefined) as BillingProfile | undefined;
    const accessSource = getAccessSourceForUser(user.email, profile);

    if (accessSource === "subscription") {
      return NextResponse.json(
        { error: "This account already has an active Pro subscription." },
        { status: 400 }
      );
    }

    if (accessSource === "admin_bypass") {
      return NextResponse.json(
        { error: "This admin account already has Pro access without billing." },
        { status: 400 }
      );
    }

    if (accessSource === "profile_override") {
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

    const customerId = await ensureStripeCustomer({
      stripe,
      supabase,
      userId: user.id,
      email: user.email,
      existingCustomerId: profile?.stripe_customer_id ?? null,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing/cancel`,
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