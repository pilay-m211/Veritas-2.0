import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout";

// Public pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Protected pages
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AuditorDashboard from "@/pages/auditor-dashboard";
import Classes from "@/pages/classes";
import Exams from "@/pages/exams";
import Students from "@/pages/students";
import Scanner from "@/pages/scanner";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ── Full-screen loader shown while Firebase resolves auth state ──────────────
function SplashLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#060914" }}>
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto animate-pulse"
          style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", color: "#060914" }}>V</div>
        <p className="text-sm font-medium font-mono tracking-wider" style={{ color: "#2dd4bf" }}>VERITAS · LOADING</p>
      </div>
    </div>
  );
}

// ── Role-based dashboard dispatcher ─────────────────────────────────────────
function DashboardDispatcher() {
  const { userProfile, loading } = useAuth();
  if (loading) return <SplashLoader />;
  switch (userProfile?.role) {
    case "admin":   return <AdminDashboard />;
    case "auditor": return <AuditorDashboard />;
    default:        return <Dashboard />;
  }
}

// ── Auth guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (!currentUser) return <Redirect to="/" />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (currentUser) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

// ── Role guard for admin-only / auditor-only pages ───────────────────────────
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (userProfile?.role !== role) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

// ── Convenience wrapper ───────────────────────────────────────────────────────
function Protected({ children }: { children: React.ReactNode }) {
  return <RequireAuth><AppLayout>{children}</AppLayout></RequireAuth>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/"         component={() => <RedirectIfAuth><Landing /></RedirectIfAuth>} />
      <Route path="/login"    component={() => <RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/register" component={() => <RedirectIfAuth><Register /></RedirectIfAuth>} />

      {/* Protected — role-dispatched dashboard */}
      <Route path="/dashboard" component={() => <Protected><DashboardDispatcher /></Protected>} />

      {/* Role-specific portals (also accessible directly by URL) */}
      <Route path="/admin" component={() => (
        <Protected><RequireRole role="admin"><AdminDashboard /></RequireRole></Protected>
      )} />
      <Route path="/audit" component={() => (
        <Protected><RequireRole role="auditor"><AuditorDashboard /></RequireRole></Protected>
      )} />

      {/* Standard educator pages */}
      <Route path="/classes"  component={() => <Protected><Classes /></Protected>} />
      <Route path="/exams"    component={() => <Protected><Exams /></Protected>} />
      <Route path="/students" component={() => <Protected><Students /></Protected>} />
      <Route path="/scanner"  component={() => <Protected><Scanner /></Protected>} />
      <Route path="/reports"  component={() => <Protected><Reports /></Protected>} />
      <Route path="/settings" component={() => <Protected><Settings /></Protected>} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  useEffect(() => { document.documentElement.classList.add("dark"); }, []);
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppInner />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
