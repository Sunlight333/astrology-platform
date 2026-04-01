import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';
import { ApiError } from '../services/api';

/* ── Animation config ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springTransition, delay: 0.3 + i * 0.05 },
  }),
};

export default function NewChartPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const profile = await api.createProfile({
        name,
        birthDate,
        birthTime,
        birthCity,
      });

      try {
        const chart = await api.calculateChart(profile.id);
        navigate(`/chart/${chart.id}`);
      } catch {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erro ao criar perfil. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-background relative overflow-hidden">
      {/* Floating orbs background */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none animate-float"
        style={{ width: 160, height: 160, top: '8%', left: '8%', background: 'rgba(74,93,138,0.03)' }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none animate-float-slow"
        style={{ width: 120, height: 120, bottom: '12%', right: '10%', background: 'rgba(184,151,154,0.04)' }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none animate-float-delay"
        style={{ width: 80, height: 80, top: '45%', right: '20%', background: 'rgba(201,139,63,0.03)' }}
      />

      {/* Twinkling stars */}
      <div className="absolute rounded-full pointer-events-none animate-twinkle" style={{ width: 3, height: 3, top: '15%', left: '25%', backgroundColor: 'rgba(123,141,181,0.4)' }} />
      <div className="absolute rounded-full pointer-events-none animate-twinkle-delay" style={{ width: 2, height: 2, bottom: '20%', right: '25%', backgroundColor: 'rgba(232,200,138,0.5)' }} />

      {/* Floating star decoration above form */}
      <motion.div
        className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-2xl"
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        &#10024;
      </motion.div>

      <motion.div
        className="card-glass w-full max-w-lg p-8 relative z-10"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springTransition}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.15 }}
        >
          <p className="section-overline mb-3">MAPA ASTRAL</p>
          <h1 className="font-display text-display-md text-foreground mb-2">
            Novo Mapa Astral
          </h1>
          <p className="text-muted-foreground text-sm">
            Informe os dados de nascimento para calcular o mapa.
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-xl p-3 mb-6">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="name" className="label">
              Nome do Perfil
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ex: Meu Mapa, Maria, Joao..."
            />
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
              <label htmlFor="birthDate" className="label">
                Data de Nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input-field"
              />
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
              <label htmlFor="birthTime" className="label">
                Horario de Nascimento
              </label>
              <input
                id="birthTime"
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="input-field"
              />
            </motion.div>
          </div>

          <motion.p
            className="text-muted-foreground/70 text-xs -mt-2"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fieldVariants}
          >
            O horario exato e importante para calcular as casas astrologicas com precisao.
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="birthCity" className="label">
              Cidade de Nascimento
            </label>
            <input
              id="birthCity"
              type="text"
              required
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              className="input-field"
              placeholder="Ex: Sao Paulo, SP, Brasil"
            />
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="visible" variants={fieldVariants}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 group relative overflow-hidden"
            >
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
              />
              <span className="relative z-10">
                {loading ? 'Criando...' : 'Calcular Mapa Astral'}
              </span>
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
