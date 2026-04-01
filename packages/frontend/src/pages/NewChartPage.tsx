import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../services/api';
import { ApiError } from '../services/api';

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

      // Try to calculate directly
      try {
        const chart = await api.calculateChart(profile.id);
        navigate(`/chart/${chart.id}`);
      } catch {
        // If calculation needs payment, redirect to dashboard
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

  const fieldClass =
    'w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-body text-sm transition-colors';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-background">
      <motion.div
        className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display font-light text-3xl text-foreground text-center mb-2">
          Novo Mapa Astral
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8 font-body">
          Informe os dados de nascimento para calcular o mapa.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Nome do Perfil
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Ex: Meu Mapa, Maria, Joao..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-foreground mb-1.5">
                Data de Nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="birthTime" className="block text-sm font-medium text-foreground mb-1.5">
                Horario de Nascimento
              </label>
              <input
                id="birthTime"
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <p className="text-muted-foreground/70 text-xs -mt-2">
            O horario exato e importante para calcular as casas astrologicas com precisao.
          </p>

          <div>
            <label htmlFor="birthCity" className="block text-sm font-medium text-foreground mb-1.5">
              Cidade de Nascimento
            </label>
            <input
              id="birthCity"
              type="text"
              required
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              className={fieldClass}
              placeholder="Ex: Sao Paulo, SP, Brasil"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Calcular Mapa Astral'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
