import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import * as api from '../services/api';

/* ── Animation config ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

/* Confetti-like scattered dots around checkmark */
const confettiDots = [
  { x: -40, y: -30, size: 4, color: 'rgba(201,139,63,0.5)', delay: 0.4 },
  { x: 35, y: -25, size: 3, color: 'rgba(74,93,138,0.4)', delay: 0.5 },
  { x: -30, y: 25, size: 3, color: 'rgba(184,151,154,0.5)', delay: 0.45 },
  { x: 40, y: 30, size: 4, color: 'rgba(59,158,111,0.4)', delay: 0.55 },
  { x: -50, y: 5, size: 3, color: 'rgba(232,200,138,0.5)', delay: 0.42 },
  { x: 50, y: -10, size: 3, color: 'rgba(123,141,181,0.4)', delay: 0.48 },
  { x: 0, y: -45, size: 4, color: 'rgba(201,139,63,0.4)', delay: 0.52 },
  { x: -15, y: 40, size: 3, color: 'rgba(74,93,138,0.35)', delay: 0.47 },
];

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'polling' | 'confirmed' | 'error'>('polling');

  useEffect(() => {
    if (!orderId) {
      setStatus('confirmed');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        try {
          const order = await api.getOrderStatus(orderId);
          if (order.status === 'paid') {
            if (!cancelled) setStatus('confirmed');
            return;
          }
        } catch {
          // ignore individual poll errors
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setStatus('confirmed');
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Subtle background orbs */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none animate-float"
        style={{ width: 120, height: 120, top: '15%', left: '10%', background: 'rgba(59,158,111,0.03)' }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none animate-float-slow"
        style={{ width: 100, height: 100, bottom: '20%', right: '12%', background: 'rgba(201,139,63,0.03)' }}
      />

      <motion.div
        className="card-elevated p-10 text-center max-w-md w-full relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springTransition}
      >
        {status === 'polling' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-8 relative">
              <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div
                className="absolute inset-0 w-16 h-16 border-2 border-primary-light/30 border-b-transparent rounded-full"
                style={{ animation: 'spin 2s linear infinite reverse' }}
              />
            </div>
            <h1 className="font-display text-display-md text-foreground mb-3">
              Processando Pagamento...
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            {/* Checkmark with confetti dots */}
            <div className="relative mb-8">
              {/* Confetti-like scattered dots */}
              {confettiDots.map((dot, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: dot.color,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.7], x: dot.x, y: dot.y, scale: [0, 1.3, 1] }}
                  transition={{ delay: dot.delay, duration: 0.6, ease: 'easeOut' }}
                />
              ))}

              {/* Success checkmark with dramatic entrance */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={40} className="text-success" />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ...springTransition }}
            >
              <h1 className="font-display text-display-md text-foreground mb-3">
                Pagamento Confirmado!
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-10">
                Seu pagamento foi processado com sucesso. Seu mapa astral completo ja esta disponivel.
              </p>

              <div className="flex flex-col gap-3">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(201,139,63,0)',
                      '0 0 20px 4px rgba(201,139,63,0.15)',
                      '0 0 0 0 rgba(201,139,63,0)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-xl"
                >
                  <Link to="/dashboard" className="btn-gold w-full">
                    Ver Meu Mapa Astral
                  </Link>
                </motion.div>
                <Link to="/dashboard" className="btn-ghost text-sm">
                  Ir para o Painel
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
