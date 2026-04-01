import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-celestial-200 text-center mb-8">
          Entrar
        </h1>

        {error && (
          <div className="bg-star-red/10 border border-star-red/30 text-star-red text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-star-silver text-sm mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cosmic-deep border border-celestial-800/40 rounded-lg px-4 py-2.5 text-white placeholder-star-silver/40 focus:outline-none focus:border-celestial-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-star-silver text-sm mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cosmic-deep border border-celestial-800/40 rounded-lg px-4 py-2.5 text-white placeholder-star-silver/40 focus:outline-none focus:border-celestial-500 transition-colors"
              placeholder="Sua senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-star-silver text-sm text-center mt-6">
          Nao tem conta?{' '}
          <Link to="/register" className="text-celestial-300 hover:text-celestial-200 underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
