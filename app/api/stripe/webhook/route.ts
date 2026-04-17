import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getSubscriptionActivatedEmail } from "@/lib/email/templates/subscription-activated";
import { getSubscriptionCancelledEmail } from "@/lib/email/templates/subscription-cancelled";

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

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id ?? null;
}

async function findSupabaseUserIdFromCustomerId(customerId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error("[STRIPE WEBHOOK] Customer lookup error:", error);
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function resolveSupabaseUserId({
  metadataUserId,
  customerId,
  fallbackUserId,
}: {
  metadataUserId?: string | null;
  customerId?: string | null;
  fallbackUserId?: string | null;
}) {
  console.log("[STRIPE WEBHOOK] resolveSupabaseUserId input:", {
    metadataUserId,
    fallbackUserId,
    customerId,
  });

  if (metadataUserId) {
    console.log("[STRIPE WEBHOOK] Resolved via subscription metadata:", metadataUserId);
    return metadataUserId;
  }

  if (fallbackUserId) {
    console.log("[STRIPE WEBHOOK] Resolved via checkout session metadata:", fallbackUserId);
    return fallbackUserId;
  }

  if (customerId) {
    const resolved = await findSupabaseUserIdFromCustomerId(customerId);
    console.log("[STRIPE WEBHOOK] Resolved via stripe_customer_id lookup:", resolved);
    return resolved;
  }

  console.warn("[STRIPE WEBHOOK] Could not resolve Supabase user ID.");
  return null;
}

async function getProfileAndEmail(supabaseUserId: string) {
  const supabase = createAdminClient();

  const [{ data: profile, error: profileError }, { data: authUserResult, error: authError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name")
        .eq("id", supabaseUserId)
        .maybeSingle(),
      supabase.auth.admin.getUserById(supabaseUserId),
    ]);

  if (profileError) {
    console.error("[STRIPE WEBHOOK] Profile lookup error:", {
      supabaseUserId,
      error: profileError,
    });
    return null;
  }

  if (authError) {
    console.error("[STRIPE WEBHOOK] Auth user lookup error:", {
      supabaseUserId,
      error: authError,
    });
    return null;
  }

  const email = authUserResult.user?.email ?? null;
  if (!email) {
    return null;
  }

  return {
    name: (profile as { id: string; name: string | null } | null)?.name ?? null,
    email,
  };
}

async function sendSubscriptionActivatedEmail(supabaseUserId: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peptiq.uk";
  const profile = await getProfileAndEmail(supabaseUserId);

  if (!profile) {
    console.warn("[STRIPE WEBHOOK] Skipping activation email: missing profile/email", {
      supabaseUserId,
    });
    return;
  }

  const emailContent = getSubscriptionActivatedEmail({
    userName: profile.name,
    appUrl: `${siteUrl}/account`,
  });

  await sendPeptiqEmail({
    to: profile.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    fromType: "support",
    replyTo: process.env.SUPPORT_EMAIL || "support@peptiq.uk",
    tags: [
      { name: "category", value: "subscription-activated" },
      { name: "user_id", value: supabaseUserId },
    ],
  });
}

async function sendSubscriptionCancelledEmail(supabaseUserId: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peptiq.uk";
  const profile = await getProfileAndEmail(supabaseUserId);

  if (!profile) {
    console.warn("[STRIPE WEBHOOK] Skipping cancellation email: missing profile/email", {
      supabaseUserId,
    });
    return;
  }

  const emailContent = getSubscriptionCancelledEmail({
    userName: profile.name,
    appUrl: `${siteUrl}/pricing`,
  });

  await sendPeptiqEmail({
    to: profile.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    fromType: "support",
    replyTo: process.env.SUPPORT_EMAIL || "support@peptiq.uk",
    tags: [
      { name: "category", value: "subscription-cancelled" },
      { name: "user_id", value: supabaseUserId },
    ],
  });
}

async function updateProfileFromSubscription(
  supabaseUserId: string,
  subscription: Stripe.Subscription,
  source: string
) {
  const supabase = createAdminClient();

  const payload = {
    stripe_customer_id: getStripeCustomerId(subscription.customer),
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

  console.log("[STRIPE WEBHOOK] Update attempt result:", {
    supabaseUserId,
    updatedRowCount: data?.length ?? 0,
    data,
  });
  console.log("[STRIPE WEBHOOK] Updated rows:", data);
}

async function updateProfileFromCheckoutSession(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const customerId = getStripeCustomerId(session.customer);
  const supabaseUserId = session.metadata?.supabase_user_id ?? null;

  if (!supabaseUserId) {
    console.warn(
      "[STRIPE WEBHOOK] checkout.session.completed missing supabase_user_id"
    );
    return;
  }

  const payload = {
    stripe_customer_id: customerId,
    plan_tier: "pro",
    subscription_status: "active",
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", supabaseUserId)
    .select("id, stripe_customer_id, plan_tier, subscription_status");

  console.log("[STRIPE WEBHOOK] Checkout session update attempt result:", {
    supabaseUserId,
    updatedRowCount: data?.length ?? 0,
    data,
  });

  console.log("[STRIPE WEBHOOK] Checkout session profile update:", {
    supabaseUserId,
    data,
    error,
  });

  if (error) {
    throw new Error(error.message);
  }
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

      await updateProfileFromCheckoutSession(session);

      if (typeof session.subscription === "string") {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );

          const customerId = getStripeCustomerId(subscription.customer);
          const supabaseUserId = await resolveSupabaseUserId({
            metadataUserId: subscription.metadata?.supabase_user_id,
            fallbackUserId: session.metadata?.supabase_user_id ?? null,
            customerId,
          });

          if (supabaseUserId) {
            await updateProfileFromSubscription(
              supabaseUserId,
              subscription,
              "checkout.session.completed -> subscription.retrieve"
            );

            await sendSubscriptionActivatedEmail(supabaseUserId);
          } else {
            console.warn(
              "[STRIPE WEBHOOK] Could not resolve Supabase user from checkout session subscription",
              {
                sessionId: session.id,
                subscriptionId: session.subscription,
                customerId,
              }
            );
          }
        } catch (subscriptionError) {
          console.error(
            "[STRIPE WEBHOOK] Failed to retrieve subscription after checkout:",
            subscriptionError
          );
        }
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = getStripeCustomerId(subscription.customer);

      const supabaseUserId = await resolveSupabaseUserId({
        metadataUserId: subscription.metadata?.supabase_user_id,
        customerId,
      });

      if (supabaseUserId) {
        await updateProfileFromSubscription(
          supabaseUserId,
          subscription,
          event.type
        );

        if (event.type === "customer.subscription.deleted") {
          await sendSubscriptionCancelledEmail(supabaseUserId);
        }
      } else {
        console.warn(
          "[STRIPE WEBHOOK] Could not resolve Supabase user for subscription event",
          {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId,
          }
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