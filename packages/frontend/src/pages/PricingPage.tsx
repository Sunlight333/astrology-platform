import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

/* ── Animation config ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

const sectionInViewProps = {
  once: true,
  amount: 0.3 as const,
};

/* ── Counting number hook ── */
function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return count;
}

function AnimatedPrice({ target, inView }: { target: number; inView: boolean }) {
  const count = useCountUp(target, inView);
  return <>R${count}</>;
}

const products = [
  {
    name: 'Mapa Astral Completo',
    price: 'R$97',
    priceNum: 97,
    desc: 'Analise natal completa com interpretacoes detalhadas.',
    features: [
      'Mapa natal SVG interativo',
      'Posicoes de todos os 10 planetas',
      '12 casas astrologicas',
      'Todos os aspectos calculados',
      'Interpretacoes de cada posicao',
      'Sol, Lua e Ascendente detalhados',
      'PDF para download',
    ],
    cta: 'Adquirir Mapa',
    highlight: true,
  },
  {
    name: 'Relatorio de Transitos',
    price: 'R$67',
    priceNum: 67,
    desc: 'Previsoes baseadas nos transitos planetarios atuais.',
    features: [
      'Transitos dos proximos 12 meses',
      'Calendario de transitos mensais',
      'Aspectos transitantes detalhados',
      'Datas exatas de cada transito',
      'Interpretacoes de cada evento',
      'Atualizacoes mensais',
    ],
    cta: 'Adquirir Transitos',
    highlight: false,
  },
];

export default function PricingPage() {
  const priceRef = useRef<HTMLDivElement>(null);
  const priceInView = useInView(priceRef, { once: true, amount: 0.3 });

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 bg-background relative overflow-hidden">
      {/* Celestial radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(74,93,138,0.04) 0%, rgba(184,151,154,0.02) 40%, transparent 70%)',
        }}
      />

      <motion.div
        className="text-center mb-16 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <motion.p
          className="section-overline mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
        >
          NOSSOS PRODUTOS
        </motion.p>
        <motion.h1
          className="font-display text-display-lg text-foreground mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
        >
          Precos
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
        >
          Escolha o produto que melhor atende suas necessidades de autoconhecimento astrologico.
        </motion.p>
      </motion.div>

      <div ref={priceRef} className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto relative z-10">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            className={`card-elevated p-8 flex flex-col ${
              product.highlight
                ? 'ring-2 ring-gold/20 shadow-elevated'
                : ''
            }`}
            initial={{ opacity: 0, x: i === 0 ? -40 : 40, y: 24 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={sectionInViewProps}
            transition={product.highlight
              ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
              : { delay: i * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] }
            }
            animate={product.highlight ? { y: [0, -4, 0] } : undefined}
            whileHover={product.highlight ? undefined : {
              y: -4,
              boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            {product.highlight && (
              <motion.span
                className="section-overline text-gold mb-4 block"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={sectionInViewProps}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                MAIS POPULAR
              </motion.span>
            )}

            <h2 className="font-display text-display-md text-foreground mb-1">{product.name}</h2>
            <p className="text-muted-foreground text-sm mb-6">{product.desc}</p>

            <div className="mb-8">
              <span className="font-display text-display-lg text-foreground">
                <AnimatedPrice target={product.priceNum} inView={priceInView} />
              </span>
              <span className="text-muted-foreground text-sm ml-2">pagamento unico</span>
            </div>

            <ul className="space-y-3 mb-10 flex-1">
              {product.features.map((f, fi) => (
                <motion.li
                  key={f}
                  className="flex items-start gap-3 text-muted-foreground text-sm"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={sectionInViewProps}
                  transition={{ delay: 0.4 + fi * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={sectionInViewProps}
                    transition={{ delay: 0.45 + fi * 0.06, type: 'spring', damping: 15, stiffness: 250 }}
                  >
                    <Check size={12} className="text-success" />
                  </motion.div>
                  <span>{f}</span>
                </motion.li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`${product.highlight ? 'btn-gold group relative overflow-hidden' : 'btn-secondary'} w-full text-center`}
            >
              {product.highlight && (
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  }}
                />
              )}
              <span className={product.highlight ? 'relative z-10' : ''}>{product.cta}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
