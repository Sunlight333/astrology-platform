import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Map, Calculator, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { BirthProfile } from '@star/shared';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-celestial-400 border-t-transparent rounded-full animate-spin" />
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
        <h1 className="font-display text-3xl text-celestial-200 mb-2">
          Ola, {user?.name}
        </h1>
        <p className="text-star-silver mb-10">Gerencie seus mapas astrais e pedidos.</p>
      </motion.div>

      {/* Profiles / Charts */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-celestial-300">Meus Mapas Astrais</h2>
          <Link
            to="/new-chart"
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={16} /> Novo Perfil
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-star-silver mb-4">Voce ainda nao tem nenhum perfil de nascimento.</p>
            <Link to="/new-chart" className="btn-primary py-2 px-6">
              Criar Primeiro Mapa
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                className="card p-5 hover:border-celestial-600/40 transition-colors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <h3 className="font-display text-lg text-celestial-200 mb-1">{p.name}</h3>
                <p className="text-star-silver text-sm mb-1">
                  {new Date(p.birthDate).toLocaleDateString('pt-BR')} - {p.birthTime}
                </p>
                <p className="text-star-silver/60 text-xs mb-4">{p.birthCity}</p>

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
        <h2 className="font-display text-xl text-celestial-300 mb-6">Historico de Pedidos</h2>

        {orders.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-star-silver">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <div key={order.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-celestial-200 text-sm font-medium">
                      {order.productType === 'natal_chart' ? 'Mapa Astral Completo' : 'Relatorio de Transitos'}
                    </p>
                    <p className="text-star-silver/60 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-celestial-200 text-sm font-medium">
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
