"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  trendLabel?: string;
  reminderDetailsByDay: Record<string, ReminderDetail[]>;
  defaultDetailsOpen?: boolean;
};

const CHART_WIDTH = 240;
const CHART_HEIGHT = 52;

function buildSparklinePoints(
  points: TrendPoint[],
  width = CHART_WIDTH,
  height = CHART_HEIGHT
) {
  if (!points.length) return [];

  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points.map((point, index) => {
    const x = index * stepX;
    const y = height - (point.adherence / 100) * height;
    return { x, y, point, index };
  });
}

function buildSparklinePath(
  points: TrendPoint[],
  width = CHART_WIDTH,
  height = CHART_HEIGHT
) {
  const coords = buildSparklinePoints(points, width, height);

  return coords
    .map((coord, index) =>
      `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`
    )
    .join(" ");
}

function buildSparklineArea(
  points: TrendPoint[],
  width = CHART_WIDTH,
  height = CHART_HEIGHT
) {
  const coords = buildSparklinePoints(points, width, height);
  if (!coords.length) return "";

  const linePart = coords
    .map((coord, index) =>
      `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`
    )
    .join(" ");

  const lastX = coords[coords.length - 1]?.x ?? width;

  return `${linePart} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`;
}

function getTooltipText(point: TrendPoint) {
  if (point.total === 0) {
    return `${point.fullLabel}: no reminders due`;
  }

  return `${point.fullLabel}: ${point.adherence}% adherence (${point.completed}/${point.total} completed)`;
}

function getLabelIndexes(length: number) {
  if (length <= 1) return [0];
  const first = 0;
  const middle = Math.floor((length - 1) / 2);
  const last = length - 1;
  return Array.from(new Set([first, middle, last]));
}

function getGridLines(height: number) {
  return [0.25, 0.5, 0.75].map((ratio) => ({
    y: Number((height * ratio).toFixed(2)),
    key: ratio,
  }));
}

export default function PlanAdherenceSparkline({
  points,
  lineColor,
  trendSummary,
  trendLabel = "60-DAY TREND",
  reminderDetailsByDay,
  defaultDetailsOpen = false,
}: Props) {
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(
    [...points].reverse().find((point) => point.total > 0) ??
      points[points.length - 1] ??
      null
  );
  const [showDetails, setShowDetails] = useState(defaultDetailsOpen);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const sparklinePath = useMemo(
    () => buildSparklinePath(points, CHART_WIDTH, CHART_HEIGHT),
    [points]
  );

  const sparklineArea = useMemo(
    () => buildSparklineArea(points, CHART_WIDTH, CHART_HEIGHT),
    [points]
  );

  const sparklinePoints = useMemo(
    () => buildSparklinePoints(points, CHART_WIDTH, CHART_HEIGHT),
    [points]
  );

  const labelIndexes = useMemo(() => getLabelIndexes(points.length), [points]);
  const gridLines = useMemo(() => getGridLines(CHART_HEIGHT), []);

  const selectedDetails = selectedPoint
    ? reminderDetailsByDay[selectedPoint.key] ?? []
    : [];

  const selectedDayHref = selectedPoint
    ? `/wellness?startDate=${selectedPoint.key}&endDate=${selectedPoint.key}`
    : "/wellness";

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {trendLabel}
        </p>
        <span className="text-xs text-[var(--color-muted)]">{trendSummary}</span>
      </div>

      <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3">
        <div className="overflow-x-auto">
          <div className="min-w-0">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="h-14 w-full overflow-visible"
              preserveAspectRatio="none"
              aria-label={`${trendLabel.toLowerCase()} sparkline`}
            >
              <defs>
                <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {gridLines.map((line) => (
                <line
                  key={line.key}
                  x1="0"
                  x2={CHART_WIDTH}
                  y1={line.y}
                  y2={line.y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  className="text-[var(--color-muted)]"
                />
              ))}

              <path d={sparklineArea} fill="url(#sparkline-fill)" />

              <path
                d={sparklinePath}
                fill="none"
                stroke={lineColor}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  opacity: animateIn ? 1 : 0,
                  transform: animateIn ? "translateY(0px)" : "translateY(2px)",
                  transition:
                    "opacity 450ms ease, transform 450ms ease, stroke-dashoffset 700ms ease",
                  strokeDasharray: 400,
                  strokeDashoffset: animateIn ? 0 : 400,
                }}
              />

              {sparklinePoints.map(({ x, y, point, index }) => {
                const isSelected = selectedPoint?.key === point.key;
                const hasData = point.total > 0;
                const isAnchor = labelIndexes.includes(index);

                return (
                  <g key={point.key}>
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedPoint(point);
                        setShowDetails(false);
                      }}
                    >
                      <title>{getTooltipText(point)}</title>
                    </circle>

                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 3.5 : isAnchor ? 2.4 : 1.8}
                      fill={lineColor}
                      opacity={
                        hasData ? (isSelected ? 1 : isAnchor ? 0.82 : 0.52) : 0.16
                      }
                      className="pointer-events-none"
                      style={{
                        transition: "r 180ms ease, opacity 180ms ease",
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="mt-2 flex justify-between text-[10px] text-[var(--color-muted)]">
              {labelIndexes.map((index) => (
                <span key={`${points[index]?.key}-${index}`}>
                  {points[index]?.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-[var(--color-muted)] sm:text-xs">
          Tap points for details
        </div>

        {selectedPoint ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {selectedPoint.fullLabel}
                </p>

                <span className="text-xs font-medium text-[var(--color-accent)]">
                  {showDetails ? "Hide details" : "View details"}
                </span>
              </div>

              {selectedPoint.total > 0 ? (
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
              ) : null}
            </button>

            {showDetails ? (
              <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
                <div className="mb-2 flex justify-end">
                  <Link
                    href={selectedDayHref}
                    className="text-xs font-medium text-[var(--color-accent)]"
                  >
                    View logs for day →
                  </Link>
                </div>

                {selectedPoint.total === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No reminders were due on this day.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {selectedDetails.map((detail) => (
                      <div
                        key={detail.id}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-[var(--color-text)]">
                            {detail.fullLabel}
                          </p>
                          <span
                            className={`w-fit rounded-full px-2 py-1 text-[10px] font-medium ${
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
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}