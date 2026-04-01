import { useState, useEffect } from 'react';
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
  conjunction: 'rgba(201,139,63,0.45)',
  trine: 'rgba(74,93,138,0.35)',
  sextile: 'rgba(59,158,111,0.35)',
  square: 'rgba(212,114,114,0.3)',
  opposition: 'rgba(212,114,114,0.3)',
  quincunx: 'rgba(159,148,200,0.3)',
  semisextile: 'rgba(59,158,111,0.25)',
  semisquare: 'rgba(212,114,114,0.25)',
  sesquiquadrate: 'rgba(212,114,114,0.25)',
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

function lineLength(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ── Component ──

interface TransitWheelProps {
  chart: NatalChart;
  transitPositions: TransitPosition[];
  transitAspects: TransitAspect[];
}

export default function TransitWheel({ chart, transitPositions, transitAspects }: TransitWheelProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
    const fill = i % 2 === 0 ? 'rgba(74,93,138,0.04)' : 'rgba(74,93,138,0.02)';

    return (
      <g key={sign}>
        <path
          d={describeArc(CX, CY, SIGN_INNER_R, SIGN_OUTER_R, endAngle, startAngle)}
          fill={fill}
          stroke="rgba(232,228,223,0.8)"
          strokeWidth="0.5"
        />
        <text
          x={gx} y={gy}
          textAnchor="middle" dominantBaseline="central"
          fill="#7A7F8E" fontSize="12" className="select-none"
          opacity={isVisible ? 1 : 0}
          style={{ transition: `opacity 0.5s ease ${0.4 + i * 0.03}s` }}
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
        stroke="rgba(232,228,223,0.6)"
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

  const natalPlanetElements = sortedNatal.map((p, i) => {
    const [px, py] = polarToXY(CX, CY, NATAL_PLANET_R, p.chartAngle);
    const tooltipText = `${PLANET_NAMES_PT[p.planet]} natal: ${p.degree}\u00b0${String(p.minute).padStart(2, '0')}' ${SIGN_NAMES_PT[p.sign]}${p.isRetrograde ? ' (R)' : ''}`;
    const isHovered = hoveredPlanet === `natal-${p.planet}`;

    return (
      <g key={`natal-${p.planet}`}>
        {/* Hover glow ring */}
        <circle
          cx={px} cy={py}
          r={isHovered ? 10 : 0}
          fill="none"
          stroke="rgba(122,127,142,0.25)"
          strokeWidth="1"
          style={{ transition: 'r 0.3s ease, opacity 0.3s ease' }}
          opacity={isHovered ? 1 : 0}
        />
        <text
          x={px} y={py}
          textAnchor="middle" dominantBaseline="central"
          fill="#7A7F8E" fontSize="12" fontWeight="bold"
          className="cursor-pointer select-none"
          opacity={isVisible ? 1 : 0}
          style={{ transition: `opacity 0.4s ease ${0.8 + i * 0.1}s` }}
          onMouseEnter={() => {
            setTooltip({ x: px, y: py - 16, text: tooltipText });
            setHoveredPlanet(`natal-${p.planet}`);
          }}
          onMouseLeave={() => {
            setTooltip(null);
            setHoveredPlanet(null);
          }}
        >
          {PLANET_GLYPHS[p.planet]}
          <title>{tooltipText}</title>
        </text>
        {p.isRetrograde && (
          <text
            x={px + 7} y={py - 7}
            fill="#D94F4F" fontSize="6" className="select-none"
            opacity={isVisible ? 1 : 0}
            style={{ transition: `opacity 0.4s ease ${0.8 + i * 0.1}s` }}
          >
            R
          </text>
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

  const transitPlanetElements = sortedTransit.map((tp, i) => {
    const [px, py] = polarToXY(CX, CY, TRANSIT_PLANET_R, tp.chartAngle);
    const tooltipText = `${PLANET_NAMES_PT[tp.planet]} transito: ${tp.degree}\u00b0 ${SIGN_NAMES_PT[tp.sign]}${tp.isRetrograde ? ' (R)' : ''}`;
    const isHovered = hoveredPlanet === `transit-${tp.planet}`;

    return (
      <g key={`transit-${tp.planet}`}>
        {/* Hover glow ring */}
        <circle
          cx={px} cy={py}
          r={isHovered ? 12 : 8}
          fill="rgba(201,139,63,0.08)"
          stroke={isHovered ? 'rgba(201,139,63,0.45)' : 'rgba(201,139,63,0.25)'}
          strokeWidth={isHovered ? 1 : 0.5}
          style={{ transition: 'r 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease' }}
        />
        <text
          x={px} y={py}
          textAnchor="middle" dominantBaseline="central"
          fill="#4A5D8A" fontSize="12" fontWeight="bold"
          className="cursor-pointer select-none"
          opacity={isVisible ? 1 : 0}
          style={{ transition: `opacity 0.4s ease ${1.2 + i * 0.1}s` }}
          onMouseEnter={() => {
            setTooltip({ x: px, y: py - 16, text: tooltipText });
            setHoveredPlanet(`transit-${tp.planet}`);
          }}
          onMouseLeave={() => {
            setTooltip(null);
            setHoveredPlanet(null);
          }}
        >
          {PLANET_GLYPHS[tp.planet]}
          <title>{tooltipText}</title>
        </text>
        {tp.isRetrograde && (
          <text
            x={px + 7} y={py - 7}
            fill="#D94F4F" fontSize="6" className="select-none"
            opacity={isVisible ? 1 : 0}
            style={{ transition: `opacity 0.4s ease ${1.2 + i * 0.1}s` }}
          >
            R
          </text>
        )}
      </g>
    );
  });

  // ── Aspect lines from transit to natal with draw-in animation ──
  const aspectLines = transitAspects.map((asp, i) => {
    const transitP = sortedTransit.find((p) => p.planet === asp.transitPlanet);
    const natalP = sortedNatal.find((p) => p.planet === asp.natalPlanet);
    if (!transitP || !natalP) return null;

    const [x1, y1] = polarToXY(CX, CY, ASPECT_INNER_R, transitP.chartAngle);
    const [x2, y2] = polarToXY(CX, CY, ASPECT_INNER_R, natalP.chartAngle);
    const color = ASPECT_COLORS[asp.aspectType] || 'rgba(122,127,142,0.2)';
    const opacity = Math.max(0.2, 1 - asp.currentOrb / 10);
    const len = lineLength(x1, y1, x2, y2);

    return (
      <line
        key={`transit-aspect-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={asp.currentOrb < 1 ? 1.5 : 0.8}
        opacity={opacity}
        strokeDasharray={asp.isApplying ? `${len}` : '4 2'}
        strokeDashoffset={isVisible ? 0 : (asp.isApplying ? len : 0)}
        style={{
          transition: asp.isApplying
            ? `stroke-dashoffset 1s ease ${1.5 + i * 0.06}s`
            : undefined,
        }}
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
  const ascLen = lineLength(ascX1, ascY1, ascX2, ascY2);
  const [mcX1, mcY1] = polarToXY(CX, CY, NATAL_INNER_R, mcAngle);
  const [mcX2, mcY2] = polarToXY(CX, CY, OUTER_R, mcAngle);
  const [mcLabelX, mcLabelY] = polarToXY(CX, CY, OUTER_R + 10, mcAngle);
  const mcLen = lineLength(mcX1, mcY1, mcX2, mcY2);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-auto"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-10deg)',
          transition: 'opacity 0.8s ease, transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Subtle rotating background dotted circle */}
        <circle
          cx={CX} cy={CY}
          r={OUTER_R - 3}
          fill="none"
          stroke="rgba(74,93,138,0.03)"
          strokeWidth="0.5"
          strokeDasharray="2 8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${CX} ${CY}`}
            to={`360 ${CX} ${CY}`}
            dur="120s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Pulsing glow on outer transit ring */}
        <circle
          cx={CX} cy={CY}
          r={SIGN_INNER_R}
          fill="none"
          stroke="rgba(201,139,63,0.08)"
          strokeWidth="1"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.04;0.12;0.04"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Background */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="#FAFAF9" stroke="rgba(232,228,223,0.8)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={SIGN_INNER_R} fill="none" stroke="rgba(232,228,223,0.7)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={NATAL_OUTER_R} fill="none" stroke="rgba(232,228,223,0.6)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={NATAL_INNER_R} fill="none" stroke="rgba(232,228,223,0.6)" strokeWidth="0.5" />

        {/* Zodiac */}
        {signSegments}

        {/* House cusps */}
        {houseLines}

        {/* Aspect lines (draw-in) */}
        {aspectLines}

        {/* Natal planets (inner) - staggered fade-in */}
        {natalPlanetElements}

        {/* Transit planets (outer) - fade in after natal */}
        {transitPlanetElements}

        {/* Ascendant */}
        <line
          x1={ascX1} y1={ascY1} x2={ascX2} y2={ascY2}
          stroke="#C98B3F" strokeWidth="1.5"
          strokeDasharray={ascLen}
          strokeDashoffset={isVisible ? 0 : ascLen}
          style={{ transition: 'stroke-dashoffset 0.8s ease 0.6s' }}
        >
          <animate attributeName="stroke-opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
        </line>
        <text
          x={ascLabelX} y={ascLabelY}
          textAnchor="middle" dominantBaseline="central"
          fill="#C98B3F" fontSize="10" fontWeight="bold"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 1s' }}
        >
          AC
        </text>

        {/* MC */}
        <line
          x1={mcX1} y1={mcY1} x2={mcX2} y2={mcY2}
          stroke="#C98B3F" strokeWidth="1"
          strokeDasharray={mcLen}
          strokeDashoffset={isVisible ? 0 : mcLen}
          style={{ transition: 'stroke-dashoffset 0.8s ease 0.7s' }}
        >
          <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
        </line>
        <text
          x={mcLabelX} y={mcLabelY}
          textAnchor="middle" dominantBaseline="central"
          fill="#C98B3F" fontSize="10" fontWeight="bold"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 1.1s' }}
        >
          MC
        </text>

        {/* Legend */}
        <text
          x={10} y={488}
          fill="#7A7F8E" fontSize="8" className="select-none"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 1.5s' }}
        >
          Interno: Natal
        </text>
        <text
          x={10} y={498}
          fill="#4A5D8A" fontSize="8" className="select-none"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 1.6s' }}
        >
          Externo: Transitos
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-card border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground shadow-card whitespace-nowrap z-20"
          style={{
            left: `${(tooltip.x / 500) * 100}%`,
            top: `${(tooltip.y / 500) * 100}%`,
            transform: 'translate(-50%, -100%)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
