import { useState } from 'react';
import type { NatalChart, PlanetaryPosition, TransitPosition, TransitAspect } from '@star/shared';
import type { Planet, ZodiacSign, AspectType } from '@star/shared';

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
  conjunction: '#ffd700',
  trine: '#4fc3f7',
  sextile: '#66bb6a',
  square: '#ef5350',
  opposition: '#ef5350',
  quincunx: '#9f94ff',
  semisextile: '#66bb6a',
  semisquare: '#ef5350',
  sesquiquadrate: '#ef5350',
};

// ── Geometry helpers ──

const CX = 250;
const CY = 250;
const OUTER_R = 240;
const SIGN_R = 222;
const SIGN_OUTER_R = 240;
const SIGN_INNER_R = 205;
const NATAL_OUTER_R = 205;
const NATAL_INNER_R = 130;
const NATAL_PLANET_R = 167;
const TRANSIT_PLANET_R = 192;
const ASPECT_INNER_R = 120;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function eclipticToAngle(longitude: number, ascendant: number): number {
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

// ── Component ──

interface TransitWheelProps {
  chart: NatalChart;
  transitPositions: TransitPosition[];
  transitAspects: TransitAspect[];
}

export default function TransitWheel({ chart, transitPositions, transitAspects }: TransitWheelProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { planetaryPositions, houseCusps, angles } = chart;
  const asc = angles.ascendant;

  // ── Zodiac sign segments (outer ring) ──
  const signSegments = ZODIAC_ORDER.map((sign, i) => {
    const startLng = i * 30;
    const endLng = (i + 1) * 30;
    const startAngle = eclipticToAngle(startLng, asc);
    const endAngle = eclipticToAngle(endLng, asc);
    const midAngle = eclipticToAngle(startLng + 15, asc);
    const [gx, gy] = polarToXY(CX, CY, SIGN_R, midAngle);
    const fill = i % 2 === 0 ? 'rgba(94,22,255,0.12)' : 'rgba(55,16,149,0.12)';

    return (
      <g key={sign}>
        <path
          d={describeArc(CX, CY, SIGN_INNER_R, SIGN_OUTER_R, endAngle, startAngle)}
          fill={fill}
          stroke="rgba(159,148,255,0.3)"
          strokeWidth="0.5"
        />
        <text
          x={gx} y={gy}
          textAnchor="middle" dominantBaseline="central"
          fill="#9f94ff" fontSize="12" className="select-none"
        >
          {ZODIAC_GLYPHS[sign]}
        </text>
      </g>
    );
  });

  // ── House cusp lines ──
  const houseLines = houseCusps.map((cusp) => {
    const angle = eclipticToAngle(cusp.longitude, asc);
    const [x1, y1] = polarToXY(CX, CY, NATAL_INNER_R, angle);
    const [x2, y2] = polarToXY(CX, CY, NATAL_OUTER_R, angle);
    return (
      <line
        key={`house-${cusp.house}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(159,148,255,0.2)"
        strokeWidth="0.5"
      />
    );
  });

  // ── Natal planets (inner ring) ──
  const natalAngles = planetaryPositions.map((p) => ({
    ...p,
    chartAngle: eclipticToAngle(p.longitude, asc),
  }));

  // Collision avoidance for natal planets
  const sortedNatal = [...natalAngles].sort((a, b) => a.chartAngle - b.chartAngle);
  const MIN_GAP = 12;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < sortedNatal.length; i++) {
      const next = sortedNatal[(i + 1) % sortedNatal.length];
      let diff = next.chartAngle - sortedNatal[i].chartAngle;
      if (diff < 0) diff += 360;
      if (diff < MIN_GAP && diff > 0) {
        const shift = (MIN_GAP - diff) / 2;
        sortedNatal[i].chartAngle -= shift;
        next.chartAngle += shift;
      }
    }
  }

  const natalPlanetElements = sortedNatal.map((p) => {
    const [px, py] = polarToXY(CX, CY, NATAL_PLANET_R, p.chartAngle);
    const tooltipText = `${PLANET_NAMES_PT[p.planet]} natal: ${p.degree}\u00b0${String(p.minute).padStart(2, '0')}' ${SIGN_NAMES_PT[p.sign]}${p.isRetrograde ? ' (R)' : ''}`;

    return (
      <g key={`natal-${p.planet}`}>
        <text
          x={px} y={py}
          textAnchor="middle" dominantBaseline="central"
          fill="#a0a0c0" fontSize="12" fontWeight="bold"
          className="cursor-pointer select-none"
          onMouseEnter={() => setTooltip({ x: px, y: py - 16, text: tooltipText })}
          onMouseLeave={() => setTooltip(null)}
        >
          {PLANET_GLYPHS[p.planet]}
          <title>{tooltipText}</title>
        </text>
        {p.isRetrograde && (
          <text x={px + 7} y={py - 7} fill="#ef5350" fontSize="6" className="select-none">R</text>
        )}
      </g>
    );
  });

  // ── Transit planets (outer ring, between signs and natal) ──
  const transitAngles = transitPositions.map((tp) => ({
    ...tp,
    chartAngle: eclipticToAngle(tp.longitude, asc),
  }));

  const sortedTransit = [...transitAngles].sort((a, b) => a.chartAngle - b.chartAngle);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < sortedTransit.length; i++) {
      const next = sortedTransit[(i + 1) % sortedTransit.length];
      let diff = next.chartAngle - sortedTransit[i].chartAngle;
      if (diff < 0) diff += 360;
      if (diff < MIN_GAP && diff > 0) {
        const shift = (MIN_GAP - diff) / 2;
        sortedTransit[i].chartAngle -= shift;
        next.chartAngle += shift;
      }
    }
  }

  const transitPlanetElements = sortedTransit.map((tp) => {
    const [px, py] = polarToXY(CX, CY, TRANSIT_PLANET_R, tp.chartAngle);
    const tooltipText = `${PLANET_NAMES_PT[tp.planet]} transito: ${tp.degree}\u00b0 ${SIGN_NAMES_PT[tp.sign]}${tp.isRetrograde ? ' (R)' : ''}`;

    return (
      <g key={`transit-${tp.planet}`}>
        <circle cx={px} cy={py} r={8} fill="rgba(255,215,0,0.1)" stroke="rgba(255,215,0,0.3)" strokeWidth="0.5" />
        <text
          x={px} y={py}
          textAnchor="middle" dominantBaseline="central"
          fill="#ffd700" fontSize="12" fontWeight="bold"
          className="cursor-pointer select-none"
          onMouseEnter={() => setTooltip({ x: px, y: py - 16, text: tooltipText })}
          onMouseLeave={() => setTooltip(null)}
        >
          {PLANET_GLYPHS[tp.planet]}
          <title>{tooltipText}</title>
        </text>
        {tp.isRetrograde && (
          <text x={px + 7} y={py - 7} fill="#ef5350" fontSize="6" className="select-none">R</text>
        )}
      </g>
    );
  });

  // ── Aspect lines from transit to natal ──
  const aspectLines = transitAspects.map((asp, i) => {
    const transitP = sortedTransit.find((p) => p.planet === asp.transitPlanet);
    const natalP = sortedNatal.find((p) => p.planet === asp.natalPlanet);
    if (!transitP || !natalP) return null;

    const [x1, y1] = polarToXY(CX, CY, ASPECT_INNER_R, transitP.chartAngle);
    const [x2, y2] = polarToXY(CX, CY, ASPECT_INNER_R, natalP.chartAngle);
    const color = ASPECT_COLORS[asp.aspectType] || '#666';
    const opacity = Math.max(0.2, 1 - asp.currentOrb / 10);

    return (
      <line
        key={`transit-aspect-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={asp.currentOrb < 1 ? 1.5 : 0.8}
        opacity={opacity}
        strokeDasharray={asp.isApplying ? undefined : '4 2'}
      >
        <title>
          {PLANET_NAMES_PT[asp.transitPlanet]} {asp.aspectType} {PLANET_NAMES_PT[asp.natalPlanet]} (orbe {asp.currentOrb.toFixed(1)}\u00b0, {asp.isApplying ? 'aplicando' : 'separando'})
        </title>
      </line>
    );
  });

  // ── Ascendant / MC ──
  const ascAngle = eclipticToAngle(asc, asc);
  const mcAngle = eclipticToAngle(angles.mc, asc);
  const [ascX1, ascY1] = polarToXY(CX, CY, NATAL_INNER_R, ascAngle);
  const [ascX2, ascY2] = polarToXY(CX, CY, OUTER_R, ascAngle);
  const [ascLabelX, ascLabelY] = polarToXY(CX, CY, OUTER_R + 10, ascAngle);
  const [mcX1, mcY1] = polarToXY(CX, CY, NATAL_INNER_R, mcAngle);
  const [mcX2, mcY2] = polarToXY(CX, CY, OUTER_R, mcAngle);
  const [mcLabelX, mcLabelY] = polarToXY(CX, CY, OUTER_R + 10, mcAngle);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 500 500" className="w-full h-auto">
        {/* Background */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="rgba(7,1,20,0.85)" stroke="rgba(159,148,255,0.3)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={SIGN_INNER_R} fill="none" stroke="rgba(159,148,255,0.25)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={NATAL_OUTER_R} fill="none" stroke="rgba(159,148,255,0.2)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={NATAL_INNER_R} fill="none" stroke="rgba(159,148,255,0.2)" strokeWidth="0.5" />

        {/* Zodiac */}
        {signSegments}

        {/* House cusps */}
        {houseLines}

        {/* Aspect lines */}
        {aspectLines}

        {/* Natal planets (inner) */}
        {natalPlanetElements}

        {/* Transit planets (outer) */}
        {transitPlanetElements}

        {/* Ascendant */}
        <line x1={ascX1} y1={ascY1} x2={ascX2} y2={ascY2} stroke="#ffd700" strokeWidth="1.5" />
        <text x={ascLabelX} y={ascLabelY} textAnchor="middle" dominantBaseline="central" fill="#ffd700" fontSize="10" fontWeight="bold">AC</text>

        {/* MC */}
        <line x1={mcX1} y1={mcY1} x2={mcX2} y2={mcY2} stroke="#ffd700" strokeWidth="1" />
        <text x={mcLabelX} y={mcLabelY} textAnchor="middle" dominantBaseline="central" fill="#ffd700" fontSize="10" fontWeight="bold">MC</text>

        {/* Legend */}
        <text x={10} y={488} fill="#a0a0c0" fontSize="8" className="select-none">Interno: Natal</text>
        <text x={10} y={498} fill="#ffd700" fontSize="8" className="select-none">Externo: Transitos</text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-cosmic-deep border border-celestial-700 rounded px-3 py-1.5 text-xs text-celestial-200 shadow-lg whitespace-nowrap z-20"
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
