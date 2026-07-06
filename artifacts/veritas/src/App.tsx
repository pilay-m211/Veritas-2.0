import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout";

// Pages — public
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Pages — protected
import Dashboard from "@/pages/dashboard";
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

// ── Guard: redirect to /login if not authenticated ──
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#060914" }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mx-auto"
          style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", color: "#060914" }}>V</div>
        <div className="text-sm font-medium animate-pulse" style={{ color: "#2dd4bf" }}>Loading Veritas…</div>
      </div>
    </div>
  );
  if (!currentUser) return <Redirect to="/login" />;
  return <>{children}</>;
}

// ── Guard: redirect already-authenticated users away from auth pages ──
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={() => (
        <RedirectIfAuth><Landing /></RedirectIfAuth>
      )} />
      <Route path="/login" component={() => (
        <RedirectIfAuth><Login /></RedirectIfAuth>
      )} />
      <Route path="/register" component={() => (
        <RedirectIfAuth><Register /></RedirectIfAuth>
      )} />

      {/* Protected — wrapped in RequireAuth + AppLayout */}
      <Route path="/dashboard" component={() => (
        <RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>
      )} />
      <Route path="/classes" component={() => (
        <RequireAuth><AppLayout><Classes /></AppLayout></RequireAuth>
      )} />
      <Route path="/exams" component={() => (
        <RequireAuth><AppLayout><Exams /></AppLayout></RequireAuth>
      )} />
      <Route path="/students" component={() => (
        <RequireAuth><AppLayout><Students /></AppLayout></RequireAuth>
      )} />
      <Route path="/scanner" component={() => (
        <RequireAuth><AppLayout><Scanner /></AppLayout></RequireAuth>
      )} />
      <Route path="/reports" component={() => (
        <RequireAuth><AppLayout><Reports /></AppLayout></RequireAuth>
      )} />
      <Route path="/settings" component={() => (
        <RequireAuth><AppLayout><Settings /></AppLayout></RequireAuth>
      )} />

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
