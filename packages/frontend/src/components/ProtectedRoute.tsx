import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        {/* Double-ring spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div
            className="absolute inset-1 w-10 h-10 border-2 border-primary-light/40 border-b-transparent rounded-full"
            style={{ animation: 'spin 1.5s linear infinite reverse' }}
          />
        </div>

        {/* Twinkling dots around spinner */}
        <div className="relative w-20 h-4 -mt-2">
          <div
            className="absolute left-1 top-0 w-1.5 h-1.5 rounded-full animate-twinkle"
            style={{ backgroundColor: 'rgba(123,141,181,0.4)' }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 top-1 w-1.5 h-1.5 rounded-full animate-twinkle-delay"
            style={{ backgroundColor: 'rgba(232,200,138,0.5)' }}
          />
          <div
            className="absolute right-1 top-0 w-1.5 h-1.5 rounded-full animate-twinkle"
            style={{ backgroundColor: 'rgba(184,151,154,0.4)', animationDelay: '0.8s' }}
          />
        </div>

        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Carregando...
        </motion.p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
