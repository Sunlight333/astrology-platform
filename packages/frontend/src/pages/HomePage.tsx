import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

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
  { number: '2.500+', label: 'Mapas gerados' },
  { number: '10', label: 'Planetas analisados' },
  { number: '100%', label: 'Preciso' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ───────── Hero ───────── */}
      <section className="py-32 md:py-40 relative bg-subtle-radial">
        <div className="max-w-3xl mx-auto text-center px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p
              className="section-overline mb-6"
              variants={fadeUp}
            >
              ASTROLOGIA PARA AUTOCONHECIMENTO
            </motion.p>

            <motion.h1
              className="font-display text-display-xl md:text-[4.5rem] text-foreground"
              variants={fadeUp}
            >
              Descubra o que os astros
              <br />
              <span className="italic text-primary">revelam sobre voce</span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed font-light mt-6 mb-10"
              variants={fadeUp}
            >
              Receba seu mapa astral personalizado com interpretacoes profundas e
              organizadas, baseado nos seus dados de nascimento.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              variants={fadeUp}
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
      <section className="py-12 border-y border-border/30">
        <div className="max-w-5xl mx-auto px-6 flex justify-center gap-12 md:gap-16 items-center">
          {trustItems.map((item) => (
            <motion.div
              key={item.label}
              className="text-center"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-2xl font-semibold text-foreground">{item.number}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {item.label}
              </p>
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
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <p className="section-overline mb-4">COMO FUNCIONA</p>
            <h2 className="font-display text-display-lg text-foreground">
              Tres passos simples
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="card-elevated p-8 text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
                  },
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary text-sm font-semibold flex items-center justify-center mx-auto mb-5">
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
      </section>

      {/* ───────── Birth Data Form (Visual) ───────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-lg mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
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

            <motion.div className="card-elevated p-8" variants={fadeUp}>
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

                {/* CTA Link styled as button */}
                <Link
                  to="/new-chart"
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                >
                  <span className="text-base">&#10024;</span>
                  Gerar meu mapa
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <span className="text-sm">&#10024;</span>
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
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            Planetas do seu mapa
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {planets.map((p, i) => (
              <motion.div
                key={p.name}
                className="group p-5 rounded-2xl border border-border/50 bg-white hover:shadow-soft hover:border-border transition-all duration-200 flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-white text-base font-semibold flex items-center justify-center flex-shrink-0">
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
      <section className="py-24 text-center">
        <motion.div
          className="max-w-2xl mx-auto px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
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
            <Link to="/new-chart" className="btn-gold">
              Comecar agora
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
