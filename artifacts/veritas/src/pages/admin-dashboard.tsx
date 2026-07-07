import { useState } from "react";
import {
  Users, Activity, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, Shield, Download, RefreshCw, BarChart3,
  UserCheck, Settings, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// ── Mock data ────────────────────────────────────────────────────────────────
const EDUCATORS = [
  { id: 1, name: "Dr. Sarah Chen",    email: "s.chen@school.edu",    role: "Educator", classes: 4, scans: 128, status: "active",  lastSeen: "2 min ago" },
  { id: 2, name: "Prof. James Moore", email: "j.moore@school.edu",   role: "Educator", classes: 3, scans: 87,  status: "active",  lastSeen: "15 min ago" },
  { id: 3, name: "Ms. Aisha Diallo",  email: "a.diallo@school.edu",  role: "Educator", classes: 5, scans: 214, status: "active",  lastSeen: "1 hr ago" },
  { id: 4, name: "Mr. Leo Park",      email: "l.park@school.edu",    role: "Educator", classes: 2, scans: 43,  status: "pending", lastSeen: "3 days ago" },
  { id: 5, name: "Dr. Priya Nair",    email: "p.nair@school.edu",    role: "Educator", classes: 6, scans: 301, status: "active",  lastSeen: "Just now" },
];

const USAGE_BARS = [
  { day: "Mon", pct: 61 },
  { day: "Tue", pct: 75 },
  { day: "Wed", pct: 89 },
  { day: "Thu", pct: 54 },
  { day: "Fri", pct: 93 },
  { day: "Sat", pct: 22 },
  { day: "Sun", pct: 18 },
];

const EVENTS = [
  { time: "09:41", user: "Dr. Sarah Chen",    action: "Completed scan batch",  detail: "128 records · Exam #4",   color: "#34d399" },
  { time: "09:12", user: "Prof. James Moore", action: "Exported to Excel",      detail: "87 grades synced",        color: "#2dd4bf" },
  { time: "08:55", user: "Ms. Aisha Diallo",  action: "New class created",      detail: "Grade 11-B · Math",       color: "#818cf8" },
  { time: "08:30", user: "SYSTEM",            action: "OCR engine updated",     detail: "v5.1.2 → v5.2.0",        color: "#f59e0b" },
  { time: "07:58", user: "Mr. Leo Park",      action: "Account pending review", detail: "Awaiting admin approval", color: "#f87171" },
];

// ── Glass card ────────────────────────────────────────────────────────────────
function GCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 ${className}`}
      style={{ background: "rgba(16,23,44,0.55)", backdropFilter: "blur(18px) saturate(140%)" }}>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string; trend?: string;
}) {
  return (
    <GCard className="p-6 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-bold flex items-center gap-1"
            style={{ color: trend.startsWith("+") ? "#34d399" : "#f87171" }}>
            <TrendingUp className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black mb-1" style={{ color: "#f1f5f9" }}>{value}</p>
      <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{sub}</p>
    </GCard>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [approving, setApproving] = useState<number | null>(null);

  function approve(id: number) {
    setApproving(id);
    setTimeout(() => setApproving(null), 1500);
  }

  return (
    <div className="space-y-7" style={{ color: "#f1f5f9" }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8" }}>
              Admin Control Panel
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>Institutional Command Center</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Welcome, {userProfile?.name ?? "Administrator"} · {userProfile?.school || "System Domain Control"}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8" }}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background:"linear-gradient(135deg,#818cf8,#6366f1)", color:"white" }}>
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Active Faculty"  value="42"     sub="↑ 3 added this month"       color="#818cf8" trend="+7.7%" />
        <StatCard icon={Activity}      label="OCR API Consumption"   value="89.4%"  sub="Of monthly allocation"      color="#2dd4bf" trend="+4.2%" />
        <StatCard icon={AlertTriangle} label="Pending System Tasks"  value="1"      sub="Requires admin approval"    color="#f87171" />
        <StatCard icon={BarChart3}     label="Total Scans This Week" value="773"    sub="Across all educators"       color="#34d399" trend="+12%" />
      </div>

      {/* OCR Usage chart + Event log */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">

        {/* Usage bar chart */}
        <GCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base" style={{ color: "#f1f5f9" }}>OCR API Consumption — This Week</h2>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Daily scan requests across all faculty accounts</p>
            </div>
            <span className="text-2xl font-black" style={{ color: "#2dd4bf" }}>89.4%</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {USAGE_BARS.map(b => (
              <div key={b.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-md transition-all duration-500 relative group cursor-pointer"
                  style={{ height: `${b.pct}%`, background: b.pct > 80 ? "linear-gradient(to top,#818cf8,#6366f1)" : "linear-gradient(to top,#2dd4bf60,#2dd4bf)" }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    style={{ background:"rgba(16,23,44,0.9)", border:"1px solid rgba(255,255,255,0.1)", color:"#f1f5f9" }}>
                    {b.pct}%
                  </div>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "#475569" }}>{b.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "#64748b" }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{background:"#2dd4bf"}} />Normal</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{background:"#818cf8"}} />High Load</span>
          </div>
        </GCard>

        {/* Event log */}
        <GCard className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#f1f5f9" }}>Live Activity Feed</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "#34d399" }}>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{background:"#34d399"}} /> Live
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-auto">
            {EVENTS.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[10px] font-mono mt-0.5 flex-shrink-0" style={{ color: "#475569" }}>{e.time}</span>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#f1f5f9" }}>{e.action}</p>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>{e.user} · {e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </GCard>
      </div>

      {/* Educator accounts table */}
      <GCard>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <UserCheck className="h-4 w-4" style={{ color: "#818cf8" }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ color: "#f1f5f9" }}>Faculty Accounts</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background:"rgba(129,140,248,0.12)", color:"#818cf8" }}>{EDUCATORS.length}</span>
          </div>
          <button className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ color: "#818cf8" }}>
            Manage All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1.8fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_100px] gap-0 px-6 py-2.5 text-[10px] font-mono uppercase tracking-wider border-b border-white/6"
          style={{ color: "#475569" }}>
          <span>Name</span><span>Email</span><span>Classes</span><span>Scans</span><span>Status</span><span>Last Active</span><span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/4">
          {EDUCATORS.map(ed => (
            <div key={ed.id} className="grid grid-cols-[1.8fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_100px] gap-0 px-6 py-3 items-center hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background:"linear-gradient(135deg,#818cf8,#6366f1)", color:"white" }}>
                  {ed.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <span className="text-sm font-medium truncate" style={{ color:"#f1f5f9" }}>{ed.name}</span>
              </div>
              <span className="text-xs font-mono truncate" style={{ color:"#64748b" }}>{ed.email}</span>
              <span className="text-sm font-bold" style={{ color:"#f1f5f9" }}>{ed.classes}</span>
              <span className="text-sm font-bold" style={{ color:"#2dd4bf" }}>{ed.scans}</span>
              <span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: ed.status === "active" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                    color: ed.status === "active" ? "#34d399" : "#f87171",
                  }}>
                  {ed.status.toUpperCase()}
                </span>
              </span>
              <span className="text-xs" style={{ color:"#64748b" }}>{ed.lastSeen}</span>
              <div className="flex justify-end">
                {ed.status === "pending" ? (
                  <button onClick={() => approve(ed.id)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    style={{ background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399" }}>
                    {approving === ed.id ? "Approving…" : "Approve"}
                  </button>
                ) : (
                  <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
                    <Settings className="h-3.5 w-3.5" style={{ color:"#475569" }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}
