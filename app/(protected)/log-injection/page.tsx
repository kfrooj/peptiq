import LogInjectionContent from "@/components/log-injection/LogInjectionContent";

export default function LogInjectionPage({
  searchParams,
}: {
  searchParams?: Promise<{ planId?: string; injectionAt?: string }>;
}) {
  return <LogInjectionContent searchParams={searchParams} />;
}