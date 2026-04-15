import { redirect } from "next/navigation";

export default async function ManageSubscriptionPage() {
  redirect("/api/stripe/create-portal-session");
}