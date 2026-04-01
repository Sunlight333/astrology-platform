import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/#sobre', label: 'Sobre' },
    { to: '/new-chart', label: 'Mapa Astral' },
    { to: '/pricing', label: 'Precos' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="font-display text-lg text-foreground hover:text-primary transition-colors duration-200"
            >
              Astro Conecta
            </Link>

            {/* Desktop center nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
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
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
                  >
                    Meu Painel
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
                  <Link to="/new-chart" className="btn-primary !py-2 !px-5 !rounded-xl text-sm">
                    Comecar
                  </Link>
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

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border/40 bg-white/95 backdrop-blur-xl"
            >
              <div className="px-6 py-5 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm text-muted-foreground font-medium hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-border/30">
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
                </div>
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

      {/* Footer */}
      <footer className="py-16 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {/* Brand column */}
            <div>
              <p className="font-display text-lg text-foreground mb-2">
                Astro Conecta
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Astrologia acessivel para autoconhecimento e transformacao pessoal.
              </p>
            </div>

            {/* Links column */}
            <div>
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
            </div>

            {/* Legal column */}
            <div>
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
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Astro Conecta. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
