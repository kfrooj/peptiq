import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";

type BillingProfile = {
  plan_tier?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/login", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("plan_tier, subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const profile = (profileData ?? undefined) as BillingProfile | undefined;

    const planTier = getEffectivePlanTierForUser(user.email, profile);

    if (planTier !== "pro") {
      return NextResponse.redirect(
        new URL("/pricing", process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL.");
    }

    const customerId = profile?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.redirect(
        new URL("/profile?error=no-billing-customer", appUrl)
      );
    }

    const stripe = getStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("STRIPE PORTAL SESSION ERROR:", error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const message =
      error instanceof Error ? error.message : "Could not open billing portal.";

    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(message)}`, appUrl)
    );
  }
}