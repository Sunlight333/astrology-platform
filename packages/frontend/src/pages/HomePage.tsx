import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';

/* ── Animation variants ── */
const springTransition = { type: 'spring' as const, damping: 25, stiffness: 120 };

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const heroChild = (delay: number) => ({
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springTransition, delay },
  },
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const sectionInViewProps = {
  once: true,
  amount: 0.3 as const,
};

/* ── Floating orb definitions ── */
const heroOrbs = [
  { size: 180, top: '5%', left: '8%', color: 'rgba(74,93,138,0.03)', anim: 'animate-float' },
  { size: 120, top: '12%', right: '10%', color: 'rgba(184,151,154,0.04)', anim: 'animate-float-slow' },
  { size: 200, bottom: '10%', left: '15%', color: 'rgba(201,139,63,0.03)', anim: 'animate-float-delay' },
  { size: 80, top: '40%', right: '20%', color: 'rgba(74,93,138,0.03)', anim: 'animate-float-slow' },
  { size: 140, bottom: '20%', right: '5%', color: 'rgba(184,151,154,0.03)', anim: 'animate-float' },
  { size: 60, top: '25%', left: '3%', color: 'rgba(201,139,63,0.04)', anim: 'animate-float-delay' },
];

/* ── Twinkling star definitions ── */
const heroStars = [
  { size: 3, top: '15%', left: '20%', anim: 'animate-twinkle' },
  { size: 2, top: '25%', right: '15%', anim: 'animate-twinkle-delay' },
  { size: 4, top: '45%', left: '10%', anim: 'animate-twinkle' },
  { size: 2, top: '35%', right: '25%', anim: 'animate-twinkle-delay' },
  { size: 3, bottom: '30%', left: '30%', anim: 'animate-twinkle' },
  { size: 2, bottom: '20%', right: '18%', anim: 'animate-twinkle-delay' },
  { size: 4, top: '10%', left: '55%', anim: 'animate-twinkle' },
  { size: 3, bottom: '15%', right: '35%', anim: 'animate-twinkle-delay' },
  { size: 2, top: '60%', left: '45%', anim: 'animate-twinkle' },
  { size: 3, top: '70%', right: '40%', anim: 'animate-twinkle-delay' },
];

