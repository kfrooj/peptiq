export type PlanTier = "free" | "pro";
export type AccessSource =
  | "free"
  | "subscription"
  | "profile_override"
  | "admin_bypass";

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

export function getAccessSourceForUser(
  email?: string | null,
  profile?: {
    plan_tier?: string | null;
    subscription_status?: string | null;
  }
): AccessSource {
  if (isAdminBypassUser(email)) {
    return "admin_bypass";
  }

  if (
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing"
  ) {
    return "subscription";
  }

  if (profile?.plan_tier === "pro") {
    return "profile_override";
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
  const source = getAccessSourceForUser(email, profile);

  return source === "free" ? "free" : "pro";
}