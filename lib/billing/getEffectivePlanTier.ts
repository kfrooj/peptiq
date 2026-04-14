export type PlanTier = "free" | "pro";

export function isAdminBypassUser(email?: string | null) {
  const adminEmails = (process.env.PEPTIQ_ADMIN_BYPASS_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return email ? adminEmails.includes(email.toLowerCase()) : false;
}

export function getPlanTierFromProfile(input?: {
  plan_tier?: string | null;
  subscription_status?: string | null;
}): PlanTier {
  if (
    input?.subscription_status === "active" ||
    input?.subscription_status === "trialing"
  ) {
    return "pro";
  }

  if (input?.plan_tier === "pro") {
    return "pro";
  }

  return "free";
}

export function getEffectivePlanTierForUser(
  email?: string | null,
  profile?: {
    plan_tier?: string | null;
    subscription_status?: string | null;
  }
): PlanTier {
  if (isAdminBypassUser(email)) {
    return "pro";
  }

  return getPlanTierFromProfile(profile);
}