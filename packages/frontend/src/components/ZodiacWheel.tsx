import { useState } from 'react';
import type { NatalChart, PlanetaryPosition, Aspect } from '@star/shared';
import type { Planet, ZodiacSign } from '@star/shared';

// ── Glyphs ──

const ZODIAC_GLYPHS: Record<ZodiacSign, string> = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const PLANET_GLYPHS: Record<Planet, string> = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
};

const PLANET_NAMES_PT: Record<Planet, string> = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte',
  Jupiter: 'Jupiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutao',
};

const SIGN_NAMES_PT: Record<ZodiacSign, string> = {
  Aries: 'Aries', Taurus: 'Touro', Gemini: 'Gemeos', Cancer: 'Cancer',
  Leo: 'Leao', Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpiao',
  Sagittarius: 'Sagitario', Capricorn: 'Capricornio', Aquarius: 'Aquario', Pisces: 'Peixes',
};

const ZODIAC_ORDER: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#d19747',
  trine: '#7b9cc4',
  sextile: '#6aaa6e',
  square: '#d47272',
  opposition: '#d47272',
  quincunx: '#9f94c8',
  semisextile: '#6aaa6e',
  semisquare: '#d47272',
  sesquiquadrate: '#d47272',
};

// ── Geometry helpers ──

const CX = 250;
const CY = 250;
const OUTER_R = 230;
const SIGN_R = 210;
const HOUSE_OUTER_R = 190;
const HOUSE_INNER_R = 100;
const PLANET_R = 150;
const ASPECT_R = 90;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

/** Convert ecliptic longitude to chart angle, with Ascendant at 9 o'clock (180 degrees). */
function eclipticToAngle(longitude: number, ascendant: number): number {
  // Place ascendant at 180 degrees (left/9 o'clock)
  return 180 - (longitude - ascendant);
}

function describeArc(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number,
): string {
  const [ox1, oy1] = polarToXY(cx, cy, outerR, startAngle);
  const [ox2, oy2] = polarToXY(cx, cy, outerR, endAngle);
  const [ix2, iy2] = polarToXY(cx, cy, innerR, endAngle);
  const [ix1, iy1] = polarToXY(cx, cy, innerR, startAngle);

  // normalize sweep
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

function findHouseForPlanet(longitude: number, houseCusps: { house: number; longitude: number }[]): number {
  const sorted = [...houseCusps].sort((a, b) => a.house - b.house);
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    let start = sorted[i].longitude;
    let end = next.longitude;
    if (end < start) end += 360;
    let lng = longitude;
    if (lng < start) lng += 360;
    if (lng >= start && lng < end) return sorted[i].house;
  }
  return 1;
}

// ── Component ──

interface ZodiacWheelProps {
  chart: NatalChart;
}

