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
    'w-full bg-cosmic-deep border border-celestial-800/40 rounded-lg px-4 py-2.5 text-white placeholder-star-silver/40 focus:outline-none focus:border-celestial-500 transition-colors';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <motion.div
        className="card p-8 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl text-celestial-200 text-center mb-2">
          Novo Mapa Astral
        </h1>
        <p className="text-star-silver text-center text-sm mb-8">
          Informe os dados de nascimento para calcular o mapa.
        </p>

        {error && (
          <div className="bg-star-red/10 border border-star-red/30 text-star-red text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-star-silver text-sm mb-1.5">
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
              <label htmlFor="birthDate" className="block text-star-silver text-sm mb-1.5">
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
              <label htmlFor="birthTime" className="block text-star-silver text-sm mb-1.5">
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

          <p className="text-celestial-400/60 text-xs -mt-2">
            O horario exato e importante para calcular as casas astrologicas com precisao.
          </p>

          <div>
            <label htmlFor="birthCity" className="block text-star-silver text-sm mb-1.5">
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
