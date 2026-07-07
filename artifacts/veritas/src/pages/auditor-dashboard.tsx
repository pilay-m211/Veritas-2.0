import { useState } from "react";
import {
  Shield, FileCheck, AlertTriangle, CheckCircle2, Hash,
  Activity, Lock, Eye, Download, RefreshCw, Terminal,
  TrendingDown, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// ── Mock data ─────────────────────────────────────────────────────────────────
const AUDIT_LOGS = [
  { ts: "2026-07-07T09:41:22Z", level: "INFO",  actor: "s.chen@school.edu",    action: "GRADE_EXPORT",     resource: "Exam #4 · 128 records",  hash: "a3f9d1…c82b" },
  { ts: "2026-07-07T09:12:05Z", level: "INFO",  actor: "j.moore@school.edu",   action: "BULK_SYNC",        resource: "Exam #3 · 87 records",   hash: "b7e214…d91a" },
  { ts: "2026-07-07T08:55:37Z", level: "WARN",  actor: "a.diallo@school.edu",  action: "OCR_LOW_CONF",     resource: "Scan session #91",       hash: "c0f83a…1d34" },
  { ts: "2026-07-07T08:30:11Z", level: "INFO",  actor: "SYSTEM",               action: "ENGINE_UPDATE",    resource: "Tesseract v5.1.2→5.2.0", hash: "d4a721…7ef9" },
  { ts: "2026-07-07T08:22:49Z", level: "INFO",  actor: "p.nair@school.edu",    action: "STUDENT_IMPORT",   resource: "47 students · Grade 10",  hash: "e8b93c…4f01" },
  { ts: "2026-07-07T07:58:04Z", level: "ERROR", actor: "l.park@school.edu",    action: "AUTH_PENDING",     resource: "Account approval queue", hash: "f1d462…2c88" },
  { ts: "2026-07-07T07:40:18Z", level: "INFO",  actor: "s.chen@school.edu",    action: "DRAFT_SAVED",      resource: "Math Midterm Draft",     hash: "a9e517…b30d" },
  { ts: "2026-07-07T07:15:33Z", level: "WARN",  actor: "SYSTEM",               action: "HIGH_LOAD",        resource: "OCR API at 93%",         hash: "c2f09b…5e72" },
];

const HASH_LEDGER = [
  { id: "LDG-001", exam: "Math Finals Q1",   records: 34,  exported: "2026-07-06",  hash: "SHA256: a3f9d1c7…c82b4e91", status: "verified" },
  { id: "LDG-002", exam: "Science Midterm",  records: 28,  exported: "2026-07-05",  hash: "SHA256: b7e21489…d91a2f03", status: "verified" },
  { id: "LDG-003", exam: "English Essay",    records: 41,  exported: "2026-07-04",  hash: "SHA256: c0f83a12…1d347b8e", status: "verified" },
  { id: "LDG-004", exam: "History Quiz 3",   records: 22,  exported: "2026-07-03",  hash: "SHA256: d4a7215c…7ef906ba", status: "mismatch" },
];

const CONF_BARS = [
  { label: "English", ai: 97.2, human: 98.1, delta: 0.9 },
  { label: "Math",    ai: 94.5, human: 96.3, delta: 1.8 },
  { label: "Science", ai: 96.8, human: 97.4, delta: 0.6 },
  { label: "History", ai: 91.2, human: 95.7, delta: 4.5 },
  { label: "Arts",    ai: 88.9, human: 93.2, delta: 4.3 },
];

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  INFO:  { bg: "rgba(45,212,191,0.10)",  color: "#2dd4bf" },
  WARN:  { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  ERROR: { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
};

function GCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 ${className}`}
      style={{ background: "rgba(16,23,44,0.55)", backdropFilter: "blur(18px) saturate(140%)" }}>
      {children}
    </div>
  );
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AuditorDashboard() {
  const { userProfile } = useAuth();
  const [logFilter, setLogFilter] = useState<"ALL" | "WARN" | "ERROR">("ALL");
  const filtered = AUDIT_LOGS.filter(l => logFilter === "ALL" || l.level === logFilter);

  return (
    <div className="space-y-7" style={{ color: "#f1f5f9" }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
              <Lock className="h-3 w-3 inline mr-1" />Read-Only · Auditor Access
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>Compliance & Algorithmic Audit Hub</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {userProfile?.name ?? "Auditor"} · Cryptographic Record Hash Verification Console
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8" }}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#060914" }}>
            <Download className="h-4 w-4" /> Export Audit Log
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileCheck,     label: "Verified Ledgers",   value: "3 / 4",  sub: "1 hash mismatch detected", color: "#f59e0b" },
          { icon: AlertTriangle, label: "Warnings (24h)",     value: "2",      sub: "High load + low confidence", color: "#f87171" },
          { icon: Activity,      label: "Avg OCR Confidence", value: "93.7%",  sub: "AI vs human corrected",     color: "#2dd4bf" },
          { icon: Shield,        label: "Tamper Events",      value: "0",      sub: "No integrity violations",   color: "#34d399" },
        ].map(s => (
          <GCard key={s.label} className="p-5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black mb-0.5" style={{ color: "#f1f5f9" }}>{s.value}</p>
            <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.sub}</p>
          </GCard>
        ))}
      </div>

      {/* OCR Confidence Variance + Hash Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">

        {/* OCR confidence chart */}
        <GCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4" style={{ color: "#2dd4bf" }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ color: "#f1f5f9" }}>OCR Algorithmic Variance by Subject</h2>
          </div>
          <p className="text-xs mb-5" style={{ color: "#475569" }}>AI confidence vs. human-corrected inputs · delta = algorithmic drift</p>
          <div className="space-y-4">
            {CONF_BARS.map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{b.label}</span>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span style={{ color: "#2dd4bf" }}>AI {b.ai}%</span>
                    <span style={{ color: "#34d399" }}>Human {b.human}%</span>
                    <span className="flex items-center gap-0.5" style={{ color: b.delta > 2 ? "#f87171" : "#f59e0b" }}>
                      {b.delta > 2 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      Δ{b.delta}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                  {/* AI bar */}
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width:`${b.ai}%`, background:"rgba(45,212,191,0.5)" }} />
                  {/* Human bar */}
                  <div className="absolute left-0 top-0 h-full rounded-full opacity-70" style={{ width:`${b.human}%`, background: b.delta > 2 ? "rgba(248,113,113,0.7)" : "rgba(52,211,153,0.7)" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-5 text-xs" style={{ color: "#475569" }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded inline-block" style={{background:"#2dd4bf80"}} />AI Confidence</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded inline-block" style={{background:"#34d39980"}} />Human Corrected</span>
          </div>
        </GCard>

        {/* Hash ledger */}
        <GCard className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Hash className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ color: "#f1f5f9" }}>Tamper-Evident Hash Ledger</h2>
          </div>
          <div className="space-y-3 flex-1">
            {HASH_LEDGER.map(l => (
              <div key={l.id} className="rounded-xl p-3.5 transition-colors"
                style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${l.status === "mismatch" ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold" style={{ color:"#f1f5f9" }}>{l.exam}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: l.status === "verified" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                      color: l.status === "verified" ? "#34d399" : "#f87171",
                    }}>
                    {l.status === "verified"
                      ? <><CheckCircle2 className="h-2.5 w-2.5" />VERIFIED</>
                      : <><AlertTriangle className="h-2.5 w-2.5" />MISMATCH</>}
                  </span>
                </div>
                <p className="text-[10px] font-mono mb-1" style={{ color:"#2dd4bf" }}>{l.hash}</p>
                <div className="flex gap-3 text-[10px]" style={{ color:"#475569" }}>
                  <span>{l.records} records</span>
                  <span>Exported {l.exported}</span>
                  <span>{l.id}</span>
                </div>
              </div>
            ))}
          </div>
        </GCard>
      </div>

      {/* System audit log terminal */}
      <GCard>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ color: "#f1f5f9" }}>System Audit Log</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background:"rgba(245,158,11,0.12)", color:"#f59e0b" }}>{filtered.length} entries</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(["ALL", "WARN", "ERROR"] as const).map(f => (
              <button key={f} onClick={() => setLogFilter(f)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                style={{
                  background: logFilter === f ? "rgba(245,158,11,0.15)" : "transparent",
                  border: `1px solid ${logFilter === f ? "rgba(245,158,11,0.4)" : "transparent"}`,
                  color: logFilter === f ? "#f59e0b" : "#475569",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-xs space-y-1 max-h-72 overflow-y-auto" style={{ background:"rgba(0,0,0,0.3)" }}>
          <div className="text-[10px] mb-3" style={{ color:"#475569" }}>
            [RUNTIME SEED: {new Date().toISOString()}] · READ-ONLY AUDIT STREAM
          </div>
          {filtered.map((log, i) => {
            const s = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.INFO;
            return (
              <div key={i} className="flex items-start gap-3 py-1 hover:bg-white/3 rounded px-1 transition-colors">
                <span style={{ color: "#475569" }}>{formatTs(log.ts)}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}>{log.level}</span>
                <span style={{ color: "#818cf8" }}>{log.actor}</span>
                <span style={{ color: "#f1f5f9" }}>{log.action}</span>
                <span className="ml-auto flex-shrink-0" style={{ color: "#475569" }}>{log.resource}</span>
                <span className="flex-shrink-0" style={{ color: "#2dd4bf" }}>[{log.hash}]</span>
              </div>
            );
          })}
        </div>
      </GCard>
    </div>
  );
}