export default function ZodiacWheel({ chart }: ZodiacWheelProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { planetaryPositions, houseCusps, aspects, angles } = chart;
  const asc = angles.ascendant;

  // ── Zodiac sign segments (outer ring) ──
  const signSegments = ZODIAC_ORDER.map((sign, i) => {
    const startLng = i * 30;
    const endLng = (i + 1) * 30;
    const startAngle = eclipticToAngle(startLng, asc);
    const endAngle = eclipticToAngle(endLng, asc);
    const midAngle = eclipticToAngle(startLng + 15, asc);
    const [gx, gy] = polarToXY(CX, CY, SIGN_R, midAngle);
    const fill = i % 2 === 0 ? 'rgba(230,218,219,0.35)' : 'rgba(201,165,168,0.15)';

    return (
      <g key={sign}>
        <path
          d={describeArc(CX, CY, HOUSE_OUTER_R, OUTER_R, endAngle, startAngle)}
          fill={fill}
          stroke="rgba(201,165,168,0.4)"
          strokeWidth="0.5"
        />
        <text
          x={gx}
          y={gy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#c9a5a8"
          fontSize="14"
          className="select-none"
        >
          {ZODIAC_GLYPHS[sign]}
        </text>
      </g>
    );
  });

  // ── House segments (middle ring) ──
  const houseSegments = houseCusps.map((cusp, i) => {
    const nextCusp = houseCusps[(i + 1) % houseCusps.length];
    const startAngle = eclipticToAngle(cusp.longitude, asc);
    const endAngle = eclipticToAngle(nextCusp.longitude, asc);
    let midLng = (cusp.longitude + nextCusp.longitude) / 2;
    if (nextCusp.longitude < cusp.longitude) {
      midLng = ((cusp.longitude + nextCusp.longitude + 360) / 2) % 360;
    }
    const midAngle = eclipticToAngle(midLng, asc);
    const [tx, ty] = polarToXY(CX, CY, (HOUSE_OUTER_R + HOUSE_INNER_R) / 2, midAngle);

    // House cusp line
    const [lx1, ly1] = polarToXY(CX, CY, HOUSE_INNER_R, startAngle);
    const [lx2, ly2] = polarToXY(CX, CY, HOUSE_OUTER_R, startAngle);

    return (
      <g key={`house-${cusp.house}`}>
        <line
          x1={lx1} y1={ly1} x2={lx2} y2={ly2}
          stroke="rgba(201,165,168,0.3)"
          strokeWidth="0.5"
        />
        <text
          x={tx} y={ty}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(108,121,146,0.6)"
          fontSize="10"
          className="select-none"
        >
          {cusp.house}
        </text>
      </g>
    );
  });

  // ── Planet positions ──
  // Spread overlapping planets
  const planetAngles = planetaryPositions.map((p) => ({
    ...p,
    chartAngle: eclipticToAngle(p.longitude, asc),
  }));

  // Simple collision avoidance: shift planets that are too close
  const sorted = [...planetAngles].sort((a, b) => a.chartAngle - b.chartAngle);
  const MIN_GAP = 12;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[(i + 1) % sorted.length];
      let diff = next.chartAngle - sorted[i].chartAngle;
      if (diff < 0) diff += 360;
      if (diff < MIN_GAP && diff > 0) {
        const shift = (MIN_GAP - diff) / 2;
        sorted[i].chartAngle -= shift;
        next.chartAngle += shift;
      }
    }
  }

  const planetElements = sorted.map((p) => {
    const [px, py] = polarToXY(CX, CY, PLANET_R, p.chartAngle);
    const house = findHouseForPlanet(p.longitude, houseCusps);
    const tooltipText = `${PLANET_NAMES_PT[p.planet]} a ${p.degree}°${String(p.minute).padStart(2, '0')}' ${SIGN_NAMES_PT[p.sign]}, Casa ${house}${p.isRetrograde ? ' (R)' : ''}`;

    // Draw tick from planet to outer ring
    const [tx, ty] = polarToXY(CX, CY, HOUSE_OUTER_R - 2, eclipticToAngle(p.longitude, asc));

    return (
      <g key={p.planet}>
        {/* Tick line from zodiac to planet */}
        <line
          x1={tx} y1={ty} x2={px} y2={py}
          stroke="rgba(201,165,168,0.2)"
          strokeWidth="0.5"
        />
        {/* Planet glyph */}
        <text
          x={px} y={py}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#5b75a3"
          fontSize="14"
          fontWeight="bold"
          className="cursor-pointer select-none"
          onMouseEnter={() => setTooltip({ x: px, y: py - 18, text: tooltipText })}
          onMouseLeave={() => setTooltip(null)}
        >
          {PLANET_GLYPHS[p.planet]}
          <title>{tooltipText}</title>
        </text>
        {p.isRetrograde && (
          <text
            x={px + 8} y={py - 8}
            fill="#d47272"
            fontSize="7"
            className="select-none"
          >
            R
          </text>
        )}
      </g>
    );
  });

  // ── Aspect lines ──
  const aspectLines = aspects.map((asp: Aspect, i: number) => {
    const pA = sorted.find((p) => p.planet === asp.planetA);
    const pB = sorted.find((p) => p.planet === asp.planetB);
    if (!pA || !pB) return null;

    const [x1, y1] = polarToXY(CX, CY, ASPECT_R, pA.chartAngle);
    const [x2, y2] = polarToXY(CX, CY, ASPECT_R, pB.chartAngle);
    const color = ASPECT_COLORS[asp.aspectType] || '#999';

    return (
      <line
        key={`aspect-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth="0.8"
        opacity="0.5"
      >
        <title>
          {PLANET_NAMES_PT[asp.planetA]} {asp.aspectType} {PLANET_NAMES_PT[asp.planetB]} (orbe {asp.orb.toFixed(1)}°)
        </title>
      </line>
    );
  });

  // ── Ascendant / MC lines ──
  const ascAngle = eclipticToAngle(asc, asc); // should be 180 (left)
  const mcAngle = eclipticToAngle(angles.mc, asc);

  const [ascX1, ascY1] = polarToXY(CX, CY, HOUSE_INNER_R, ascAngle);
  const [ascX2, ascY2] = polarToXY(CX, CY, OUTER_R, ascAngle);
  const [ascLabelX, ascLabelY] = polarToXY(CX, CY, OUTER_R + 12, ascAngle);

  const [mcX1, mcY1] = polarToXY(CX, CY, HOUSE_INNER_R, mcAngle);
  const [mcX2, mcY2] = polarToXY(CX, CY, OUTER_R, mcAngle);
  const [mcLabelX, mcLabelY] = polarToXY(CX, CY, OUTER_R + 12, mcAngle);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 500 500" className="w-full h-auto">
        {/* Background circle */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="#faf9f8" stroke="rgba(201,165,168,0.4)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={HOUSE_OUTER_R} fill="none" stroke="rgba(201,165,168,0.3)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={HOUSE_INNER_R} fill="none" stroke="rgba(201,165,168,0.3)" strokeWidth="0.5" />

        {/* Zodiac signs */}
        {signSegments}

        {/* Houses */}
        {houseSegments}

        {/* Aspect lines */}
        {aspectLines}

        {/* Planets */}
        {planetElements}

        {/* Ascendant line */}
        <line x1={ascX1} y1={ascY1} x2={ascX2} y2={ascY2} stroke="#d19747" strokeWidth="2" />
        <text
          x={ascLabelX} y={ascLabelY}
          textAnchor="middle" dominantBaseline="central"
          fill="#d19747" fontSize="11" fontWeight="bold"
        >
          AC
        </text>

        {/* MC line */}
        <line x1={mcX1} y1={mcY1} x2={mcX2} y2={mcY2} stroke="#d19747" strokeWidth="1.5" />
        <text
          x={mcLabelX} y={mcLabelY}
          textAnchor="middle" dominantBaseline="central"
          fill="#d19747" fontSize="11" fontWeight="bold"
        >
          MC
        </text>
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-card border border-border rounded px-3 py-1.5 text-xs text-foreground shadow-soft whitespace-nowrap"
          style={{
            left: `${(tooltip.x / 500) * 100}%`,
            top: `${(tooltip.y / 500) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
