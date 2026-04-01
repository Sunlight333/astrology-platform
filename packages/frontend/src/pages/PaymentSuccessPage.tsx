import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import * as api from '../services/api';

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
    <div className="min-h-[70vh] flex items-center justify-center px-6 bg-background">
      <motion.div
        className="card-elevated p-10 text-center max-w-md w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {status === 'polling' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <h1 className="font-display text-display-md text-foreground mb-3">
              Processando Pagamento...
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              className="mb-8"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={40} className="text-success" />
              </div>
            </motion.div>

            <h1 className="font-display text-display-md text-foreground mb-3">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-10">
              Seu pagamento foi processado com sucesso. Seu mapa astral completo ja esta disponivel.
            </p>

            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="btn-gold w-full">
                Ver Meu Mapa Astral
              </Link>
              <Link to="/dashboard" className="btn-ghost text-sm">
                Ir para o Painel
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
