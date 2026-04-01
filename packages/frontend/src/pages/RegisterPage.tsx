import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 bg-background">
      <motion.div
        className="card-elevated w-full max-w-sm p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="font-display text-display-md text-foreground text-center mb-2">
          Criar Conta
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Comece sua jornada de autoconhecimento astrologico.
        </p>

        {apiError && (
          <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-xl p-3 mb-6">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Nome</label>
            <input
              id="name" type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="input-field" placeholder="Seu nome"
            />
            {errors.name && <p className="text-destructive text-xs mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="seu@email.com"
            />
            {errors.email && <p className="text-destructive text-xs mt-1.5">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label">Senha</label>
            <input
              id="password" type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="Minimo 8 caracteres"
            />
            {errors.password && <p className="text-destructive text-xs mt-1.5">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
            <input
              id="confirmPassword" type="password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field" placeholder="Repita a senha"
            />
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1.5">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-muted-foreground text-sm text-center mt-8">
          Ja tem conta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors duration-200">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
