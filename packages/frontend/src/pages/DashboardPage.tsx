import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Map, Calculator, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { BirthProfile } from '@star/shared';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pendente', class: 'bg-gold-50 text-gold' },
  paid: { label: 'Pago', class: 'bg-emerald-50 text-success' },
  refunded: { label: 'Reembolsado', class: 'bg-muted text-muted-foreground' },
};

/* ── Animation config ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springTransition, delay: i * 0.1 },
  }),
};

const cardHover = {
  y: -4,
  boxShadow: '0 12px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(232, 228, 223, 0.3)',
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

const sectionInViewProps = {
  once: true,
  amount: 0.3 as const,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [chartMap, setChartMap] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<api.Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profilesData, ordersData] = await Promise.all([
          api.getProfiles(),
          api.getOrders(),
        ]);
        if (cancelled) return;
        setProfiles(profilesData);
        setOrders(ordersData);

        const map: Record<string, string> = {};
        await Promise.all(
          profilesData.map(async (p) => {
            const chart = await api.getChartByProfile(p.id);
            if (chart) map[p.id] = chart.id;
          }),
        );
        if (!cancelled) setChartMap(map);
      } catch {
        // handle error silently for now
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCalculate = async (profileId: string) => {
    try {
      const chart = await api.calculateChart(profileId);
      navigate(`/chart/${chart.id}`);
    } catch {
      // could show error toast
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 relative overflow-hidden">
      {/* Subtle background orbit ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-20%' }}>
        <div
          className="absolute rounded-full border animate-spin-slower"
          style={{ width: 600, height: 600, borderColor: 'rgba(74,93,138,0.03)', animationDirection: 'reverse' }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="mb-12 relative z-10"
      >
        <motion.p
          className="section-overline mb-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
        >
          SEU PAINEL
        </motion.p>
        <motion.h1
          className="font-display text-display-lg text-foreground mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
        >
          Ola, {user?.name}
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
        >
          Gerencie seus mapas astrais e pedidos.
        </motion.p>
      </motion.div>

      {/* Animated gradient divider */}
      <motion.div
        className="h-px mb-12"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'linear-gradient(to right, transparent, rgba(74,93,138,0.15), rgba(184,151,154,0.15), transparent)',
          transformOrigin: 'left',
        }}
      />

      {/* Profiles / Charts */}
      <section className="mb-16 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            className="font-display text-display-md text-foreground"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={sectionInViewProps}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            Meus Mapas Astrais
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, ...springTransition }}
          >
            <Link
              to="/new-chart"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> Novo Perfil
            </Link>
          </motion.div>
        </div>

        {profiles.length === 0 ? (
          <motion.div
            className="card-elevated p-12 text-center"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={springTransition}
          >
            <p className="text-muted-foreground mb-6 text-lg">
              Voce ainda nao tem nenhum perfil de nascimento.
            </p>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Link to="/new-chart" className="btn-gold">
                Criar Primeiro Mapa
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                className="card-elevated p-6 transition-all duration-300"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                whileHover={cardHover}
                style={{ borderColor: 'rgba(232, 228, 223, 0.4)' }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <motion.div
                    className="w-11 h-11 rounded-xl bg-rose-light flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Map size={18} className="text-secondary" />
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-foreground truncate">{p.name}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {new Date(p.birthDate).toLocaleDateString('pt-BR')} - {p.birthTime}
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-0.5">{p.birthCity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {chartMap[p.id] ? (
                    <Link
                      to={`/chart/${chartMap[p.id]}`}
                      className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-2"
                    >
                      <Map size={14} /> Ver Mapa
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCalculate(p.id)}
                      className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2"
                    >
                      <Calculator size={14} /> Calcular
                    </button>
                  )}
                  <Link
                    to={`/transits/${p.id}`}
                    className="btn-ghost text-sm inline-flex items-center gap-2"
                  >
                    <Activity size={14} /> Transitos
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Animated gradient divider */}
      <motion.div
        className="h-px mb-12"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={sectionInViewProps}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'linear-gradient(to right, transparent, rgba(74,93,138,0.15), rgba(184,151,154,0.15), transparent)',
          transformOrigin: 'left',
        }}
      />

      {/* Orders */}
      <section className="relative z-10">
        <motion.h2
          className="font-display text-display-md text-foreground mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={sectionInViewProps}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          Historico de Pedidos
        </motion.h2>

        {orders.length === 0 ? (
          <motion.div
            className="card p-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={sectionInViewProps}
            transition={{ duration: 0.5 }}
          >
            <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <motion.div
                  key={order.id}
                  className="card p-5 flex items-center justify-between"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                >
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {order.productType === 'natal_chart' ? 'Mapa Astral Completo' : 'Relatorio de Transitos'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground text-sm font-medium">
                      R${(order.amount / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <motion.span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.06, type: 'spring', damping: 15, stiffness: 200 }}
                    >
                      {status.label}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
