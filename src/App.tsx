import { useEffect, lazy, Suspense, useRef } from "react";
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
import { useLedgerStore } from "@/store/ledger-store";
import { useBackups } from "@/hooks/use-backups";

const AuthPage = lazy(() => import("@/pages/auth-page"));
const SetupWizard = lazy(() => import("@/pages/setup-wizard"));
const LedgerSelectPage = lazy(() => import("@/pages/ledger-select-page"));
const AcceptInvitePage = lazy(() => import("@/pages/accept-invite-page"));
const PublicBalancePage = lazy(() => import("@/pages/public-balance-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const UsersPage = lazy(() => import("@/pages/users-page"));
const TransactionsPage = lazy(() => import("@/pages/transactions-page"));
const CalendarPage = lazy(() => import("@/pages/calendar-page"));
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

function LedgerGuard() {
  const activeLedgerId = useLedgerStore((s) => s.activeLedgerId);
  const { config, loading } = useLedgerConfig();
  const { autoBackupIfNeeded } = useBackups(config);
  const autoBackupRan = useRef(false);

  useEffect(() => {
    if (config && !autoBackupRan.current) {
      autoBackupRan.current = true;
      autoBackupIfNeeded();
    }
  }, [config, autoBackupIfNeeded]);

  if (!activeLedgerId) return <Navigate to="/ledgers" replace />;
  if (loading) return <LoadingSpinner />;
  if (!config) return <Navigate to="/ledgers" replace />;
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

            <Route
              path="/invite/:token"
              element={<AcceptInvitePage />}
            />

            <Route
              path="/share/:token"
              element={<PublicBalancePage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/ledgers" element={<LedgerSelectPage />} />
              <Route path="/setup" element={<SetupWizard />} />
              <Route element={<LedgerGuard />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route
                    path="/transactions"
                    element={<TransactionsPage />}
                  />
                  <Route path="/calendar" element={<CalendarPage />} />
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
