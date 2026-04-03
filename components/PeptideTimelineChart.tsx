"use client";

type TimelineDay = {
  key: string;
  label: string;
};

type TimelineRow = {
  peptide: string;
  values: number[];
};

type Props = {
  days: TimelineDay[];
  rows: TimelineRow[];
};

function getCellClass(value: number) {
  if (value <= 0) {
    return "bg-[var(--color-surface-muted)] text-[var(--color-muted)]";
  }

  if (value === 1) {
    return "bg-blue-100 text-blue-700";
  }

  if (value === 2) {
    return "bg-blue-200 text-blue-800";
  }

  return "bg-blue-300 text-blue-900";
}

export default function PeptideTimelineChart({ days, rows }: Props) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">
        Injections by Peptide Over Time
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        The last 7 days of injection activity by peptide.
      </p>

      {!rows.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
          No peptide timeline data yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[640px]">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `180px repeat(${days.length}, minmax(0, 1fr))`,
              }}
            >
              <div />
              {days.map((day) => (
                <div
                  key={day.key}
                  className="text-center text-xs font-medium text-[var(--color-muted)]"
                >
                  {day.label}
                </div>
              ))}

              {rows.map((row) => (
                <div key={row.peptide} className="contents">
                  <div className="flex items-center text-sm font-medium text-[var(--color-text)]">
                    {row.peptide}
                  </div>

                  {row.values.map((value, index) => (
                    <div
                      key={`${row.peptide}-${days[index].key}`}
                      className={`flex h-12 items-center justify-center rounded-xl text-sm font-semibold ${getCellClass(
                        value
                      )}`}
                      title={`${row.peptide} · ${days[index].label}: ${value} injection${
                        value === 1 ? "" : "s"
                      }`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}