"use client";

type ChartPoint = {
  label: string;
  value: number;
};

type Props = {
  data: ChartPoint[];
};

export default function InjectionActivityChart({ data }: Props) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">
        Injection Activity
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Logged injections over the last 7 days.
      </p>

      <div className="mt-6 flex items-end justify-between gap-3">
        {data.map((item) => {
          const barHeight = `${(item.value / maxValue) * 180}px`;

          return (
            <div
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <span className="mb-2 text-xs font-medium text-[var(--color-text)]">
                {item.value}
              </span>

              <div className="flex h-[180px] items-end">
                <div
                  className="w-8 rounded-t-xl bg-[var(--color-accent)] transition-all duration-300"
                  style={{ height: barHeight }}
                  title={`${item.label}: ${item.value} injection${
                    item.value === 1 ? "" : "s"
                  }`}
                />
              </div>

              <span className="mt-3 text-xs text-[var(--color-muted)]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}