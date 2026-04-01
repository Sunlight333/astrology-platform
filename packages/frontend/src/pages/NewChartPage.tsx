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
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-background">
      <motion.div
        className="card-elevated w-full max-w-lg p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <p className="section-overline mb-3">MAPA ASTRAL</p>
          <h1 className="font-display text-display-md text-foreground mb-2">
            Novo Mapa Astral
          </h1>
          <p className="text-muted-foreground text-sm">
            Informe os dados de nascimento para calcular o mapa.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-xl p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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
            </div>

            <div>
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
            </div>
          </div>

          <p className="text-muted-foreground/70 text-xs -mt-2">
            O horario exato e importante para calcular as casas astrologicas com precisao.
          </p>

          <div>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Criando...' : 'Calcular Mapa Astral'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
