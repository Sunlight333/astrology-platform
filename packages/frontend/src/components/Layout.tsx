import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Quem somos' },
    { to: '/new-chart', label: 'Mapa Astral' },
    { to: '/dashboard', label: 'Mapa Anual' },
    { to: '/pricing', label: 'Horoscopo Mensal' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="font-display font-medium text-primary tracking-wider text-sm"
            >
              ASTRO CONECTA
            </Link>

            {/* Desktop center nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className="text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/new-chart"
                  className="bg-primary text-white px-6 py-2 rounded-md text-sm font-body hover:bg-primary-dark transition-colors"
                >
                  Descubra seu mapa
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to + link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <span className="block text-sm text-muted-foreground">{user?.name}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="text-sm text-destructive"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/new-chart"
                onClick={() => setMobileOpen(false)}
                className="inline-block bg-primary text-white px-6 py-2 rounded-md text-sm font-body mt-2"
              >
                Descubra seu mapa
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-20" />

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-12 bg-section-alt border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-display font-medium text-primary tracking-wider text-sm mb-2">
            ASTRO CONECTA
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Astro Conecta. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
