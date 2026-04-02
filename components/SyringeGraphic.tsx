type SyringeGraphicProps = {
  units: number;
};

export default function SyringeGraphic({ units }: SyringeGraphicProps) {
  // Keep the value between 0 and 100
  const safeUnits = Math.max(0, Math.min(units, 100));

  // This controls how much of the syringe appears filled
  const fillHeight = (safeUnits / 100) * 240;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="140"
        height="360"
        viewBox="0 0 140 360"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Syringe outer body */}
        <rect
          x="45"
          y="40"
          width="50"
          height="240"
          rx="8"
          fill="#f8fafc"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Filled liquid */}
        <rect
          x="47"
          y={280 - fillHeight}
          width="46"
          height={fillHeight}
          fill="#38bdf8"
        />

        {/* Tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const y = 40 + i * 24;
          const label = 100 - i * 10;

          return (
            <g key={i}>
              <line
                x1="95"
                y1={y}
                x2="110"
                y2={y}
                stroke="#334155"
                strokeWidth="2"
              />
              <text
                x="115"
                y={y + 4}
                fontSize="10"
                fill="#334155"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Plunger */}
        <rect
          x="52"
          y="280"
          width="36"
          height="18"
          rx="4"
          fill="#64748b"
        />

        {/* Needle base */}
        <rect
          x="60"
          y="20"
          width="20"
          height="20"
          rx="3"
          fill="#cbd5e1"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Needle */}
        <line
          x1="70"
          y1="0"
          x2="70"
          y2="20"
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* Bottom handle */}
        <rect
          x="30"
          y="298"
          width="80"
          height="12"
          rx="4"
          fill="#94a3b8"
        />
      </svg>

      <p className="mt-3 text-sm font-medium text-slate-700">
        Draw to {safeUnits.toFixed(1)} units
      </p>
    </div>
  );
}