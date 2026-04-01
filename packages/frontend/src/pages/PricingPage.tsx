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
    <div className="max-w-5xl mx-auto px-4 py-16">
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-4xl text-celestial-200 mb-4">Precos</h1>
        <p className="text-star-silver text-lg max-w-xl mx-auto">
          Escolha o produto que melhor atende suas necessidades de autoconhecimento astrologico.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            className={`card p-8 flex flex-col ${
              product.highlight ? 'border-celestial-500/50 ring-1 ring-celestial-500/20' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            {product.highlight && (
              <span className="text-xs text-star-gold font-medium uppercase tracking-wider mb-3">
                Mais Popular
              </span>
            )}

            <h2 className="font-display text-2xl text-celestial-200 mb-1">{product.name}</h2>
            <p className="text-star-silver text-sm mb-4">{product.desc}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{product.price}</span>
              <span className="text-star-silver/60 text-sm ml-1">pagamento unico</span>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-star-silver text-sm">
                  <Check size={16} className="text-star-green shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={product.highlight ? 'btn-primary w-full py-3 text-center' : 'btn-secondary w-full py-3 text-center'}
            >
              {product.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
