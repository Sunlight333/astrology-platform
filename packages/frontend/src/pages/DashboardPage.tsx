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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
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
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <p className="section-overline mb-3">SEU PAINEL</p>
        <h1 className="font-display text-display-lg text-foreground mb-2">
          Ola, {user?.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie seus mapas astrais e pedidos.
        </p>
      </motion.div>

      {/* Profiles / Charts */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-display-md text-foreground">Meus Mapas Astrais</h2>
          <Link
            to="/new-chart"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} /> Novo Perfil
          </Link>
        </div>

        {profiles.length === 0 ? (
          <motion.div
            className="card-elevated p-12 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-muted-foreground mb-6 text-lg">
              Voce ainda nao tem nenhum perfil de nascimento.
            </p>
            <Link to="/new-chart" className="btn-gold">
              Criar Primeiro Mapa
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                className="card-elevated p-6 hover:shadow-elevated transition-all duration-300"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-rose-light flex items-center justify-center flex-shrink-0">
                    <Map size={18} className="text-secondary" />
                  </div>
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

      {/* Orders */}
      <section>
        <h2 className="font-display text-display-md text-foreground mb-8">Historico de Pedidos</h2>

        {orders.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <motion.div
                  key={order.id}
                  className="card p-5 flex items-center justify-between"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
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
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                      {status.label}
                    </span>
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
