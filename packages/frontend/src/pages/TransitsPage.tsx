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

const ASPECT_COLORS: Record<string, { bg: string; text: string }> = {
  conjunction: { bg: 'bg-gold-50', text: 'text-gold' },
  trine: { bg: 'bg-primary-50', text: 'text-primary' },
  sextile: { bg: 'bg-emerald-50', text: 'text-success' },
  square: { bg: 'bg-red-50', text: 'text-red-500' },
  opposition: { bg: 'bg-red-50', text: 'text-red-600' },
  quincunx: { bg: 'bg-purple-50', text: 'text-purple-500' },
  semisextile: { bg: 'bg-emerald-50', text: 'text-green-500' },
  semisquare: { bg: 'bg-red-50', text: 'text-red-400' },
  sesquiquadrate: { bg: 'bg-red-50', text: 'text-red-400' },
};

const DEFAULT_COLORS = { bg: 'bg-muted', text: 'text-muted-foreground' };

const FREE_TRANSIT_LIMIT = 3;

/* ── Animation config ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

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

/** Map orb tightness to a left-border glow color */
function orbBorderGlow(orb: number, aspectType: string): string {
  const colors = ASPECT_COLORS[aspectType] || DEFAULT_COLORS;
  if (orb < 1) return colors.text === 'text-gold' ? 'rgba(201,139,63,0.6)' : 'rgba(74,93,138,0.5)';
  if (orb < 3) return colors.text === 'text-gold' ? 'rgba(201,139,63,0.3)' : 'rgba(74,93,138,0.25)';
  return 'transparent';
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
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-1 w-10 h-10 border-2 border-primary-light/40 border-b-transparent rounded-full" style={{ animation: 'spin 1.5s linear infinite reverse' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          className="card-elevated p-10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springTransition}
        >
          <p className="text-destructive mb-6">{error}</p>
          <Link to="/dashboard" className="btn-secondary">
            Voltar ao Painel
          </Link>
        </motion.div>
      </div>
    );
  }

  const visibleTransits = isPaid ? transits : transits.slice(0, FREE_TRANSIT_LIMIT);
  const lockedTransits = isPaid ? [] : transits.slice(FREE_TRANSIT_LIMIT);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            <ArrowLeft size={20} />
          </Link>
          <motion.h1
            className="font-display text-display-lg text-foreground"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, ...springTransition }}
          >
            Transitos Ativos
          </motion.h1>
        </div>
        <motion.div
          className="flex items-center gap-4 flex-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <p className="text-muted-foreground">
            {transits.length} transito{transits.length !== 1 ? 's' : ''} ativo{transits.length !== 1 ? 's' : ''}
          </p>
          <Link
            to={`/transits/${birthProfileId}/calendar`}
            className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-2"
          >
            <Calendar size={14} /> Calendario
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Transit Wheel */}
        {chart && (
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="card-glass p-4 shadow-celestial">
              <TransitWheel
                chart={chart}
                transitPositions={transitPositions}
                transitAspects={transits}
              />
            </div>
          </motion.div>
        )}

        {/* Transit Cards */}
        <div className={chart ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleTransits.map((t, i) => {
                const colors = ASPECT_COLORS[t.aspectType] || DEFAULT_COLORS;
                const opacity = orbOpacity(t.currentOrb);
                const isExact = t.currentOrb < 0.5;
                const borderGlow = orbBorderGlow(t.currentOrb, t.aspectType);

                return (
                  <motion.div
                    key={`${t.transitPlanet}-${t.aspectType}-${t.natalPlanet}`}
                    className="card p-5 transition-all duration-200 hover:shadow-card"
                    style={{
                      opacity,
                      borderLeftWidth: '3px',
                      borderLeftColor: borderGlow,
                    }}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Planet glyphs + aspect */}
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}
                          {...(isExact ? {
                            animate: { y: [0, -3, 0] },
                            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                          } : {})}
                        >
                          <span className={`text-lg ${colors.text}`} title={PLANET_NAMES_PT[t.transitPlanet]}>
                            {PLANET_GLYPHS[t.transitPlanet]}
                          </span>
                        </motion.div>
                        <span className={`text-lg ${colors.text}`} title={ASPECT_NAMES_PT[t.aspectType]}>
                          {ASPECT_SYMBOLS[t.aspectType] || t.aspectType}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <span className="text-lg text-muted-foreground" title={PLANET_NAMES_PT[t.natalPlanet]}>
                            {PLANET_GLYPHS[t.natalPlanet]}
                          </span>
                        </div>
                        <div className="ml-1">
                          <p className="text-sm text-foreground font-medium">
                            {PLANET_NAMES_PT[t.transitPlanet]} {ASPECT_NAMES_PT[t.aspectType]} {PLANET_NAMES_PT[t.natalPlanet]}
                          </p>
                          {isExact && (
                            <motion.span
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gold-50 text-gold mt-1"
                              animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              EXATO
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Orb + status */}
                      <div className="text-right">
                        <p className="text-sm text-foreground font-medium">
                          {t.currentOrb.toFixed(2)}\u00b0
                        </p>
                        <p className={`text-xs mt-0.5 ${t.isApplying ? 'text-primary' : 'text-muted-foreground'}`}>
                          {t.isApplying ? 'Aplicando' : 'Separando'}
                        </p>
                        {t.exactDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
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
              <div className="relative mt-6">
                {/* Blurred locked cards */}
                <div className="space-y-3 filter blur-sm pointer-events-none select-none">
                  {lockedTransits.slice(0, 3).map((t, i) => {
                    const colors = ASPECT_COLORS[t.aspectType] || DEFAULT_COLORS;
                    return (
                      <div
                        key={`locked-${i}`}
                        className="card p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                            <span className={`text-lg ${colors.text}`}>
                              {PLANET_GLYPHS[t.transitPlanet]}
                            </span>
                          </div>
                          <span className={`text-lg ${colors.text}`}>
                            {ASPECT_SYMBOLS[t.aspectType]}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <span className="text-lg text-muted-foreground">
                              {PLANET_GLYPHS[t.natalPlanet]}
                            </span>
                          </div>
                          <p className="text-sm text-foreground ml-1">
                            {PLANET_NAMES_PT[t.transitPlanet]} {ASPECT_NAMES_PT[t.aspectType]} {PLANET_NAMES_PT[t.natalPlanet]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA overlay */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="card-elevated p-8 text-center max-w-sm">
                    <motion.div
                      className="w-16 h-16 mx-auto rounded-2xl bg-gold-50 flex items-center justify-center mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Lock size={24} className="text-gold" />
                    </motion.div>
                    <p className="font-display text-display-md text-foreground mb-2">
                      +{lockedTransits.length} transito{lockedTransits.length !== 1 ? 's' : ''} disponive{lockedTransits.length !== 1 ? 'is' : 'l'}
                    </p>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      Desbloqueie todos os transitos com o relatorio completo
                    </p>
                    <Link
                      to="/pricing"
                      className="btn-gold group relative overflow-hidden"
                    >
                      <span
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        }}
                      />
                      <span className="relative z-10">Ver Planos</span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}

            {transits.length === 0 && (
              <motion.div
                className="card-elevated p-10 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
              >
                <p className="text-muted-foreground">Nenhum transito ativo no momento.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
