import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

function mapStripeStatusToProfileStatus(
  status: Stripe.Subscription.Status | string
) {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function getPlanTierFromSubscriptionStatus(
  status: Stripe.Subscription.Status | string
) {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.current_period_end
    ? new Date(
        subscription.items.data[0].current_period_end * 1000
      ).toISOString()
    : null;
}

async function updateProfileFromSubscription(
  supabaseUserId: string,
  subscription: Stripe.Subscription,
  source: string
) {
  const supabase = createAdminClient();

  const payload = {
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    plan_tier: getPlanTierFromSubscriptionStatus(subscription.status),
    subscription_status: mapStripeStatusToProfileStatus(subscription.status),
    subscription_current_period_end: getSubscriptionPeriodEnd(subscription),
  };

  console.log(`[STRIPE WEBHOOK] Updating profile from ${source}`, {
    supabaseUserId,
    payload,
  });

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", supabaseUserId)
    .select(
      "id, stripe_customer_id, plan_tier, subscription_status, subscription_current_period_end"
    );

  if (error) {
    console.error("[STRIPE WEBHOOK] Supabase update error:", error);
    throw new Error(error.message);
  }

  console.log("[STRIPE WEBHOOK] Updated rows:", data);
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new Response("Missing webhook signature or secret.", {
        status: 400,
      });
    }

    const stripe = getStripe();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return new Response(
        `Webhook signature verification failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        { status: 400 }
      );
    }

    console.log("[STRIPE WEBHOOK] Event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabaseUserId = session.metadata?.supabase_user_id;

      if (supabaseUserId) {
        const supabase = createAdminClient();

        const payload = {
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null,
          plan_tier: "pro",
          subscription_status: "active",
        };

        const { data, error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", supabaseUserId)
          .select("id, stripe_customer_id, plan_tier, subscription_status");

        console.log("[STRIPE WEBHOOK] Checkout session profile update:", {
          supabaseUserId,
          data,
          error,
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const supabaseUserId = subscription.metadata?.supabase_user_id;

      if (supabaseUserId) {
        await updateProfileFromSubscription(
          supabaseUserId,
          subscription,
          event.type
        );
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("STRIPE WEBHOOK ROUTE ERROR:", err);

    return new Response(
      `Webhook handler failed: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}