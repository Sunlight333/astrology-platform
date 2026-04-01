import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Globe, BookOpen } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: Sparkles,
    title: 'Mapa Astral Completo',
    desc: 'Analise detalhada de todos os planetas, casas e aspectos do seu mapa natal com interpretacoes personalizadas.',
  },
  {
    icon: Globe,
    title: 'Transitos Planetarios',
    desc: 'Acompanhe os transitos atuais e descubra as influencias cosmicas na sua vida dia a dia.',
  },
  {
    icon: BookOpen,
    title: 'Interpretacoes Exclusivas',
    desc: 'Textos escritos por astrologos experientes para cada posicao e aspecto do seu mapa.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 sm:py-32 px-4 flex flex-col items-center text-center overflow-hidden">
        {/* Gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-celestial-600/10 blur-[120px] pointer-events-none" />

        <motion.h1
          className="font-display text-4xl sm:text-6xl text-celestial-200 mb-6 max-w-3xl relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Descubra os Segredos do Seu Mapa Astral
        </motion.h1>

        <motion.p
          className="text-star-silver text-lg sm:text-xl max-w-2xl mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Interpretacoes personalizadas escritas por astrologos para desvendar
          os misterios do universo refletidos no momento do seu nascimento.
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-4 justify-center relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link to="/register" className="btn-primary text-lg py-3 px-8">
            Criar Meu Mapa Astral
          </Link>
          <Link to="/pricing" className="btn-secondary text-lg py-3 px-8">
            Ver Precos
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card p-8 text-center hover:border-celestial-600/40 transition-colors"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-celestial-600/20 flex items-center justify-center">
                <f.icon size={28} className="text-star-gold" />
              </div>
              <h3 className="font-display text-xl text-celestial-200 mb-3">{f.title}</h3>
              <p className="text-star-silver text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-3xl text-celestial-300 mb-4">
            Pronto para explorar seu universo interior?
          </h2>
          <p className="text-star-silver mb-8">
            Basta informar seus dados de nascimento para receber um mapa astral completo e detalhado.
          </p>
          <Link to="/register" className="btn-primary text-lg py-3 px-10">
            Comecar Agora
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
