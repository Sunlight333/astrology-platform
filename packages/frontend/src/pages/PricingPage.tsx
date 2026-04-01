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
    <div className="max-w-4xl mx-auto px-6 py-24 bg-background">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="section-overline mb-4">NOSSOS PRODUTOS</p>
        <h1 className="font-display text-display-lg text-foreground mb-4">Precos</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Escolha o produto que melhor atende suas necessidades de autoconhecimento astrologico.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            className={`card-elevated p-8 flex flex-col ${
              product.highlight
                ? 'ring-2 ring-gold/20 shadow-elevated'
                : ''
            }`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
          >
            {product.highlight && (
              <span className="section-overline text-gold mb-4 block">
                MAIS POPULAR
              </span>
            )}

            <h2 className="font-display text-display-md text-foreground mb-1">{product.name}</h2>
            <p className="text-muted-foreground text-sm mb-6">{product.desc}</p>

            <div className="mb-8">
              <span className="font-display text-display-lg text-foreground">{product.price}</span>
              <span className="text-muted-foreground text-sm ml-2">pagamento unico</span>
            </div>

            <ul className="space-y-3 mb-10 flex-1">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-muted-foreground text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-success" />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`${product.highlight ? 'btn-gold' : 'btn-secondary'} w-full text-center`}
            >
              {product.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
