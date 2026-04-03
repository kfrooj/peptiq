"use client";

type ChartPoint = {
  label: string;
  value: number;
};

type Props = {
  data: ChartPoint[];
};

export default function SiteUsageBodyAreaChart({ data }: Props) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">
        Site Usage by Body Area
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Injection site distribution grouped into broader body areas.
      </p>

      <div className="mt-6 space-y-4">
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
            No body area data yet.
          </div>
        ) : (
          data.map((item) => {
            const widthPercent = `${(item.value / maxValue) * 100}%`;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {item.label}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {item.value}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                    style={{ width: widthPercent }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}