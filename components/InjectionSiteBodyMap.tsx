"use client";

import Image from "next/image";

type InjectionSite =
  | "left-arm"
  | "right-arm"
  | "left-abdomen"
  | "right-abdomen"
  | "left-thigh"
  | "right-thigh"
  | "left-glute"
  | "right-glute";

type Hotspot = {
  id: InjectionSite;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

const HOTSPOTS: Hotspot[] = [
  // Front
  {
    id: "left-arm",
    label: "Left arm",
    left: "10.8%",
    top: "29.5%",
    width: "6.4%",
    height: "10.2%",
  },
  {
    id: "right-arm",
    label: "Right arm",
    left: "39.6%",
    top: "29.5%",
    width: "6.4%",
    height: "10.2%",
  },
  {
    id: "left-abdomen",
    label: "Left abdomen",
    left: "18.8%",
    top: "38.2%",
    width: "8.4%",
    height: "7.0%",
  },
  {
    id: "right-abdomen",
    label: "Right abdomen",
    left: "30.2%",
    top: "38.2%",
    width: "8.4%",
    height: "7.0%",
  },
  {
    id: "left-thigh",
    label: "Left thigh",
    left: "13.0%",
    top: "53.2%",
    width: "9.2%",
    height: "13.8%",
  },
  {
    id: "right-thigh",
    label: "Right thigh",
    left: "28.6%",
    top: "53.2%",
    width: "9.2%",
    height: "13.8%",
  },

  // Back
  {
    id: "left-arm",
    label: "Left arm",
    left: "59.4%",
    top: "29.5%",
    width: "6.4%",
    height: "10.2%",
  },
  {
    id: "right-arm",
    label: "Right arm",
    left: "88.0%",
    top: "29.5%",
    width: "6.4%",
    height: "10.2%",
  },
  {
    id: "left-glute",
    label: "Left glute",
    left: "68.4%",
    top: "44.6%",
    width: "8.8%",
    height: "7.8%",
  },
  {
    id: "right-glute",
    label: "Right glute",
    left: "79.0%",
    top: "44.6%",
    width: "8.8%",
    height: "7.8%",
  },
  {
    id: "left-thigh",
    label: "Left thigh",
    left: "68.8%",
    top: "54.0%",
    width: "8.4%",
    height: "13.4%",
  },
  {
    id: "right-thigh",
    label: "Right thigh",
    left: "79.2%",
    top: "54.0%",
    width: "8.4%",
    height: "13.4%",
  },
];

const UNIQUE_SITES: Array<{ id: InjectionSite; label: string }> = [
  { id: "left-arm", label: "Left arm" },
  { id: "right-arm", label: "Right arm" },
  { id: "left-abdomen", label: "Left abdomen" },
  { id: "right-abdomen", label: "Right abdomen" },
  { id: "left-thigh", label: "Left thigh" },
  { id: "right-thigh", label: "Right thigh" },
  { id: "left-glute", label: "Left glute" },
  { id: "right-glute", label: "Right glute" },
];

type Props = {
  value: InjectionSite | "";
  onChange: (value: InjectionSite) => void;
};

export default function InjectionSiteBodyMap({ value, onChange }: Props) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          Select injection site
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Tap a highlighted body area to choose the injection site.
        </p>
      </div>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-white">
        <div className="relative aspect-[1024/1536] w-full">
          <Image
            src="/injection-sites-body-map-v2.png"
            alt="Front and back body image for injection site selection"
            fill
            priority
            className="object-contain"
          />

          {HOTSPOTS.map((spot, index) => {
            const active = value === spot.id;

            return (
              <button
                key={`${spot.id}-${index}`}
                type="button"
                aria-label={spot.label}
                onClick={() => onChange(spot.id)}
                className={`absolute rounded-[40%] transition ${
                  active
                    ? "ring-2 ring-red-500 bg-red-500/12"
                    : "hover:bg-white/5"
                }`}
                style={{
                  left: spot.left,
                  top: spot.top,
                  width: spot.width,
                  height: spot.height,
                  backgroundColor: active ? undefined : "transparent",
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {UNIQUE_SITES.map((spot) => {
          const active = value === spot.id;

          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onChange(spot.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text)]"
              }`}
            >
              {spot.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border bg-[var(--color-surface-muted)] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Selected site
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
          {UNIQUE_SITES.find((spot) => spot.id === value)?.label || "None selected"}
        </p>
      </div>
    </div>
  );
}