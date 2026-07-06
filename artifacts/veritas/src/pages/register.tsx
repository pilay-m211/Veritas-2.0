import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, School, BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/auth-context";

type Step = 1 | 2 | 3;

const ROLES: { value: UserRole; label: string; desc: string; icon: string }[] = [
  { value: "educator", label: "Educator", desc: "Scan, verify, and sync class grades", icon: "📚" },
  { value: "admin", label: "Administrator", desc: "Institutional oversight and analytics", icon: "🏫" },
  { value: "auditor", label: "Auditor", desc: "Read-only compliance and audit access", icon: "🔍" },
];

const GRADE_LEVELS = ["K–3", "4–6", "7–9", "10–12", "Higher Education", "Mixed / All Levels"];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {([1, 2, 3] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
            style={{
              borderColor: step > s ? "#34d399" : step === s ? "#2dd4bf" : "rgba(255,255,255,0.1)",
              background: step > s ? "#34d399" : step === s ? "rgba(45,212,191,0.12)" : "transparent",
              color: step > s ? "#060914" : step === s ? "#2dd4bf" : "#475569",
              boxShadow: step === s ? "0 0 20px rgba(45,212,191,0.25)" : "none",
            }}>
            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {i < 2 && (
            <div className="w-10 h-0.5 rounded-full transition-all"
              style={{ background: step > s ? "#34d399" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function InputField({
  label, type = "text", value, onChange, placeholder, icon: Icon,
  rightSlot, required = true,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; rightSlot?: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#64748b" }} />}
        <input
          type={type} value={value} required={required}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full py-3.5 rounded-xl text-sm outline-none transition-all"
          style={{
            paddingLeft: Icon ? "2.75rem" : "1rem", paddingRight: rightSlot ? "2.75rem" : "1rem",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#f1f5f9",
          }}
          onFocus={e => { e.target.style.borderColor = "#2dd4bf"; e.target.style.boxShadow = "0 0 0 3px rgba(45,212,191,0.1)"; e.target.style.background = "rgba(45,212,191,0.04)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
        />
        {rightSlot && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [role, setRole] = useState<UserRole>("educator");
  const [school, setSchool] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  const strengthColors = ["#1e293b", "#ef4444", "#f59e0b", "#3b82f6", "#34d399"];
  const strengthLabels = ["", "Too short", "Fair", "Good", "Strong"];

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!name.trim()) { setError("Please enter your full name."); return; }
      if (!email.trim()) { setError("Please enter your email."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) { nextStep(); return; }
    setError(""); setLoading(true);
    try {
      await register(email, password, name.trim(), role, school, gradeLevel);
      navigate("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code.includes("email-already-in-use")) setError("This email is already registered.");
      else if (code.includes("weak-password")) setError("Password is too weak.");
      else setError(err?.message ?? "Registration failed. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  const STEP_TITLES: Record<Step, { title: string; sub: string }> = {
    1: { title: "Create Your Account", sub: "Start your Veritas journey in seconds." },
    2: { title: "Your Professional Profile", sub: "Help us personalize your experience." },
    3: { title: "Review & Launch", sub: "Everything looks good? Let's go." },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: "#060914" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(45,212,191,0.10),transparent)", top:-200, left:-150 }} />
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(129,140,248,0.10),transparent)", bottom:-200, right:-150 }} />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg"
          style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", color: "#060914", boxShadow: "0 6px 24px rgba(45,212,191,0.4)" }}>V</div>
        <span className="font-extrabold text-xl tracking-tight" style={{ color: "#f1f5f9" }}>VERITAS</span>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[460px] rounded-3xl p-10 overflow-hidden"
        style={{ background: "rgba(16,23,44,0.88)", backdropFilter:"blur(24px) saturate(140%)", border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 30px 80px rgba(0,0,0,0.5),0 0 60px rgba(45,212,191,0.06)" }}>

        {/* Inner grid bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize:"40px 40px", maskImage:"radial-gradient(ellipse at center,black 30%,transparent 75%)" }} />

        <div className="relative">
          <ProgressBar step={step} />

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: "#f1f5f9" }}>{STEP_TITLES[step].title}</h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>{STEP_TITLES[step].sub}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
              style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171" }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Step 1: Account Details ── */}
            {step === 1 && (
              <>
                <InputField label="Full Name" value={name} onChange={setName} placeholder="Dr. Jane Smith" icon={User} />
                <InputField label="Academic Email" type="email" value={email} onChange={setEmail} placeholder="you@school.edu" icon={Mail} />
                <div>
                  <InputField
                    label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword}
                    placeholder="Create a strong password" icon={Lock}
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: "#64748b" }}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{ background: passwordStrength >= i ? strengthColors[passwordStrength] : "#1e293b" }} />
                        ))}
                      </div>
                      <p className="text-xs mt-1.5 transition-colors" style={{ color: strengthColors[passwordStrength] }}>
                        {strengthLabels[passwordStrength]}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Step 2: Role + School ── */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: "#cbd5e1" }}>System Role</label>
                  <div className="space-y-2.5">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all"
                        style={{
                          background: role === r.value ? "rgba(45,212,191,0.08)" : "rgba(255,255,255,0.03)",
                          border: `2px solid ${role === r.value ? "#2dd4bf" : "rgba(255,255,255,0.07)"}`,
                          boxShadow: role === r.value ? "0 0 20px rgba(45,212,191,0.12)" : "none",
                        }}>
                        <span className="text-xl">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: role === r.value ? "#2dd4bf" : "#f1f5f9" }}>{r.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{r.desc}</p>
                        </div>
                        {role === r.value && <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#2dd4bf" }} />}
                      </button>
                    ))}
                  </div>
                </div>
                <InputField label="School / Institution" value={school} onChange={setSchool} placeholder="Springfield High School" icon={School} required={false} />
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Grade Level (optional)</label>
                  <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color: gradeLevel ? "#f1f5f9" : "#64748b" }}
                    onFocus={e => { e.target.style.borderColor="#2dd4bf"; e.target.style.boxShadow="0 0 0 3px rgba(45,212,191,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor="rgba(255,255,255,0.08)"; e.target.style.boxShadow="none"; }}>
                    <option value="">Choose grade level...</option>
                    {GRADE_LEVELS.map(g => <option key={g} value={g} style={{ background:"#0c1224" }}>{g}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-3">
                {[
                  { label: "Name", value: name },
                  { label: "Email", value: email },
                  { label: "Role", value: ROLES.find(r => r.value === role)?.label ?? role },
                  { label: "School", value: school || "—" },
                  { label: "Grade Level", value: gradeLevel || "—" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-3 rounded-xl text-sm"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "#64748b" }}>{row.label}</span>
                    <span className="font-medium" style={{ color: "#f1f5f9" }}>{row.value}</span>
                  </div>
                ))}
                <p className="text-xs text-center pt-2" style={{ color: "#475569" }}>
                  By creating an account you agree to our <a href="#" style={{ color: "#22d3ee" }}>Terms</a> and <a href="#" style={{ color: "#22d3ee" }}>Privacy Policy</a>.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => (s - 1) as Step)}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#f1f5f9" }}>
                  Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,#2dd4bf,#22d3ee)", color:"#060914", boxShadow:"0 8px 28px rgba(45,212,191,0.3)" }}>
                {loading ? <><span className="animate-spin">⊙</span> Creating account...</>
                  : step === 3 ? "Launch Veritas 🚀" : "Continue →"}
              </button>
            </div>
          </form>

          {step === 1 && (
            <p className="text-center text-sm mt-6" style={{ color: "#94a3b8" }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="font-semibold" style={{ color: "#22d3ee" }}>Sign In</button>
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs mt-6">
        <button onClick={() => navigate("/")} className="transition-colors" style={{ color: "#475569" }}>← Back to home</button>
      </p>
    </div>
  );
}
