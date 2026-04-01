import { notFound } from "next/navigation";
import { getPeptideBySlug } from "@/lib/peptides";

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const peptide = await getPeptideBySlug(slug);

  if (!peptide) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-gray-50">
        <div className="p-8">
          <p className="mb-3 inline-block rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
            {peptide.category}
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{peptide.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Structured research information for educational and informational browsing.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <DetailCard title="Benefits" content={peptide.benefits} />
        <DetailCard
          title="Typical Research Protocol"
          content={peptide.typical_research_protocol}
        />
        <DetailCard title="Duration" content={peptide.duration} />
        <DetailCard
          title="Common Sides / Regulatory"
          content={peptide.common_sides_regulatory}
        />
        <DetailCard
          title="Most Popular Stacks"
          content={peptide.most_popular_stacks}
        />
        <DetailCard
          title="General Administration Rules"
          content={peptide.general_administration_rules}
        />
        <ReferencesCard content={peptide.references} />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Research-only disclaimer</h2>
        <p className="text-sm leading-6 text-gray-700">{peptide.disclaimer}</p>
      </div>
    </main>
  );
}

function DetailCard({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
        {content || "No information added yet."}
      </p>
    </section>
  ); 
}
function ReferencesCard({
  content,
}: {
  content: string | null;
}) {
  const lines = content
    ? content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm md:col-span-2">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        References / Sources
      </h2>

      {!lines.length ? (
        <p className="text-sm leading-7 text-gray-700">
          No information added yet.
        </p>
      ) : (
        <ul className="space-y-3 text-sm leading-7 text-gray-700">
          {lines.map((line, index) => {
            const urlMatch = line.match(/https?:\/\/\S+/);

            if (urlMatch) {
              const url = urlMatch[0];
              const label = line.replace(url, "").trim();

              return (
                <li key={index} className="rounded-lg border p-3">
                  {label ? <p className="mb-1 font-medium">{label}</p> : null}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-600 underline"
                  >
                    {url}
                  </a>
                </li>
              );
            }

            return (
              <li key={index} className="rounded-lg border p-3">
                {line}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}