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

  return (
    <div className="min-h-screen bg-cosmic-dark text-white relative overflow-hidden">
      {/* Starfield background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.5), transparent)',
            'radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.4), transparent)',
            'radial-gradient(1.5px 1.5px at 50% 10%, rgba(255,215,0,0.4), transparent)',
            'radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.3), transparent)',
            'radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.5), transparent)',
            'radial-gradient(1.5px 1.5px at 15% 90%, rgba(159,148,255,0.3), transparent)',
            'radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.4), transparent)',
            'radial-gradient(1px 1px at 80% 15%, rgba(255,215,0,0.3), transparent)',
            'radial-gradient(1px 1px at 40% 35%, rgba(255,255,255,0.3), transparent)',
            'radial-gradient(1.5px 1.5px at 25% 70%, rgba(255,255,255,0.4), transparent)',
          ].join(', '),
          backgroundSize: '200px 200px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 border-b border-celestial-800/30 bg-cosmic-deeper/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="font-display text-2xl text-celestial-300 hover:text-celestial-200 transition-colors">
              Mapa Astral
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-star-silver hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link to="/dashboard" className="text-star-silver hover:text-white transition-colors text-sm">
                Meu Painel
              </Link>
              <Link to="/pricing" className="text-star-silver hover:text-white transition-colors text-sm">
                Precos
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-celestial-200 text-sm">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-star-silver hover:text-star-red transition-colors"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-4">
                  <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                    Cadastro
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-star-silver"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-celestial-800/30 bg-cosmic-deeper/95 backdrop-blur-md px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-star-silver hover:text-white">
              Home
            </Link>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-star-silver hover:text-white">
              Meu Painel
            </Link>
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="block text-star-silver hover:text-white">
              Precos
            </Link>
            {isAuthenticated ? (
              <>
                <span className="block text-celestial-200 text-sm">{user?.name}</span>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-star-red text-sm">
                  Sair
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm py-1.5 px-4">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-sm py-1.5 px-4">
                  Cadastro
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-celestial-800/30 bg-cosmic-deeper/60 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-star-silver text-sm">
          <p className="font-display text-celestial-400 mb-2">Mapa Astral</p>
          <p>&copy; {new Date().getFullYear()} Mapa Astral. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
