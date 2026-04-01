import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Lock, ArrowLeft } from 'lucide-react';
import * as api from '../services/api';
import type { TransitAspect, TransitPosition } from '@star/shared';
import type { NatalChart } from '@star/shared';
import type { Planet, AspectType } from '@star/shared';
import TransitWheel from '../components/TransitWheel';

// ── Glyphs & Labels ──

const PLANET_GLYPHS: Record<Planet, string> = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
};

const PLANET_NAMES_PT: Record<Planet, string> = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte',
  Jupiter: 'Jupiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutao',
};

const ASPECT_SYMBOLS: Record<AspectType, string> = {
  conjunction: '\u260C',
  opposition: '\u260D',
  trine: '\u25B3',
  square: '\u25A1',
  sextile: '\u2731',
  quincunx: '\u26BB',
  semisextile: '\u26BA',
  semisquare: '\u2220',
  sesquiquadrate: '\u2A3E',
};

const ASPECT_NAMES_PT: Record<string, string> = {
  conjunction: 'Conjuncao',
  opposition: 'Oposicao',
  trine: 'Trigono',
  square: 'Quadratura',
  sextile: 'Sextil',
  quincunx: 'Quincuncio',
  semisextile: 'Semisextil',
  semisquare: 'Semiquadratura',
  sesquiquadrate: 'Sesquiquadratura',
};

const ASPECT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  conjunction: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  trine: { border: 'border-sky-400/50', bg: 'bg-sky-400/10', text: 'text-sky-400' },
  sextile: { border: 'border-green-400/50', bg: 'bg-green-400/10', text: 'text-green-400' },
  square: { border: 'border-red-400/50', bg: 'bg-red-400/10', text: 'text-red-400' },
  opposition: { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-500' },
  quincunx: { border: 'border-purple-400/50', bg: 'bg-purple-400/10', text: 'text-purple-400' },
  semisextile: { border: 'border-green-300/50', bg: 'bg-green-300/10', text: 'text-green-300' },
  semisquare: { border: 'border-red-300/50', bg: 'bg-red-300/10', text: 'text-red-300' },
  sesquiquadrate: { border: 'border-red-300/50', bg: 'bg-red-300/10', text: 'text-red-300' },
};

const DEFAULT_COLORS = { border: 'border-celestial-700/50', bg: 'bg-celestial-700/10', text: 'text-celestial-300' };

const FREE_TRANSIT_LIMIT = 3;

// ── Sort transits: exact first, then applying (small orb first), then separating ──

function sortTransits(transits: TransitAspect[]): TransitAspect[] {
  return [...transits].sort((a, b) => {
    const aExact = a.currentOrb < 0.5;
    const bExact = b.currentOrb < 0.5;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    if (a.isApplying && !b.isApplying) return -1;
    if (!a.isApplying && b.isApplying) return 1;
    return a.currentOrb - b.currentOrb;
  });
}

// ── Orb intensity: tighter orb = higher opacity ──

function orbOpacity(orb: number): number {
  return Math.max(0.5, 1 - orb / 12);
}

function orbGlow(orb: number): string {
  if (orb < 0.5) return 'shadow-lg shadow-yellow-500/30';
  if (orb < 1) return 'shadow-md shadow-celestial-500/20';
  if (orb < 3) return 'shadow-sm shadow-celestial-600/10';
  return '';
}

