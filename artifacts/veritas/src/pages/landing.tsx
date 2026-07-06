import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ScanLine, FileSpreadsheet, BarChart3, Shield, Zap,
  CheckCircle2, ArrowRight, Upload, Eye, Download,
  BookOpen, Users, ClipboardCheck, ChevronRight,
} from "lucide-react";

// ── Ambient particle canvas ──────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5, alpha: Math.random() * 0.4 + 0.1,
      });
    }
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45,212,191,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── Glassmorphism card ────────────────────────────────────────────────────────
function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl border border-white/8 ${className}`}
      style={{ background: "rgba(16,23,44,0.55)", backdropFilter: "blur(18px) saturate(140%)", ...style }}>
      {children}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      style={scrolled ? { background: "rgba(6,9,20,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" } : {}}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[#060914] text-base shadow-lg"
            style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", boxShadow: "0 4px 20px rgba(45,212,191,0.4)" }}>
            V
          </div>
          <span style={{ color: "#f1f5f9" }}>VERITAS</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm font-medium" style={{ color: "#94a3b8" }}>
          {["Features", "How It Works", "Scanner"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-all">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}>
            Sign In
          </button>
          <button onClick={() => navigate("/register")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "#060914", boxShadow: "0 6px 20px rgba(45,212,191,0.3)" }}>
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [, navigate] = useLocation();
  return (
    <section className="relative pt-40 pb-24 px-6 text-center" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 transition-all"
          style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf" }}>
          <Zap className="h-3 w-3" /> AI-Powered OCR Grading Ledger
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6" style={{ color: "#f1f5f9" }}>
          Grade Smarter.{" "}
          <span style={{ background: "linear-gradient(135deg,#2dd4bf 0%,#22d3ee 45%,#818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Not Harder.
          </span>
        </h1>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
          Upload paper grading sheets. Veritas OCR extracts every score, you verify side-by-side,
          then sync directly to your gradebook or export to Excel — all in seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button onClick={() => navigate("/register")}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 active:translate-y-0"
            style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "#060914", boxShadow: "0 10px 35px rgba(45,212,191,0.35)" }}>
            Start Grading Free <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate("/login")}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:-translate-y-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { num: "98.7%", label: "OCR Accuracy" },
            { num: "5×", label: "Faster Grading" },
            { num: "100%", label: "Data Owned" },
          ].map(s => (
            <GlassCard key={s.label} className="py-5 px-4 text-center">
              <div className="text-2xl font-black mb-1"
                style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.num}
              </div>
              <div className="text-xs font-medium" style={{ color: "#64748b" }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: ScanLine, title: "OCR Scanning", color: "#2dd4bf", desc: "Drop any photo of a paper grading sheet. Tesseract OCR extracts every student ID and score automatically." },
  { icon: Eye, title: "Split-Screen Verify", color: "#22d3ee", desc: "Original image on the left, parsed records on the right — catch errors before they reach your gradebook." },
  { icon: FileSpreadsheet, title: "Excel Integration", color: "#818cf8", desc: "Download a fresh gradebook or merge into an existing .xlsx file with one click. No CSV wrangling." },
  { icon: Upload, title: "Live Grade Sync", color: "#f59e0b", desc: "Push verified scores straight to the database, matched by student school ID across any exam." },
  { icon: BarChart3, title: "Reports & Analytics", color: "#34d399", desc: "Per-exam avg, highest, lowest, pass rate, score distribution chart, and top/bottom performers — instantly." },
  { icon: Shield, title: "Draft Safeguards", color: "#f87171", desc: "Save mid-session work as named drafts. Come back later without losing a single extracted record." },
];

function Features() {
  return (
    <section id="features" className="relative py-24 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf" }}>
            <BookOpen className="h-3 w-3" /> Everything You Need
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>Built for Modern Educators</h2>
          <p className="mt-4 text-lg" style={{ color: "#94a3b8" }}>Every tool you need to close the grading loop — from paper to gradebook.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <GlassCard key={f.title} className="p-6 group hover:-translate-y-1 transition-all duration-300"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: "#f1f5f9" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: Upload, title: "Upload & Scan", color: "#2dd4bf", desc: "Drop or paste any photo of a graded paper. Veritas pre-processes and runs OCR automatically — no manual typing." },
  { n: "02", icon: Eye, title: "Verify & Correct", color: "#22d3ee", desc: "The split-screen workspace shows your image alongside extracted records. Edit any score or ID inline with one click." },
  { n: "03", icon: Download, title: "Sync & Export", color: "#818cf8", desc: "Push grades to the database for any exam, download a fresh Excel file, or merge scores into your existing gradebook." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf" }}>
            <ClipboardCheck className="h-3 w-3" /> The Workflow
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>From Paper to Gradebook in 3 Steps</h2>
        </div>
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-[16.66%] right-[16.66%] h-px"
            style={{ background: "linear-gradient(90deg,#2dd4bf30,#22d3ee50,#818cf830)" }} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative z-10"
                  style={{ background: `${s.color}15`, border: `2px solid ${s.color}40`, boxShadow: `0 0 40px ${s.color}20` }}>
                  <s.icon className="h-7 w-7" style={{ color: s.color }} />
                  <span className="absolute -top-2 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: s.color, color: "#060914" }}>{s.n}</span>
                </div>
                <h3 className="font-bold text-lg mb-3" style={{ color: "#f1f5f9" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{s.desc}</p>
                {i < 2 && <ChevronRight className="lg:hidden h-6 w-6 mt-4" style={{ color: "#2dd4bf40" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Scanner preview ───────────────────────────────────────────────────────────
function ScannerPreview() {
  return (
    <section id="scanner" className="relative py-24 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto">
        <GlassCard className="overflow-hidden" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,212,191,0.12)" }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8">
            <div className="flex gap-1.5">
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            </div>
            <div className="flex-1 ml-3 text-xs font-mono text-center rounded-lg px-3 py-1 mx-auto max-w-xs"
              style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
              veritas.app/scanner
            </div>
          </div>
          {/* Split-screen mockup */}
          <div className="grid grid-cols-2 min-h-64">
            <div className="border-r border-white/8 p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#2dd4bf" }}>
                <Eye className="h-3.5 w-3.5" /> Source Document
              </div>
              <div className="flex-1 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10"
                style={{ minHeight: 120 }}>
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "#2dd4bf40" }} />
                  <p className="text-xs" style={{ color: "#64748b" }}>Image appears here</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#22d3ee" }}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Parsed Records
              </div>
              <div className="space-y-1.5">
                {[
                  { sid: "2024-00001", score: 92, pass: true },
                  { sid: "2024-00002", score: 68, pass: false },
                  { sid: "2024-00003", score: 85, pass: true },
                  { sid: "2024-00004", score: 91, pass: true },
                ].map(r => (
                  <div key={r.sid} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "#2dd4bf" }}>{r.sid}</span>
                    <span className="font-bold" style={{ color: r.pass ? "#34d399" : "#f87171" }}>{r.score}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background: r.pass ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: r.pass ? "#34d399" : "#f87171" }}>
                      {r.pass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <div className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center"
                  style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "#060914" }}>
                  Sync to DB
                </div>
                <div className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center border border-white/10"
                  style={{ color: "#94a3b8" }}>
                  Export Excel
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTA() {
  const [, navigate] = useLocation();
  return (
    <section className="relative py-24 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-3xl mx-auto text-center">
        <GlassCard className="p-14" style={{ boxShadow: "0 40px 80px rgba(45,212,191,0.08), 0 0 0 1px rgba(45,212,191,0.15)" }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf" }}>
            <Users className="h-3 w-3" /> Join Educators Worldwide
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-4" style={{ color: "#f1f5f9" }}>
            Ready to Transform{" "}
            <span style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Grading?
            </span>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#94a3b8" }}>
            Set up in minutes. No credit card required. Full control of your data.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-1"
              style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee)", color: "#060914", boxShadow: "0 12px 40px rgba(45,212,191,0.4)" }}>
              Create Free Account <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}>
              Sign In
            </button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative py-12 px-6 border-t" style={{ zIndex: 1, borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 font-extrabold text-lg">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg,#2dd4bf,#22d3ee,#818cf8)", color: "#060914" }}>V</div>
          <span style={{ color: "#f1f5f9" }}>VERITAS</span>
        </div>
        <p className="text-xs" style={{ color: "#475569" }}>© {new Date().getFullYear()} Veritas · Automated OCR Grading Ledger</p>
        <div className="flex gap-5 text-xs" style={{ color: "#475569" }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "#060914", color: "#f1f5f9" }}>
      {/* Backgrounds */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 15% 20%,rgba(45,212,191,0.10),transparent 45%),radial-gradient(circle at 85% 30%,rgba(129,140,248,0.10),transparent 45%),radial-gradient(circle at 50% 90%,rgba(34,211,238,0.08),transparent 50%)"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center,black 30%,transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center,black 30%,transparent 80%)"
        }} />
      </div>
      <Particles />

      {/* Content */}
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ScannerPreview />
      <CTA />
      <Footer />
    </div>
  );
}
