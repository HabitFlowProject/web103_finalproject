import { useId } from "react";

const WIDTH = 1440;
const STEP = 24;

// One layer of rolling hills: a baseline (fraction of the height) plus a sum
// of sine waves. Returns the filled shape and the line along its top edge.
function buildHill(height, base, waves) {
  const points = [];
  for (let x = 0; x <= WIDTH; x += STEP) {
    let y = base * height;
    for (const { amp, length, phase } of waves) {
      y += amp * height * Math.sin((2 * Math.PI * x) / length + phase);
    }
    points.push(`${x} ${y.toFixed(1)}`);
  }
  const ridge = `M${points.join(" L")}`;
  return { ridge, shape: `${ridge} L${WIDTH} ${height} L0 ${height} Z` };
}

// Back (1) to front (4). Each hill is a different wave so the layers overlap naturally.
const HILLS = [
  { base: 0.66, waves: [{ amp: 0.05, length: 1100, phase: 0.6 }, { amp: 0.018, length: 420, phase: 1.9 }] },
  { base: 0.74, waves: [{ amp: 0.06, length: 900, phase: 2.6 }, { amp: 0.02, length: 360, phase: 0.4 }] },
  { base: 0.83, waves: [{ amp: 0.055, length: 1250, phase: 4.1 }, { amp: 0.02, length: 500, phase: 2.2 }] },
  { base: 0.92, waves: [{ amp: 0.045, length: 980, phase: 1.2 }, { amp: 0.015, length: 300, phase: 3.3 }] },
];

const cache = new Map();
function hillsFor(height) {
  if (!cache.has(height)) {
    cache.set(height, HILLS.map(({ base, waves }) => buildHill(height, base, waves)));
  }
  return cache.get(height);
}

// A static sunset landscape drawn with the --scene-* theme variables, so it
// re-themes with the rest of the page. Decorative only.
// sunX / sunY are fractions of the width / height; sunRadius is in viewBox units.
export default function Scene({ height = 400, sunX = 0.6, sunY = 0.55, sunRadius = 54, className = "" }) {
  const id = useId().replace(/:/g, "");
  const hills = hillsFor(height);
  const cx = WIDTH * sunX;
  const cy = height * sunY;

  return (
    <svg
      className={`scene ${className}`.trim()}
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="scene-sky-top" />
          <stop offset="1" className="scene-sky-bottom" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" className="scene-halo-inner" />
          <stop offset="1" className="scene-halo-outer" />
        </radialGradient>
      </defs>
      <rect width={WIDTH} height={height} fill={`url(#${id}-sky)`} />
      <circle cx={cx} cy={cy} r={sunRadius * 3} fill={`url(#${id}-halo)`} />
      <circle className="scene-sun" cx={cx} cy={cy} r={sunRadius} />
      {hills.map((hill, index) => (
        <g key={index}>
          <path className={`scene-hill scene-hill-${index + 1}`} d={hill.shape} />
          {index < 2 && <path className="scene-ridge" d={hill.ridge} />}
        </g>
      ))}
    </svg>
  );
}
