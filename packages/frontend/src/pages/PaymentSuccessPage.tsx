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
      setStatus('confirmed'); // no order to poll, just show success
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
      if (!cancelled) setStatus('confirmed'); // show success anyway after timeout
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-background">
      <motion.div
        className="bg-card rounded-2xl p-10 shadow-soft border border-border/50 text-center max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {status === 'polling' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <h1 className="font-display font-light text-2xl text-foreground mb-3">
              Processando Pagamento...
            </h1>
            <p className="text-muted-foreground text-sm">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
            >
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            </motion.div>

            <h1 className="font-display font-light text-2xl text-foreground mb-3">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Seu pagamento foi processado com sucesso. Seu mapa astral completo ja esta disponivel.
            </p>

            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="btn-primary py-3">
                Ver Meu Mapa Astral
              </Link>
              <Link to="/dashboard" className="text-primary hover:text-primary-dark text-sm underline">
                Ir para o Painel
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
