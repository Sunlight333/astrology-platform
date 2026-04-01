import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock } from 'lucide-react';
import * as api from '../services/api';
import type { NatalChart, PlanetaryPosition, Aspect } from '@star/shared';
import type { Planet, ZodiacSign } from '@star/shared';
import ZodiacWheel from '../components/ZodiacWheel';

// ── Helpers ──

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

const ASPECT_NAMES_PT: Record<string, string> = {
  conjunction: 'Conjuncao', opposition: 'Oposicao', trine: 'Trigono',
  square: 'Quadratura', sextile: 'Sextil', quincunx: 'Quincuncio',
  semisextile: 'Semisextil', semisquare: 'Semiquadratura', sesquiquadrate: 'Sesquiquadratura',
};

function findHouse(longitude: number, houseCusps: { house: number; longitude: number }[]): number {
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

// ── Planet Section ──

function PlanetSection({
  position,
  houseCusps,
  aspects,
  defaultOpen,
}: {
  position: PlanetaryPosition;
  houseCusps: { house: number; longitude: number }[];
  aspects: Aspect[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const house = findHouse(position.longitude, houseCusps);
  const planetAspects = aspects.filter(
    (a) => a.planetA === position.planet || a.planetB === position.planet,
  );

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-celestial-900/10 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-star-gold text-2xl">{PLANET_GLYPHS[position.planet]}</span>
          <div className="text-left">
            <h3 className="text-celestial-200 font-medium">
              {PLANET_NAMES_PT[position.planet]} em {SIGN_NAMES_PT[position.sign]}
            </h3>
            <p className="text-star-silver/60 text-xs">
              {position.degree}°{String(position.minute).padStart(2, '0')}' - Casa {house}
              {position.isRetrograde ? ' (Retrogrado)' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-star-silver transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-celestial-800/20">
              <p className="text-star-silver text-sm mt-3 mb-4 italic">
                Interpretacao em breve.
              </p>

              {planetAspects.length > 0 && (
                <div>
                  <h4 className="text-celestial-300 text-xs font-medium uppercase tracking-wider mb-2">
                    Aspectos
                  </h4>
                  <div className="space-y-1">
                    {planetAspects.map((asp, i) => {
                      const other = asp.planetA === position.planet ? asp.planetB : asp.planetA;
                      return (
                        <p key={i} className="text-star-silver/80 text-xs">
                          {ASPECT_NAMES_PT[asp.aspectType] || asp.aspectType} com{' '}
                          {PLANET_NAMES_PT[other]} (orbe {asp.orb.toFixed(1)}°)
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Chart Page ──

export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getChart(id);
        if (!cancelled) setChart(data);
      } catch {
        if (!cancelled) setError('Erro ao carregar mapa astral.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-celestial-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-star-red mb-4">{error || 'Mapa nao encontrado.'}</p>
          <Link to="/dashboard" className="btn-secondary">Voltar ao Painel</Link>
        </div>
      </div>
    );
  }

  const sun = chart.planetaryPositions.find((p) => p.planet === 'Sun');
  const moon = chart.planetaryPositions.find((p) => p.planet === 'Moon');
  const ascSign = chart.houseCusps.find((h) => h.house === 1);

  const isPaid = chart.isPaid;
  const bigThree = ['Sun', 'Moon'];
  const otherPlanets = chart.planetaryPositions.filter((p) => !bigThree.includes(p.planet));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Wheel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <ZodiacWheel chart={chart} />
      </motion.div>

      {/* Sun, Moon, Ascendant summary */}
      <motion.div
        className="card p-6 mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className="font-display text-xl text-celestial-200 mb-4">
          Seu Sol, Lua e Ascendente
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {sun && (
            <div className="text-center">
              <span className="text-star-gold text-3xl">{PLANET_GLYPHS.Sun}</span>
              <p className="text-celestial-200 font-medium mt-1">Sol em {SIGN_NAMES_PT[sun.sign]}</p>
              <p className="text-star-silver/60 text-xs">
                {sun.degree}°{String(sun.minute).padStart(2, '0')}' - Casa {findHouse(sun.longitude, chart.houseCusps)}
              </p>
            </div>
          )}
          {moon && (
            <div className="text-center">
              <span className="text-star-gold text-3xl">{PLANET_GLYPHS.Moon}</span>
              <p className="text-celestial-200 font-medium mt-1">Lua em {SIGN_NAMES_PT[moon.sign]}</p>
              <p className="text-star-silver/60 text-xs">
                {moon.degree}°{String(moon.minute).padStart(2, '0')}' - Casa {findHouse(moon.longitude, chart.houseCusps)}
              </p>
            </div>
          )}
          {ascSign && (
            <div className="text-center">
              <span className="text-star-gold text-3xl">AC</span>
              <p className="text-celestial-200 font-medium mt-1">Ascendente em {SIGN_NAMES_PT[ascSign.sign]}</p>
              <p className="text-star-silver/60 text-xs">
                {ascSign.degree}°
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Planet details - Sun & Moon always visible */}
      <div className="space-y-3 mb-6">
        {chart.planetaryPositions
          .filter((p) => bigThree.includes(p.planet))
          .map((p) => (
            <PlanetSection
              key={p.planet}
              position={p}
              houseCusps={chart.houseCusps}
              aspects={chart.aspects}
              defaultOpen
            />
          ))}
      </div>

      {/* Rest of planets - blurred if not paid */}
      <div className="relative">
        {!isPaid && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cosmic-dark/60 backdrop-blur-sm rounded-xl">
            <Lock size={32} className="text-star-gold mb-3" />
            <p className="text-celestial-200 font-display text-lg mb-2">Conteudo Completo</p>
            <p className="text-star-silver text-sm mb-4 text-center max-w-sm">
              Desbloqueie a interpretacao completa de todos os planetas, casas e aspectos.
            </p>
            <Link to="/pricing" className="btn-primary">
              Ver Precos
            </Link>
          </div>
        )}

        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-3">
            {otherPlanets.map((p) => (
              <PlanetSection
                key={p.planet}
                position={p}
                houseCusps={chart.houseCusps}
                aspects={chart.aspects}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