export default function TransitsPage() {
  const { birthProfileId } = useParams<{ birthProfileId: string }>();
  const [transits, setTransits] = useState<TransitAspect[]>([]);
  const [transitPositions, setTransitPositions] = useState<TransitPosition[]>([]);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!birthProfileId) return;
    let cancelled = false;

    (async () => {
      try {
        const [transitsData, chartData] = await Promise.all([
          api.getActiveTransits(birthProfileId),
          api.getChartByProfile(birthProfileId),
        ]);
        if (cancelled) return;
        setTransits(sortTransits(transitsData.transits));
        setTransitPositions(transitsData.transitPositions);
        setIsPaid(transitsData.isPaid);
        setChart(chartData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar transitos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [birthProfileId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-celestial-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/dashboard" className="btn-secondary text-sm py-2 px-4">
            Voltar ao Painel
          </Link>
        </div>
      </div>
    );
  }

  const visibleTransits = isPaid ? transits : transits.slice(0, FREE_TRANSIT_LIMIT);
  const lockedTransits = isPaid ? [] : transits.slice(FREE_TRANSIT_LIMIT);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="text-star-silver hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-3xl text-celestial-200">
            Transitos Ativos
          </h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-star-silver">
            {transits.length} transito{transits.length !== 1 ? 's' : ''} ativo{transits.length !== 1 ? 's' : ''}
          </p>
          <Link
            to={`/transits/${birthProfileId}/calendar`}
            className="btn-secondary text-sm py-1.5 px-4 inline-flex items-center gap-2"
          >
            <Calendar size={14} /> Calendario
          </Link>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Transit Wheel */}
        {chart && (
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TransitWheel
              chart={chart}
              transitPositions={transitPositions}
              transitAspects={transits}
            />
          </motion.div>
        )}

        {/* Transit Cards */}
        <div className={chart ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleTransits.map((t, i) => {
                const colors = ASPECT_COLORS[t.aspectType] || DEFAULT_COLORS;
                const opacity = orbOpacity(t.currentOrb);
                const glow = orbGlow(t.currentOrb);
                const isExact = t.currentOrb < 0.5;

                return (
                  <motion.div
                    key={`${t.transitPlanet}-${t.aspectType}-${t.natalPlanet}`}
                    className={`card p-4 border ${colors.border} ${glow} transition-all`}
                    style={{ opacity }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Planet glyphs + aspect */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-celestial-200" title={PLANET_NAMES_PT[t.transitPlanet]}>
                          {PLANET_GLYPHS[t.transitPlanet]}
                        </span>
                        <span className={`text-lg ${colors.text}`} title={ASPECT_NAMES_PT[t.aspectType]}>
                          {ASPECT_SYMBOLS[t.aspectType] || t.aspectType}
                        </span>
                        <span className="text-2xl text-star-silver" title={PLANET_NAMES_PT[t.natalPlanet]}>
                          {PLANET_GLYPHS[t.natalPlanet]}
                        </span>
                        <div className="ml-2">
                          <p className="text-sm text-celestial-200 font-medium">
                            {PLANET_NAMES_PT[t.transitPlanet]} {ASPECT_NAMES_PT[t.aspectType]} {PLANET_NAMES_PT[t.natalPlanet]}
                          </p>
                          {isExact && (
                            <span className="text-xs text-yellow-400 font-semibold">EXATO</span>
                          )}
                        </div>
                      </div>

                      {/* Orb + status */}
                      <div className="text-right">
                        <p className="text-sm text-celestial-300">
                          Orbe: {t.currentOrb.toFixed(2)}\u00b0
                        </p>
                        <p className={`text-xs ${t.isApplying ? 'text-sky-400' : 'text-orange-400'}`}>
                          {t.isApplying ? 'Aplicando' : 'Separando'}
                        </p>
                        {t.exactDate && (
                          <p className="text-xs text-star-silver mt-0.5">
                            Exato: {new Date(t.exactDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Locked transits (paywall) */}
            {lockedTransits.length > 0 && (
              <div className="relative mt-4">
                {/* Blurred locked cards */}
                <div className="space-y-3 filter blur-sm pointer-events-none select-none">
                  {lockedTransits.slice(0, 3).map((t, i) => {
                    const colors = ASPECT_COLORS[t.aspectType] || DEFAULT_COLORS;
                    return (
                      <div
                        key={`locked-${i}`}
                        className={`card p-4 border ${colors.border}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl text-celestial-200">
                            {PLANET_GLYPHS[t.transitPlanet]}
                          </span>
                          <span className={`text-lg ${colors.text}`}>
                            {ASPECT_SYMBOLS[t.aspectType]}
                          </span>
                          <span className="text-2xl text-star-silver">
                            {PLANET_GLYPHS[t.natalPlanet]}
                          </span>
                          <p className="text-sm text-celestial-200 ml-2">
                            {PLANET_NAMES_PT[t.transitPlanet]} {ASPECT_NAMES_PT[t.aspectType]} {PLANET_NAMES_PT[t.natalPlanet]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-cosmic-dark/60 backdrop-blur-sm rounded-lg">
                  <div className="text-center">
                    <Lock size={32} className="mx-auto text-celestial-400 mb-3" />
                    <p className="text-celestial-200 font-display text-lg mb-2">
                      +{lockedTransits.length} transito{lockedTransits.length !== 1 ? 's' : ''} disponive{lockedTransits.length !== 1 ? 'is' : 'l'}
                    </p>
                    <p className="text-star-silver text-sm mb-4">
                      Desbloqueie todos os transitos com o relatorio completo
                    </p>
                    <Link
                      to="/pricing"
                      className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2"
                    >
                      Ver Planos
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {transits.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-star-silver">Nenhum transito ativo no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
