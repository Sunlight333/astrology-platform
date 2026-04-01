import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewChartPage from './pages/NewChartPage';
import ChartPage from './pages/ChartPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TransitsPage from './pages/TransitsPage';
import TransitCalendarPage from './pages/TransitCalendarPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-chart"
              element={
                <ProtectedRoute>
                  <NewChartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chart/:id"
              element={
                <ProtectedRoute>
                  <ChartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transits/:birthProfileId"
              element={
                <ProtectedRoute>
                  <TransitsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transits/:birthProfileId/calendar"
              element={
                <ProtectedRoute>
                  <TransitCalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/success"
              element={<PaymentSuccessPage />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
