import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, X } from 'lucide-react';
import * as api from '../services/api';
import type { TransitAspect, TransitEvent } from '@star/shared';
import type { Planet, AspectType } from '@star/shared';

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

const ASPECT_DOT_COLORS: Record<string, string> = {
  conjunction: 'text-gold',
  trine: 'text-primary',
  sextile: 'text-success',
  square: 'text-red-400',
  opposition: 'text-red-500',
  quincunx: 'text-purple-400',
  semisextile: 'text-green-400',
  semisquare: 'text-red-300',
  sesquiquadrate: 'text-red-300',
};

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

// ── Helpers ──

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function hasExactTransit(transits: TransitAspect[]): boolean {
  return transits.some((t) => t.currentOrb < 0.5);
}

export default function TransitCalendarPage() {
  const { birthProfileId } = useParams<{ birthProfileId: string }>();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<TransitEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const currentMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  const maxMonth = useMemo(() => {
    const m = new Date(now);
    m.setMonth(m.getMonth() + 3);
    return m;
  }, []);

  const canGoForward = monthDiff(currentMonth, maxMonth) > 0;
  const canGoBack = monthDiff(new Date(now.getFullYear(), now.getMonth(), 1), currentMonth) > 0;

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month, canGoForward]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month, canGoBack]);

  // Fetch transit events for the current month
  useEffect(() => {
    if (!birthProfileId) return;
    let cancelled = false;
    setLoading(true);

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = dateKey(start);
    const endStr = dateKey(end);

    (async () => {
      try {
        const data = await api.getTransitRange(birthProfileId, startStr, endStr);
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar calendario');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [birthProfileId, year, month]);

  // Build map: date string -> transits
  const transitsByDate = useMemo(() => {
    const map: Record<string, TransitAspect[]> = {};
    for (const event of events) {
      const key = event.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(...event.transits);
    }
    return map;
  }, [events]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const firstDayOfWeek = days[0]?.getDay() ?? 0;

  // Detail panel for selected date
  const selectedTransits = selectedDate ? (transitsByDate[selectedDate] || []) : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/transits/${birthProfileId}`} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-display-lg text-foreground">
            Calendario de Transitos
          </h1>
        </div>
      </motion.div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-primary"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-display text-display-md text-foreground">
          {MONTH_NAMES_PT[month]} {year}
        </h2>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-primary"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card-elevated p-10 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="card-elevated p-6"
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAY_NAMES_PT.map((wd) => (
                <div key={wd} className="text-center text-xs text-muted-foreground py-2 font-medium uppercase tracking-wider">
                  {wd}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const key = dateKey(day);
                const dayTransits = transitsByDate[key] || [];
                const isToday = key === dateKey(now);
                const exact = hasExactTransit(dayTransits);
                const isSelected = selectedDate === key;

                // Unique transit planets for glyphs
                const uniquePlanets = [...new Set(dayTransits.map((t) => t.transitPlanet))];

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`
                      aspect-square rounded-xl border transition-all duration-200 text-left p-1.5 sm:p-2 flex flex-col
                      hover:shadow-soft active:scale-[0.98]
                      ${isSelected
                        ? 'border-primary bg-primary-50 shadow-soft'
                        : exact
                          ? 'border-gold/30 bg-gold-50/50 hover:bg-gold-50'
                          : dayTransits.length > 0
                            ? 'border-border/40 bg-white hover:bg-muted/50'
                            : 'border-border/20 bg-muted/20 hover:bg-muted/40'
                      }
                      ${isToday ? 'ring-2 ring-primary/30' : ''}
                    `}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {day.getDate()}
                    </span>
                    {uniquePlanets.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-auto">
                        {uniquePlanets.slice(0, 5).map((planet) => (
                          <span
                            key={planet}
                            className={`text-xs ${exact ? 'text-gold' : 'text-primary'}`}
                            title={PLANET_NAMES_PT[planet]}
                          >
                            {PLANET_GLYPHS[planet]}
                          </span>
                        ))}
                        {uniquePlanets.length > 5 && (
                          <span className="text-xs text-muted-foreground/50">+{uniquePlanets.length - 5}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-gold/30 bg-gold-50/50 inline-block" />
              Transito exato
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-border/40 bg-white inline-block" />
              Transitos ativos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md ring-2 ring-primary/30 inline-block" />
              Hoje
            </span>
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="mt-8 card-elevated p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg text-foreground">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors duration-200 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                {selectedTransits.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum transito nesta data.</p>
                ) : (
                  <div className="space-y-1">
                    {selectedTransits.map((t, i) => {
                      const dotColor = ASPECT_DOT_COLORS[t.aspectType] || 'text-muted-foreground';
                      const isExact = t.currentOrb < 0.5;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl text-primary" title={PLANET_NAMES_PT[t.transitPlanet]}>
                              {PLANET_GLYPHS[t.transitPlanet]}
                            </span>
                            <span className={`text-sm ${dotColor}`}>
                              {ASPECT_SYMBOLS[t.aspectType]}
                            </span>
                            <span className="text-xl text-muted-foreground" title={PLANET_NAMES_PT[t.natalPlanet]}>
                              {PLANET_GLYPHS[t.natalPlanet]}
                            </span>
                            <div className="ml-1">
                              <p className="text-sm text-foreground font-medium">
                                {PLANET_NAMES_PT[t.transitPlanet]} {ASPECT_NAMES_PT[t.aspectType]} {PLANET_NAMES_PT[t.natalPlanet]}
                              </p>
                              {isExact && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gold-50 text-gold mt-0.5">
                                  EXATO
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-foreground font-medium">{t.currentOrb.toFixed(2)}\u00b0</span>
                            <span className={`ml-2 ${t.isApplying ? 'text-primary' : 'text-muted-foreground'}`}>
                              {t.isApplying ? 'Aplicando' : 'Separando'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
