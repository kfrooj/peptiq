"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TrendPoint = {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  completed: number;
  adherence: number;
};

type ReminderDetail = {
  id: string;
  fullLabel: string;
  timeLabel: string;
  completed: boolean;
};

type Props = {
  points: TrendPoint[];
  lineColor: string;
  trendSummary: string;
  reminderDetailsByDay: Record<string, ReminderDetail[]>;
};

function buildSparklinePoints(points: TrendPoint[], width = 180, height = 42) {
  if (!points.length) return [];

  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points.map((point, index) => {
    const x = index * stepX;
    const y = height - (point.adherence / 100) * height;
    return { x, y, point };
  });
}

function buildSparklinePath(points: TrendPoint[], width = 180, height = 42) {
  const coords = buildSparklinePoints(points, width, height);

  return coords
    .map((coord, index) =>
      `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`
    )
    .join(" ");
}

function buildSparklineArea(points: TrendPoint[], width = 180, height = 42) {
  const coords = buildSparklinePoints(points, width, height);
  if (!coords.length) return "";

  const linePart = coords
    .map((coord, index) =>
      `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`
    )
    .join(" ");

  const lastX = coords[coords.length - 1]?.x ?? width;

  return `${linePart} L ${lastX.toFixed(2)} 42 L 0 42 Z`;
}

function getTooltipText(point: TrendPoint) {
  if (point.total === 0) {
    return `${point.fullLabel}: no reminders due`;
  }

  return `${point.fullLabel}: ${point.adherence}% adherence (${point.completed}/${point.total} completed)`;
}

export default function PlanAdherenceSparkline({
  points,
  lineColor,
  trendSummary,
  reminderDetailsByDay,
}: Props) {
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(
    [...points].reverse().find((point) => point.total > 0) ??
      points[points.length - 1] ??
      null
  );

  const sparklinePath = useMemo(() => buildSparklinePath(points), [points]);
  const sparklineArea = useMemo(() => buildSparklineArea(points), [points]);
  const sparklinePoints = useMemo(() => buildSparklinePoints(points), [points]);

  const selectedDetails = selectedPoint
    ? reminderDetailsByDay[selectedPoint.key] ?? []
    : [];

  const selectedDayHref = selectedPoint
    ? `/wellness?startDate=${selectedPoint.key}&endDate=${selectedPoint.key}`
    : "/wellness";

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          30-day trend
        </p>
        <span className="text-xs text-[var(--color-muted)]">{trendSummary}</span>
      </div>

      <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3">
        <svg
          viewBox="0 0 180 42"
          className="h-12 w-full overflow-visible"
          preserveAspectRatio="none"
          aria-label="30-day adherence sparkline"
        >
          <path d={sparklineArea} fill={lineColor} opacity="0.12" />
          <path
            d={sparklinePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {sparklinePoints.map(({ x, y, point }) => {
            const isSelected = selectedPoint?.key === point.key;

            return (
              <circle
                key={point.key}
                cx={x}
                cy={y}
                r={isSelected ? "4" : "2.8"}
                fill={lineColor}
                opacity={point.total > 0 ? (isSelected ? 1 : 0.95) : 0.35}
                className="cursor-pointer"
                onClick={() => setSelectedPoint(point)}
              >
                <title>{getTooltipText(point)}</title>
              </circle>
            );
          })}
        </svg>

        <div className="mt-2 flex justify-between text-[10px] text-[var(--color-muted)]">
          <span>{points[0]?.label}</span>
          <span>Click points for details</span>
          <span>{points[points.length - 1]?.label}</span>
        </div>

        {selectedPoint ? (
          <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {selectedPoint.fullLabel}
              </p>

              <Link
                href={selectedDayHref}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
              >
                View logs for day
              </Link>
            </div>

            {selectedPoint.total === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                No reminders were due on this day.
              </p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                    {selectedPoint.completed} completed
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    {selectedPoint.total} total
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                    {selectedPoint.adherence}% adherence
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  {selectedDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-[var(--color-text)]">
                          {detail.fullLabel}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                            detail.completed
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {detail.completed ? "Completed" : "Missed"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Scheduled time: {detail.timeLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}