import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (code.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError(err?.message ?? "Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#050B18" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.18),transparent)", top:-250, right:-200 }} />
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(129,140,248,0.18),transparent)", bottom:-250, left:-180 }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl"
            style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", color: "#071018", boxShadow: "0 8px 30px rgba(45,212,191,0.4)" }}>
            V
          </div>
          <span className="font-extrabold text-2xl tracking-tight" style={{ color: "#f1f5f9" }}>VERITAS</span>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-10" style={{
          background: "rgba(16,23,44,0.88)",
          backdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)"
        }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "#f1f5f9" }}>Welcome Back</h1>
            <p className="text-sm" style={{ color: "#94a3b8" }}>Sign in to continue to your dashboard.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>
              <span className="text-base">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#64748b" }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ background: "#0d172d", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                  onFocus={e => (e.target.style.boxShadow = "0 0 0 2px #22d3ee")}
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "#64748b" }} />
                <input
                  type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ background: "#0d172d", border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                  onFocus={e => (e.target.style.boxShadow = "0 0 0 2px #22d3ee")}
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#64748b" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#22d3ee")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#94a3b8" }}>
                <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: "#22d3ee" }} />
                Remember Me
              </label>
              <a href="#" className="font-medium transition-colors" style={{ color: "#22d3ee" }}>Forgot Password?</a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "#06121a", boxShadow: "0 10px 30px rgba(34,211,238,0.3)" }}>
              {loading ? (
                <><span className="animate-spin text-lg">⊙</span> Signing in...</>
              ) : (
                <><LogIn className="h-4 w-4" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#94a3b8" }}>
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="font-semibold transition-colors" style={{ color: "#22d3ee" }}>
              Create One
            </button>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
          <button onClick={() => navigate("/")} className="hover:text-white transition-colors">← Back to home</button>
        </p>
      </div>
    </div>
  );
}
