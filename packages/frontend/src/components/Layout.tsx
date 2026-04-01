import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Footer refs for stagger fade-in
  const footerRef = useRef<HTMLElement>(null);
  const footerInView = useInView(footerRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/#sobre', label: 'Sobre' },
    { to: '/new-chart', label: 'Mapa Astral' },
    { to: '/pricing', label: 'Precos' },
  ];

  const mobileMenuVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.06, when: 'beforeChildren' },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const mobileLinkVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  };

  const footerColumnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(232, 228, 223, 0.4)',
          boxShadow: scrolled
            ? '0 4px 24px rgba(0,0,0,0.06), inset 0 -1px 0 rgba(255,255,255,0.5)'
            : 'inset 0 -1px 0 rgba(255,255,255,0.5)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo with hover animation */}
            <Link
              to="/"
              className="font-display text-lg text-foreground hover:text-primary transition-all duration-300 inline-block"
              style={{ transform: 'scale(1)', transition: 'transform 0.3s ease, color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Astro Conecta
            </Link>

            {/* Desktop center nav with animated underlines */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className="group relative text-sm text-muted-foreground font-medium hover:text-foreground transition-colors duration-200 py-1"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-primary origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </Link>
              ))}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{user?.name}</span>
                  <Link
                    to="/dashboard"
                    className="group relative text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 py-1"
                  >
                    Meu Painel
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-primary origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost text-sm"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">
                    Entrar
                  </Link>
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(74,93,138,0)',
                        '0 0 12px 2px rgba(74,93,138,0.15)',
                        '0 0 0 0 rgba(74,93,138,0)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-xl"
                  >
                    <Link to="/new-chart" className="btn-primary !py-2 !px-5 !rounded-xl text-sm">
                      Comecar
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-foreground p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu with staggered entrances */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
              className="md:hidden overflow-hidden border-t border-border/40 bg-white/95 backdrop-blur-xl"
            >
              <div className="px-6 py-5 space-y-4">
                {navLinks.map((link) => (
                  <motion.div key={link.to + link.label} variants={mobileLinkVariants}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm text-muted-foreground font-medium hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={mobileLinkVariants} className="pt-3 border-t border-border/30">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <span className="block text-sm text-muted-foreground">{user?.name}</span>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm font-medium text-foreground"
                      >
                        Meu Painel
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileOpen(false);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="btn-ghost text-sm"
                      >
                        Entrar
                      </Link>
                      <Link
                        to="/new-chart"
                        onClick={() => setMobileOpen(false)}
                        className="btn-primary !py-2 !px-5 !rounded-xl text-sm"
                      >
                        Comecar
                      </Link>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer with staggered fade-in */}
      <footer ref={footerRef} className="py-16 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {/* Brand column */}
            <motion.div
              custom={0}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
              variants={footerColumnVariants}
            >
              <p className="font-display text-lg text-foreground mb-2">
                Astro Conecta
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Astrologia acessivel para autoconhecimento e transformacao pessoal.
              </p>
            </motion.div>

            {/* Links column */}
            <motion.div
              custom={1}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
              variants={footerColumnVariants}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                Navegacao
              </p>
              <div className="space-y-2.5">
                <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Inicio
                </Link>
                <Link to="/new-chart" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Mapa Astral
                </Link>
                <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Precos
                </Link>
              </div>
            </motion.div>

            {/* Legal column */}
            <motion.div
              custom={2}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
              variants={footerColumnVariants}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                Legal
              </p>
              <div className="space-y-2.5">
                <Link to="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Termos de Uso
                </Link>
                <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Privacidade
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 pt-6 border-t border-border/30"
            initial={{ opacity: 0 }}
            animate={footerInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Astro Conecta. Todos os direitos reservados.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
