import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError('');

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full bg-cosmic-deep border border-celestial-800/40 rounded-lg px-4 py-2.5 text-white placeholder-star-silver/40 focus:outline-none focus:border-celestial-500 transition-colors';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-celestial-200 text-center mb-8">
          Criar Conta
        </h1>

        {apiError && (
          <div className="bg-star-red/10 border border-star-red/30 text-star-red text-sm rounded-lg p-3 mb-6">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-star-silver text-sm mb-1.5">Nome</label>
            <input
              id="name" type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className={fieldClass} placeholder="Seu nome"
            />
            {errors.name && <p className="text-star-red text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-star-silver text-sm mb-1.5">Email</label>
            <input
              id="email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={fieldClass} placeholder="seu@email.com"
            />
            {errors.email && <p className="text-star-red text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-star-silver text-sm mb-1.5">Senha</label>
            <input
              id="password" type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={fieldClass} placeholder="Minimo 6 caracteres"
            />
            {errors.password && <p className="text-star-red text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-star-silver text-sm mb-1.5">Confirmar Senha</label>
            <input
              id="confirmPassword" type="password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass} placeholder="Repita a senha"
            />
            {errors.confirmPassword && <p className="text-star-red text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-star-silver text-sm text-center mt-6">
          Ja tem conta?{' '}
          <Link to="/login" className="text-celestial-300 hover:text-celestial-200 underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
