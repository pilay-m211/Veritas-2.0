import { useState, useEffect, useCallback } from "react";
import {
  User, Bell, Shield, Monitor, Settings as SettingsIcon,
  LogIn, LogOut, ScanLine, Database, FileSpreadsheet,
  Save, Trash2, Users, BookOpen, RefreshCw, Clock, Activity,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchActivityLog, fetchAuthLog,
  ACTIVITY_LABELS, ACTIVITY_COLORS,
  type ActivityEntry, type AuthEvent, type ActivityType,
} from "@/lib/activity-logger";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtRelative(d: Date) {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const ACTIVITY_ICON: Record<ActivityType, React.ElementType> = {
  ocr_scan:           ScanLine,
  grade_sync:         Database,
  excel_export_new:   FileSpreadsheet,
  excel_export_merge: FileSpreadsheet,
  draft_save:         Save,
  draft_load:         RefreshCw,
  draft_delete:       Trash2,
  student_import:     Users,
  class_create:       BookOpen,
  exam_create:        BookOpen,
};

// ── Role badge ────────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  educator: { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", label: "Educator" },
  admin:    { color: "#818cf8", bg: "rgba(129,140,248,0.12)", label: "Admin" },
  auditor:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Auditor" },
};

// ── Profile card ──────────────────────────────────────────────────────────────
function ProfileCard() {
  const { userProfile } = useAuth();
  if (!userProfile) return null;
  const rs = ROLE_STYLE[userProfile.role] ?? ROLE_STYLE.educator;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-6 flex items-start gap-5">
      {/* Avatar */}
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-black"
        style={{ background: rs.bg, border: `1px solid ${rs.color}40`, color: rs.color }}>
        {userProfile.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-foreground">{userProfile.name}</h2>
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.color}30` }}>
            {rs.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{userProfile.email}</p>
        {(userProfile.school || userProfile.gradeLevel) && (
          <div className="flex gap-4 mt-3 text-xs font-mono text-muted-foreground">
            {userProfile.school && <span>🏫 {userProfile.school}</span>}
            {userProfile.gradeLevel && <span>📚 {userProfile.gradeLevel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth event row ────────────────────────────────────────────────────────────
function AuthEventRow({ ev }: { ev: AuthEvent }) {
  const isLogin = ev.type === "login";
  const browser = ev.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] ?? "Browser";
  return (
    <div className="flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: isLogin ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.1)" }}>
        {isLogin
          ? <LogIn className="h-4 w-4" style={{ color: "#34d399" }} />
          : <LogOut className="h-4 w-4" style={{ color: "#f87171" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{isLogin ? "Signed In" : "Signed Out"}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{browser}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-mono text-foreground">{fmtDate(ev.timestamp)}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{fmtTime(ev.timestamp)}</p>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const color = ACTIVITY_COLORS[entry.type] ?? "#2dd4bf";
  const Icon = ACTIVITY_ICON[entry.type] ?? Activity;
  return (
    <div className="flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{ACTIVITY_LABELS[entry.type]}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.details}</p>
      </div>
      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] font-mono text-muted-foreground">{fmtRelative(entry.timestamp)}</span>
        <span className="text-[10px] font-mono text-muted-foreground/60">{fmtTime(entry.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
      style={active
        ? { background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }
        : { color: "#64748b", border: "1px solid transparent" }}>
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<"activity" | "auth" | "prefs">("activity");
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [authLog, setAuthLog] = useState<AuthEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    const [acts, auth] = await Promise.all([
      fetchActivityLog(currentUser.uid, 40),
      fetchAuthLog(currentUser.uid, 20),
    ]);
    setActivities(acts);
    setAuthLog(auth);
    setLoadingData(false);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings & Activity</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Your profile, preferences, and session history</p>
        </div>
        <button onClick={loadData} disabled={loadingData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Profile card */}
      <ProfileCard />

      {/* Tabs */}
      <div>
        <div className="flex gap-2 mb-6">
          <Tab active={tab === "activity"} onClick={() => setTab("activity")}>
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> App Activity</span>
          </Tab>
          <Tab active={tab === "auth"} onClick={() => setTab("auth")}>
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Sign-In History</span>
          </Tab>
          <Tab active={tab === "prefs"} onClick={() => setTab("prefs")}>
            <span className="flex items-center gap-2"><SettingsIcon className="h-3.5 w-3.5" /> Preferences</span>
          </Tab>
        </div>

        {/* ── Activity log ── */}
        {tab === "activity" && (
          <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Recent Activity</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{activities.length} entries</span>
            </div>
            {loadingData ? (
              <div className="p-8 text-center text-sm text-muted-foreground font-mono animate-pulse">
                Loading activity log…
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                <p className="text-xs text-muted-foreground/60">Start scanning, syncing grades, or exporting to see your history here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 p-2">
                {activities.map(entry => <ActivityRow key={entry.id} entry={entry} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Auth log ── */}
        {tab === "auth" && (
          <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Sign-In History</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{authLog.length} events</span>
            </div>
            {loadingData ? (
              <div className="p-8 text-center text-sm text-muted-foreground font-mono animate-pulse">
                Loading sign-in history…
              </div>
            ) : authLog.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No sign-in history found.</p>
                <p className="text-xs text-muted-foreground/60">Future logins and sign-outs will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 p-2">
                {authLog.map(ev => <AuthEventRow key={ev.id} ev={ev} />)}
              </div>
            )}

            {/* Security notice */}
            <div className="px-5 py-3 border-t border-border/30 bg-secondary/20">
              <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                <Shield className="h-3 w-3 flex-shrink-0" />
                All session events are stored securely in your private Firestore sub-collection and are only visible to you.
              </p>
            </div>
          </div>
        )}

        {/* ── Preferences ── */}
        {tab === "prefs" && (
          <div className="space-y-4">
            {[
              { icon: User,    label: "Account",       desc: "Manage your profile and credentials", badge: "Coming Soon" },
              { icon: Bell,    label: "Notifications",  desc: "Configure alerts and reminders",       badge: "Coming Soon" },
              { icon: Shield,  label: "Security",       desc: "Password change and 2FA settings",     badge: "Coming Soon" },
              { icon: Monitor, label: "Appearance",     desc: "Theme and display settings",           badge: "Dark Mode"   },
            ].map(({ icon: Icon, label, desc, badge }) => (
              <div key={label} className="rounded-xl border border-border bg-card/60 p-5 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-foreground">{label}</p>
                    <span className="text-xs font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded">{badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            ))}

            {/* System info */}
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <SettingsIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm tracking-wide text-foreground">System Info</h2>
              </div>
              <div className="space-y-2.5 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Platform</span><span className="text-foreground">Veritas v1.0</span></div>
                <div className="flex justify-between"><span>Build</span><span className="text-foreground">2026.07.07</span></div>
                <div className="flex justify-between"><span>Auth Provider</span><span className="text-foreground">Firebase Auth</span></div>
                <div className="flex justify-between"><span>Database</span><span className="text-foreground">PostgreSQL + Firestore</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-primary">OPERATIONAL</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
