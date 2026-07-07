import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, ScanLine, BarChart2,
  Settings, LogOut, GraduationCap, Shield, User,
  Activity, Terminal, Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  educator: { label: "Educator", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)" },
  admin:    { label: "Admin",    color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  auditor:  { label: "Auditor",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

type NavItem = { href: string; icon: React.ElementType; label: string };

const EDUCATOR_NAV: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/classes",   icon: BookOpen,        label: "Classes" },
  { href: "/exams",     icon: GraduationCap,   label: "Exams" },
  { href: "/students",  icon: Users,           label: "Students" },
  { href: "/scanner",   icon: ScanLine,        label: "Scanner" },
  { href: "/reports",   icon: BarChart2,       label: "Reports" },
  { href: "/settings",  icon: Settings,        label: "Settings" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", icon: Building2,       label: "Command Center" },
  { href: "/classes",   icon: BookOpen,        label: "Classes" },
  { href: "/students",  icon: Users,           label: "Students" },
  { href: "/reports",   icon: Activity,        label: "Analytics" },
  { href: "/settings",  icon: Settings,        label: "Settings" },
];

const AUDITOR_NAV: NavItem[] = [
  { href: "/dashboard", icon: Shield,          label: "Audit Hub" },
  { href: "/reports",   icon: BarChart2,       label: "Reports" },
  { href: "/settings",  icon: Terminal,        label: "System" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { userProfile, logout } = useAuth();

  const role = userProfile?.role ?? "educator";
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.educator;

  const navItems =
    role === "admin" ? ADMIN_NAV :
    role === "auditor" ? AUDITOR_NAV :
    EDUCATOR_NAV;

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col z-10">

        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            V
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-foreground leading-none">VERITAS</h1>
            <p className="text-[10px] text-primary/80 uppercase tracking-widest font-mono mt-1">SYS.OP.READY</p>
          </div>
        </div>

        {/* Role badge strip */}
        <div className="px-4 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: badge.bg, border: `1px solid ${badge.color}25` }}>
            {role === "auditor" ? <Shield className="h-3 w-3" style={{ color: badge.color }} />
              : role === "admin" ? <Building2 className="h-3 w-3" style={{ color: badge.color }} />
              : <User className="h-3 w-3" style={{ color: badge.color }} />}
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: badge.color }}>
              {badge.label} Portal
            </span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            <div className="px-3 pb-2 pt-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_4px_0_0_rgba(0,240,255,1)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}>
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User + logout */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/30">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: badge.bg, border: `1px solid ${badge.color}40`, color: badge.color }}>
              {(userProfile?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{userProfile?.name ?? "Teacher"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userProfile?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2" />
        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
