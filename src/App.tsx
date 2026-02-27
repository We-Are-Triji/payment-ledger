import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useAuthStore } from "@/store/auth-store";
import { useLedgerConfig } from "@/hooks/use-ledger-config";

const AuthPage = lazy(() => import("@/pages/auth-page"));
const SetupWizard = lazy(() => import("@/pages/setup-wizard"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const UsersPage = lazy(() => import("@/pages/users-page"));
const TransactionsPage = lazy(() => import("@/pages/transactions-page"));
const CalendarPage = lazy(() => import("@/pages/calendar-page"));
const ClassPage = lazy(() => import("@/pages/class-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

function ProtectedRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function ConfigGuard() {
  const { config, loading } = useLedgerConfig();
  if (loading) return <LoadingSpinner />;
  if (!config) return <Navigate to="/setup" replace />;
  return <Outlet />;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<SetupWizard />} />
              <Route element={<ConfigGuard />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route
                    path="/transactions"
                    element={<TransactionsPage />}
                  />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/class" element={<ClassPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  );
}