/* ── Data ── */
const steps = [
  {
    num: '1',
    title: 'Preencha seus dados',
    desc: 'Insira nome, data, hora e cidade de nascimento. Leva menos de 30 segundos.',
  },
  {
    num: '2',
    title: 'Receba sua previa',
    desc: 'Descubra seu Sol, Lua e Ascendente com interpretacao clara e precisa.',
  },
  {
    num: '3',
    title: 'Desbloqueie tudo',
    desc: 'Acesse a analise completa com todos os planetas, casas e aspectos.',
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

const trustItems = [
  { number: '2.500+', target: 2500, suffix: '+', label: 'Mapas gerados' },
  { number: '10', target: 10, suffix: '', label: 'Planetas analisados' },
  { number: '100%', target: 100, suffix: '%', label: 'Preciso' },
];

/* ── Counting number hook ── */
function useCountUp(target: number, inView: boolean, duration = 1500) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return count;
}

/* ── Trust bar number component ── */
function AnimatedNumber({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const count = useCountUp(target, inView);
  const formatted = target >= 1000 ? count.toLocaleString('pt-BR') : count.toString();
  return <>{formatted}{suffix}</>;
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const trustInView = useInView(trustRef, { once: true, amount: 0.3 });

  // Parallax offset for decorative elements
  const [parallaxY, setParallaxY] = useState(0);
  useEffect(() => {
    const onScroll = () => setParallaxY(window.scrollY * 0.1);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ───────── Hero ───────── */}
      <section ref={heroRef} className="py-32 md:py-40 relative bg-subtle-radial overflow-hidden">
        {/* Floating celestial orbs */}
        {heroOrbs.map((orb, i) => (
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
              transform: `translateY(${parallaxY * (i % 2 === 0 ? 1 : -0.6)}px)`,
            } as React.CSSProperties}
          />
        ))}

        {/* Twinkling stars */}
        {heroStars.map((star, i) => (
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

        {/* Decorative orbit rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-5%' }}>
          <div
            className="absolute rounded-full border animate-spin-slow"
            style={{ width: 500, height: 500, borderColor: 'rgba(74,93,138,0.05)' }}
          />
          <div
            className="absolute rounded-full border animate-spin-slower"
            style={{ width: 380, height: 380, borderColor: 'rgba(184,151,154,0.07)', animationDirection: 'reverse' }}
          />
          <div
            className="absolute rounded-full border"
            style={{ width: 260, height: 260, borderColor: 'rgba(201,139,63,0.04)', animation: 'spin 45s linear infinite' }}
          />
        </div>

        <div className="max-w-3xl mx-auto text-center px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroStagger}
          >
            <motion.p
              className="section-overline mb-6"
              variants={heroChild(0)}
            >
              ASTROLOGIA PARA AUTOCONHECIMENTO
            </motion.p>

            <motion.h1
              className="font-display text-display-xl md:text-[4.5rem] text-foreground"
              variants={heroChild(0.15)}
            >
              Descubra o que os astros
            </motion.h1>

            <motion.h1
              className="font-display text-display-xl md:text-[4.5rem] italic text-primary"
              variants={heroChild(0.3)}
            >
              revelam sobre voce
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed font-light mt-6 mb-10"
              variants={heroChild(0.5)}
            >
              Receba seu mapa astral personalizado com interpretacoes profundas e
              organizadas, baseado nos seus dados de nascimento.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              variants={heroChild(0.7)}
            >
              <Link to="/new-chart" className="btn-gold">
                Gerar meu mapa gratuito
              </Link>
              <a href="#como-funciona" className="btn-secondary">
                Saiba mais
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Social Proof / Trust Bar ───────── */}
      <section className="py-12 border-y border-border/30" ref={trustRef}>
        <div className="max-w-5xl mx-auto px-6 flex justify-center gap-12 md:gap-16 items-center">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.label}
              className="text-center relative"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={sectionInViewProps}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <p className="text-2xl font-semibold text-foreground">
                <AnimatedNumber target={item.target} suffix={item.suffix} inView={trustInView} />
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {item.label}
              </p>
              {/* Gradient separator between items (not on last) */}
              {i < trustItems.length - 1 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-6 md:-right-8 h-8 w-px hidden sm:block"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(74,93,138,0.15), transparent)' }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── Como Funciona ───────── */}
      <section id="como-funciona" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={sectionInViewProps}
            variants={fadeUp}
          >
            <p className="section-overline mb-4">COMO FUNCIONA</p>
            <h2 className="font-display text-display-lg text-foreground">
              Tres passos simples
            </h2>
          </motion.div>

          {/* Steps grid with connecting line */}
          <div className="relative">
            {/* Connecting dashed line (desktop) */}
            <div
              className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(to right, rgba(74,93,138,0.15) 0px, rgba(74,93,138,0.15) 6px, transparent 6px, transparent 14px)',
              }}
            />

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  className="group card-elevated p-8 text-center transition-all duration-400"
                  initial="hidden"
                  whileInView="visible"
                  viewport={sectionInViewProps}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { delay: i * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                    },
                  }}
                  whileHover={{ y: -4, scale: 1.01, boxShadow: '0 12px 48px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary text-sm font-semibold flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110 relative z-10">
                    {s.num}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Birth Data Form (Visual) ───────── */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        {/* Floating star decoration */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <motion.div
            className="text-2xl"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            &#10024;
          </motion.div>
        </div>

        <div className="max-w-lg mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={sectionInViewProps}
            variants={stagger}
          >
            <motion.h2
              className="font-display text-display-md text-foreground mb-3"
              variants={fadeUp}
            >
              Seus dados de nascimento
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-sm mb-10"
              variants={fadeUp}
            >
              Precisamos dessas informacoes para calcular seu mapa astral com precisao.
            </motion.p>

            <motion.div className="card-glass p-8" variants={fadeUp}>
              <div className="space-y-5 text-left">
                {/* Name */}
                <div>
                  <label className="label">Seu nome</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Como gostaria de ser chamada(o)?"
                    className="input-field"
                    tabIndex={-1}
                  />
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Data de nascimento</label>
                    <input
                      type="date"
                      readOnly
                      className="input-field"
                      tabIndex={-1}
                    />
                  </div>
                  <div>
                    <label className="label">Hora exata</label>
                    <input
                      type="time"
                      readOnly
                      className="input-field"
                      tabIndex={-1}
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="label">Cidade de nascimento</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Ex: Sao Paulo, SP"
                    className="input-field"
                    tabIndex={-1}
                  />
                </div>

                {/* CTA Link styled as button with shimmer effect */}
                <Link
                  to="/new-chart"
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6 group relative overflow-hidden"
                >
                  <span
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                  <span className="text-base relative z-10">&#10024;</span>
                  <span className="relative z-10">Gerar meu mapa</span>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <motion.span
                  className="text-sm inline-block"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  &#10024;
                </motion.span>
                Previa gratuita com Sol, Lua e Ascendente
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Planets Grid ───────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="font-display text-display-md text-foreground mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={sectionInViewProps}
            variants={fadeUp}
          >
            Planetas do seu mapa
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {planets.map((p, i) => (
              <motion.div
                key={p.name}
                className="group p-5 rounded-2xl border border-border/50 bg-white transition-all duration-300 flex items-start gap-4"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={sectionInViewProps}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{
                  y: -3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl bg-primary text-white text-base font-semibold flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-115 group-hover:rotate-[5deg]"
                  style={{
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(74,93,138,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {p.glyph}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="py-24 text-center relative overflow-hidden bg-celestial-radial">
        {/* Floating orbs behind CTA */}
        <div
          className="absolute rounded-full blur-3xl pointer-events-none animate-float-slow"
          style={{ width: 100, height: 100, top: '20%', left: '10%', background: 'rgba(74,93,138,0.04)' }}
        />
        <div
          className="absolute rounded-full blur-3xl pointer-events-none animate-float"
          style={{ width: 80, height: 80, bottom: '15%', right: '15%', background: 'rgba(184,151,154,0.04)' }}
        />
        <div
          className="absolute rounded-full blur-3xl pointer-events-none animate-float-delay"
          style={{ width: 60, height: 60, top: '40%', right: '25%', background: 'rgba(201,139,63,0.03)' }}
        />

        <motion.div
          className="max-w-2xl mx-auto px-6 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={sectionInViewProps}
          variants={stagger}
        >
          <motion.h2
            className="font-display text-display-md text-foreground mb-4"
            variants={fadeUp}
          >
            Pronto para se conhecer melhor?
          </motion.h2>
          <motion.p
            className="text-muted-foreground mb-8"
            variants={fadeUp}
          >
            Comece agora e receba sua previa gratuita em segundos.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/new-chart" className="btn-gold group relative overflow-hidden">
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                }}
              />
              <span className="relative z-10">Comecar agora</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
