import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const products = [
  {
    name: 'Mapa Astral Completo',
    price: 'R$97',
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
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 bg-background">
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-secondary font-body mb-4">
          NOSSOS PRODUTOS
        </p>
        <h1 className="font-display font-light text-4xl text-foreground mb-4">Precos</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-body">
          Escolha o produto que melhor atende suas necessidades de autoconhecimento astrologico.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            className={`bg-card rounded-2xl p-8 shadow-soft border flex flex-col ${
              product.highlight ? 'border-gold/50 ring-1 ring-gold/20' : 'border-border/50'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            {product.highlight && (
              <span className="text-xs text-gold font-medium uppercase tracking-[0.2em] mb-3 font-body">
                Mais Popular
              </span>
            )}

            <h2 className="font-display font-light text-2xl text-foreground mb-1">{product.name}</h2>
            <p className="text-muted-foreground text-sm mb-4 font-body">{product.desc}</p>

            <div className="mb-6">
              <span className="text-4xl font-display font-light text-foreground">{product.price}</span>
              <span className="text-muted-foreground text-sm ml-1 font-body">pagamento unico</span>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground text-sm font-body">
                  <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={product.highlight ? 'btn-gold w-full py-3 text-center' : 'btn-secondary w-full py-3 text-center'}
            >
              {product.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
