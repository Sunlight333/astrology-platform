import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Map, Calculator, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { BirthProfile } from '@star/shared';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-gold/10 text-gold border-gold/30' },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-700 border-green-200' },
  refunded: { label: 'Reembolsado', color: 'bg-muted text-muted-foreground border-border' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [chartMap, setChartMap] = useState<Record<string, string>>({}); // profileId -> chartId
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

        // Check which profiles have charts
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-secondary font-body mb-2">
          SEU PAINEL
        </p>
        <h1 className="font-display font-light text-3xl text-foreground mb-2">
          Ola, {user?.name}
        </h1>
        <p className="text-muted-foreground mb-10 font-body">Gerencie seus mapas astrais e pedidos.</p>
      </motion.div>

      {/* Profiles / Charts */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-light text-xl text-foreground">Meus Mapas Astrais</h2>
          <Link
            to="/new-chart"
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={16} /> Novo Perfil
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 shadow-soft border border-border/50 text-center">
            <p className="text-muted-foreground mb-4 font-body">Voce ainda nao tem nenhum perfil de nascimento.</p>
            <Link to="/new-chart" className="btn-primary py-2 px-6">
              Criar Primeiro Mapa
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center flex-shrink-0">
                    <Map size={18} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display font-light text-lg text-foreground">{p.name}</h3>
                    <p className="text-muted-foreground text-sm font-body">
                      {new Date(p.birthDate).toLocaleDateString('pt-BR')} - {p.birthTime}
                    </p>
                    <p className="text-muted-foreground/60 text-xs font-body">{p.birthCity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {chartMap[p.id] ? (
                    <Link
                      to={`/chart/${chartMap[p.id]}`}
                      className="btn-secondary text-sm py-1.5 px-4 inline-flex items-center gap-2"
                    >
                      <Map size={14} /> Ver Mapa
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCalculate(p.id)}
                      className="btn-primary text-sm py-1.5 px-4 inline-flex items-center gap-2"
                    >
                      <Calculator size={14} /> Calcular
                    </button>
                  )}
                  <Link
                    to={`/transits/${p.id}`}
                    className="btn-secondary text-sm py-1.5 px-4 inline-flex items-center gap-2"
                  >
                    <Activity size={14} /> Ver Transitos
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="font-display font-light text-xl text-foreground mb-6">Historico de Pedidos</h2>

        {orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 text-center">
            <p className="text-muted-foreground font-body">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <div key={order.id} className="bg-card rounded-2xl p-4 shadow-soft border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium font-body">
                      {order.productType === 'natal_chart' ? 'Mapa Astral Completo' : 'Relatorio de Transitos'}
                    </p>
                    <p className="text-muted-foreground/60 text-xs font-body">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground text-sm font-medium font-body">
                      R${(order.amount / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
