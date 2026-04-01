import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
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

const floatingOrbs = [
  { size: 120, top: '8%', right: '6%', color: 'rgba(74,93,138,0.03)', anim: 'animate-float-slow' },
  { size: 160, bottom: '12%', left: '5%', color: 'rgba(184,151,154,0.04)', anim: 'animate-float' },
  { size: 90, top: '45%', left: '10%', color: 'rgba(201,139,63,0.03)', anim: 'animate-float-delay' },
];

const starDots = [
  { size: 3, top: '18%', right: '20%', anim: 'animate-twinkle' },
  { size: 2, bottom: '30%', left: '18%', anim: 'animate-twinkle-delay' },
  { size: 3, top: '55%', right: '10%', anim: 'animate-twinkle' },
];

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
    <div className="min-h-[80vh] flex items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Floating celestial orbs */}
      {floatingOrbs.map((orb, i) => (
        <div
          key={`orb-${i}`}
          className={`absolute rounded-full blur-3xl pointer-events-none ${orb.anim}`}
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            background: orb.color,
          } as React.CSSProperties}
        />
      ))}

      {/* Twinkling star dots */}
      {starDots.map((star, i) => (
        <div
          key={`star-${i}`}
          className={`absolute rounded-full pointer-events-none ${star.anim}`}
          style={{
            width: star.size,
            height: star.size,
            top: star.top,
            left: star.left,
            right: star.right,
            bottom: star.bottom,
            backgroundColor: i % 2 === 0 ? 'rgba(123,141,181,0.4)' : 'rgba(232,200,138,0.5)',
          } as React.CSSProperties}
        />
      ))}

      <motion.div
        className="card-glass w-full max-w-sm p-8 relative z-10"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springTransition}
      >
        <motion.h1
          className="font-display text-display-md text-foreground text-center mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.15 }}
        >
          Criar Conta
        </motion.h1>
        <motion.p
          className="text-sm text-muted-foreground text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
        >
          Comece sua jornada de autoconhecimento astrologico.
        </motion.p>

        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm rounded-xl p-3 mb-6">
                {apiError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="name" className="label">Nome</label>
            <input
              id="name" type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="input-field" placeholder="Seu nome"
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-destructive text-xs mt-1.5"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="seu@email.com"
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-destructive text-xs mt-1.5"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="password" className="label">Senha</label>
            <input
              id="password" type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="Minimo 8 caracteres"
            />
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-destructive text-xs mt-1.5"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fieldVariants}>
            <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
            <input
              id="confirmPassword" type="password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field" placeholder="Repita a senha"
            />
            <AnimatePresence>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-destructive text-xs mt-1.5"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="visible" variants={fieldVariants}>
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full group relative overflow-hidden"
            >
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
              />
              <span className="relative z-10">
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </span>
            </button>
          </motion.div>
        </form>

        <motion.p
          className="text-muted-foreground text-sm text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Ja tem conta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors duration-200">
            Entrar
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
