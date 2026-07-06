import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ScanLine, 
  BarChart2, 
  Settings,
  LogOut,
  GraduationCap
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/classes", icon: BookOpen, label: "Classes" },
    { href: "/exams", icon: GraduationCap, label: "Exams" },
    { href: "/students", icon: Users, label: "Students" },
    { href: "/scanner", icon: ScanLine, label: "Scanner" },
    { href: "/reports", icon: BarChart2, label: "Reports" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            V
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-foreground leading-none">VERITAS</h1>
            <p className="text-[10px] text-primary/80 uppercase tracking-widest font-mono mt-1">SYS.OP.READY</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group cursor-pointer",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_4px_0_0_rgba(0,240,255,1)]" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-secondary">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2"></div>
        
        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
