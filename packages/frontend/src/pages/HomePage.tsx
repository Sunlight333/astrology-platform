import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const steps = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    step: 'Passo 1',
    title: 'Preencha seus dados',
    desc: 'Insira nome, data, hora e cidade de nascimento. Sao apenas 30 segundos.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
    step: 'Passo 2',
    title: 'Receba sua previa gratuita',
    desc: 'Descubra seu Sol, Lua e Ascendente com uma interpretacao clara e precisa.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    step: 'Passo 3',
    title: 'Desbloqueie o mapa completo',
    desc: 'Acesse sua analise completa diretamente na plataforma, com interpretacao detalhada de todos os planetas e casas.',
  },
];

const planets = [
  { glyph: 'S', name: 'Sol', desc: 'Representa quem voce e em essencia: sua identidade, direcao e forma de se posicionar no mundo.' },
  { glyph: 'L', name: 'Lua', desc: 'Mostra seu funcionamento emocional, suas reacoes automaticas e sua relacao com o ambiente familiar.' },
  { glyph: 'Me', name: 'Mercurio', desc: 'Indica como voce pensa, aprende, se comunica e processa informacoes.' },
  { glyph: 'V', name: 'Venus', desc: 'Revela como voce se relaciona, expressa afeto e percebe valor nas relacoes e experiencias.' },
  { glyph: 'Ma', name: 'Marte', desc: 'Mostra sua forma de agir, tomar iniciativa e lidar com desafios e conflitos.' },
  { glyph: 'J', name: 'Jupiter', desc: 'Indica onde voce busca crescimento, oportunidades e expansao.' },
  { glyph: 'Sa', name: 'Saturno', desc: 'Aponta responsabilidades, limites e areas que exigem estrutura e maturidade.' },
  { glyph: 'U', name: 'Urano', desc: 'Representa mudancas, rupturas e a busca por liberdade e originalidade.' },
  { glyph: 'N', name: 'Netuno', desc: 'Ligado a intuicao, sensibilidade e a dissolucao de limites entre o real e o imaginario.' },
  { glyph: 'P', name: 'Plutao', desc: 'Associado a transformacao profunda, poder e processos de regeneracao.' },
];

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen">
      {/* ───────── Hero ───────── */}
      <section className="py-24 pt-16 bg-hero-gradient relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.p
            className="text-xs uppercase tracking-[0.2em] text-secondary font-body mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ASTROLOGIA PARA AUTOCONHECIMENTO
          </motion.p>

          <motion.h1
            className="font-display font-light text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Descubra o que os astros
            <br />
            <span className="italic text-primary">revelam sobre voce</span>
          </motion.h1>

          <motion.p
            className="text-base text-muted-foreground max-w-xl mx-auto mt-6 mb-10 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Receba seu mapa astral com base nos seus dados de nascimento, com
            interpretacoes organizadas e de facil compreensao.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/new-chart" className="btn-gold">
              Gerar meu mapa gratuito
            </Link>
            <a href="#como-funciona" className="btn-secondary">
              Como funciona
            </a>
          </motion.div>
        </div>
      </section>

      {/* ───────── Como Funciona ───────── */}
      <section id="como-funciona" className="py-20 px-4 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-secondary font-body mb-4">
            SIMPLES E RAPIDO
          </p>
          <h2 className="font-display font-light text-3xl md:text-5xl text-foreground">
            Tres passos para se{' '}
            <span className="italic text-primary">conhecer melhor</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="bg-card rounded-2xl p-8 text-center shadow-soft border border-border/50"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
                },
              }}
            >
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-rose-light flex items-center justify-center">
                {s.icon}
              </div>
              <p className="text-xs text-secondary uppercase font-body">{s.step}</p>
              <h3 className="font-body font-semibold text-foreground text-lg mt-1">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── Birth Data Form ───────── */}
      <section className="py-20 px-4 text-center">
        <motion.div
          className="max-w-xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <h2 className="font-display font-light text-3xl md:text-4xl text-foreground">
            Seus dados de nascimento
          </h2>
          <p className="text-muted-foreground mt-3 font-body">
            Precisamos dessas informacoes para calcular seu mapa astral com precisao.
          </p>

          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 mt-8 text-left">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // Navigate to new-chart with query params — keeps existing routing
                const params = new URLSearchParams(formData).toString();
                window.location.href = `/new-chart?${params}`;
              }}
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seu nome
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Como gostaria de ser chamada(o)?"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-body text-sm"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-body text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Hora exata
                  </label>
                  <input
                    type="time"
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-body text-sm"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cidade de nascimento
                </label>
                <input
                  type="text"
                  name="birthCity"
                  value={formData.birthCity}
                  onChange={handleChange}
                  placeholder="Ex: Sao Paulo, SP"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-body text-sm"
                />
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                Gerar meu mapa
              </button>
            </form>
            <p className="text-xs text-secondary text-center mt-3 font-body">
              Previa gratuita com Sol, Lua e Ascendente
            </p>
          </div>
        </motion.div>

        {/* ───────── Upsell Card ───────── */}
        <motion.div
          className="max-w-xl mx-auto mt-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeUp}
        >
          <div className="bg-rose-light/30 rounded-2xl p-6 text-center border border-secondary/20">
            <p className="text-muted-foreground font-body">
              Compre seu mapa astral completo por
            </p>
            <p className="text-3xl font-display font-light text-foreground mt-1">
              R$ 69,90
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-body">
              Pagamento via PIX ou Cartao de credito
            </p>
            <Link
              to="/pricing"
              className="inline-block text-sm text-primary hover:underline mt-3 font-body"
            >
              Clique para ir ao pagamento
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ───────── Planets ───────── */}
      <section className="py-20 px-4">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <h2 className="font-display font-light text-3xl md:text-4xl text-foreground text-center">
            Planetas do seu mapa astral
          </h2>

          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            {planets.map((p, i) => (
              <motion.div
                key={p.name}
                className="rounded-2xl p-5 border border-border/50 bg-card flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-lg font-display flex-shrink-0">
                  {p.glyph}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-foreground">
                    {p.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── CTA pre-footer ───────── */}
      <section className="py-20 text-center bg-section-alt">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="font-display font-light text-3xl text-foreground">
            Pronto para se conhecer melhor?
          </h2>
          <Link to="/new-chart" className="btn-gold inline-block mt-8">
            Gerar meu mapa gratuito
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
