import { useState, useEffect, useRef } from "react";
import {
  Video, Menu, X, ArrowRight, Play, Check,
  Brain, BarChart3, Shield, Zap, Users, MessageSquare,
  ChevronRight, Star, Eye, EyeOff, Mail, Lock
} from "lucide-react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #06070d;
    --surface: #0d1021;
    --surface2: #131629;
    --border: rgba(255,255,255,0.07);
    --primary: #4f6ef7;
    --primary-glow: rgba(79,110,247,0.25);
    --accent: #7c3aed;
    --success: #22d3a0;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text: #e8eaf2;
    --muted: #6b7280;
    --heading: 'Syne', sans-serif;
    --body: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--body); }

  .glass {
    background: rgba(13,16,33,0.6);
    border: 1px solid var(--border);
    backdrop-filter: blur(16px);
    border-radius: 16px;
  }

  .glass-hover {
    background: rgba(13,16,33,0.5);
    border: 1px solid var(--border);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
  }
  .glass-hover:hover {
    border-color: rgba(79,110,247,0.35);
    background: rgba(79,110,247,0.06);
    transform: translateY(-3px);
    box-shadow: 0 20px 50px rgba(79,110,247,0.12);
  }

  .glow-btn {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: #fff;
    border: none;
    border-radius: 50px;
    padding: 14px 32px;
    font-family: var(--heading);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 30px var(--primary-glow);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--primary-glow); }

  .outline-btn {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 50px;
    padding: 13px 28px;
    font-family: var(--heading);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .outline-btn:hover { border-color: var(--primary); background: rgba(79,110,247,0.08); }

  .gradient-text {
    background: linear-gradient(135deg, var(--primary), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }

  .tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--heading); font-weight: 600;
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--primary);
  }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes pulse-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .fade-up { animation: fadeUp 0.7s ease both; }
  .float   { animation: float 4s ease-in-out infinite; }
  .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(4,5,10,0.75);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: overlayIn 0.2s ease both;
  }

  .modal-box {
    width: 100%; max-width: 420px;
    background: #0d1021;
    border: 1px solid rgba(79,110,247,0.25);
    border-radius: 24px;
    padding: 36px 32px;
    position: relative;
    animation: modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,110,247,0.1);
  }

  .modal-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted);
    transition: background 0.2s, color 0.2s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.12); color: var(--text); }

  .input-group {
    position: relative; margin-bottom: 16px;
  }
  .input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none;
    display: flex; align-items: center;
  }
  .form-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 13px 14px 13px 42px;
    color: var(--text);
    font-family: var(--body);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .form-input:focus {
    border-color: rgba(79,110,247,0.5);
    background: rgba(79,110,247,0.05);
  }
  .form-input::placeholder { color: var(--muted); }

  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--muted);
    display: flex; align-items: center; padding: 2px;
    transition: color 0.2s;
  }
  .eye-btn:hover { color: var(--text); }

  .divider {
    display: flex; align-items: center; gap: 12px; margin: 20px 0;
  }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider-text { font-size: 12px; color: var(--muted); font-family: var(--heading); }

  .social-btn {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 12px;
    color: var(--text);
    font-family: var(--heading);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background 0.2s, border-color 0.2s;
    margin-bottom: 10px;
  }
  .social-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }

  .score-badge {
    position: absolute; top: 8px; right: 8px;
    font-size: 10px; font-family: var(--heading); font-weight: 700;
    padding: 2px 7px; border-radius: 20px;
  }
  .score-high   { background: rgba(34,211,160,0.15); color: var(--success); }
  .score-mid    { background: rgba(245,158,11,0.15);  color: var(--warning); }
  .score-low    { background: rgba(239,68,68,0.15);   color: var(--danger);  }

  .nav-link {
    font-family: var(--heading); font-size: 14px; font-weight: 600;
    color: #6b7280; text-decoration: none;
    padding: 8px 16px; border-radius: 10px;
    transition: color 0.15s, background 0.15s;
  }
  .nav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }

  .plan-card {
    border-radius: 20px; padding: 28px; display: flex; flex-direction: column;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .plan-card:hover { transform: translateY(-4px); }
  .plan-default { background: var(--surface); border: 1px solid var(--border); }
  .plan-highlight {
    background: linear-gradient(145deg, rgba(79,110,247,0.08), rgba(124,58,237,0.06));
    border: 2px solid rgba(79,110,247,0.4);
    box-shadow: 0 0 60px rgba(79,110,247,0.12);
  }

  .ctrl-btn {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--muted); cursor: pointer;
    transition: background 0.2s;
    font-family: var(--heading); font-weight: 700;
  }
  .ctrl-btn:hover { background: rgba(79,110,247,0.25); color: var(--primary); }
  .ctrl-end { background: rgba(239,68,68,0.8); color: #fff; }
  .ctrl-end:hover { background: rgba(239,68,68,1); }

  section { position: relative; overflow: hidden; }

  @media(max-width:768px){
    .hide-mob { display: none !important; }
    .mob-col { flex-direction: column !important; }
  }
`;

const features = [
  { icon: Brain,        title: "AI Attentiveness",    desc: "Real-time engagement scoring powered by multimodal AI — know who's tuned in and who's zoning out." },
  { icon: BarChart3,    title: "Smart Analytics",     desc: "Deep meeting metrics, talk-time ratios, sentiment trends, and weekly digests delivered automatically." },
  { icon: Shield,       title: "Enterprise Security", desc: "End-to-end encryption, SOC 2 compliant, with granular admin controls and audit logs." },
  { icon: Zap,          title: "Instant Summaries",   desc: "Auto-generated action items, decisions, and follow-ups so nothing slips through the cracks." },
  { icon: Users,        title: "Team Insights",       desc: "Understand your team's collaboration patterns and improve meeting culture over time." },
  { icon: MessageSquare, title: "Live Transcription", desc: "Accurate speaker-diarized transcripts in 30+ languages, searchable forever." },
];

const plans = [
  {
    name: "Starter", price: "Free", period: "",
    desc: "For individuals and small teams",
    features: ["Up to 5 participants", "40-min meetings", "Basic AI analytics", "Screen sharing", "Chat"],
    highlighted: false,
  },
  {
    name: "Pro", price: "$12", period: "/mo",
    desc: "For growing teams that need more",
    features: ["Up to 50 participants", "Unlimited meetings", "Advanced AI analytics", "Recording & export", "Priority support", "Custom branding"],
    highlighted: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    desc: "For large organizations",
    features: ["Unlimited participants", "SSO & compliance", "Dedicated support", "API access", "Admin panel", "SLA guarantee"],
    highlighted: false,
  },
];

const participants = [
  { score: 92 }, { score: 87 }, { score: 95 },
  { score: 78 }, { score: 88 }, { score: 91 },
];

function useFadeUp(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeSection({ children, delay = 0, style = {} }) {
  const [ref, visible] = useFadeUp();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Login Modal ─── */
function LoginModal({ onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Close */}
        <button className="modal-close" onClick={onClose}><X size={14} /></button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px var(--primary-glow)",
          }}>
            <Video size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
            AttendAI
          </span>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          borderRadius: 12, padding: 4, marginBottom: 28,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {["login", "signup"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px 0",
                borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: "var(--heading)", fontWeight: 700, fontSize: 13,
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                background: tab === t ? "rgba(79,110,247,0.18)" : "transparent",
                color: tab === t ? "var(--primary)" : "var(--muted)",
                boxShadow: tab === t ? "0 0 0 1px rgba(79,110,247,0.3)" : "none",
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "var(--heading)", fontWeight: 800, fontSize: 22,
          color: "var(--text)", marginBottom: 6,
        }}>
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          {tab === "login"
            ? "Sign in to your AttendAI workspace."
            : "Start your 14-day free trial. No credit card required."}
        </p>

        {/* Social */}
        <button className="social-btn">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or</span>
          <div className="divider-line" />
        </div>

        {/* Form */}
        {tab === "signup" && (
          <div className="input-group">
            <span className="input-icon"><Users size={15} /></span>
            <input
              className="form-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )}

        <div className="input-group">
          <span className="input-icon"><Mail size={15} /></span>
          <input
            className="form-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <span className="input-icon"><Lock size={15} /></span>
          <input
            className="form-input"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ paddingRight: 42 }}
          />
          <button className="eye-btn" onClick={() => setShowPassword(!showPassword)} type="button">
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {tab === "login" && (
          <div style={{ textAlign: "right", marginBottom: 20, marginTop: -4 }}>
            <a href="#" style={{ fontSize: 12, color: "var(--primary)", fontFamily: "var(--heading)", fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </a>
          </div>
        )}

        <button
          className="glow-btn"
          style={{ width: "100%", justifyContent: "center", marginTop: tab === "login" ? 0 : 4, padding: "14px" }}
        >
          {tab === "login" ? "Sign In" : "Create Account"} <ArrowRight size={15} />
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--muted)", fontFamily: "var(--heading)" }}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => setTab(tab === "login" ? "signup" : "login")}
            style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 700 }}
          >
            {tab === "login" ? "Sign up free" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ─── Header ─── */
function Header({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(6,7,13,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(18px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px var(--primary-glow)",
            }}>
              <Video size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
              AttendAI
            </span>
          </div>

          <nav className="hide-mob" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {["Features", "Pricing", "About"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}
          </nav>

          <div className="hide-mob" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={onLoginClick}
              style={{
                fontFamily: "var(--heading)", fontWeight: 600, fontSize: 14,
                color: "var(--text)", background: "none", border: "none",
                cursor: "pointer", padding: "8px 16px",
                borderRadius: 10,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Log in
            </button>
            <button className="glow-btn" onClick={onLoginClick} style={{ padding: "10px 22px", fontSize: 13 }}>
              Get Started <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection({ onLoginClick }) {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
      <div className="orb" style={{ width: 500, height: 500, background: "rgba(79,110,247,0.12)", top: "10%", left: "-10%" }} />
      <div className="orb" style={{ width: 400, height: 400, background: "rgba(124,58,237,0.1)", bottom: "5%", right: "-8%" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div className="fade-up" style={{ animationDelay: "0s" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(13,16,33,0.7)", border: "1px solid rgba(79,110,247,0.25)",
            backdropFilter: "blur(12px)", borderRadius: 50,
            padding: "8px 18px", marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)" }} className="pulse-glow" />
            <span style={{ fontFamily: "var(--heading)", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
              AI-Powered Meeting Intelligence
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--heading)", fontWeight: 800,
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1,
            letterSpacing: "-0.02em", marginBottom: 24, maxWidth: 820, margin: "0 auto 24px",
          }}>
            Meetings that{" "}
            <span className="gradient-text">understand</span>{" "}
            your team
          </h1>

          <p style={{ color: "var(--muted)", fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.75 }}>
            Real-time AI attentiveness monitoring, smart analytics, and seamless collaboration — all in one premium platform.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button className="glow-btn" onClick={onLoginClick}>
              Start a Meeting <ArrowRight size={15} />
            </button>
            <button className="outline-btn">
              <Play size={14} color="var(--primary)" /> Watch Demo
            </button>
          </div>
        </div>

        <div className="float" style={{ marginTop: 72, animationDelay: "0.3s" }}>
          <div className="glass" style={{ padding: 8, maxWidth: 860, margin: "0 auto" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 12,
              aspectRatio: "16/9", position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: 12, flex: 1 }}>
                {participants.map((p, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.04)", borderRadius: 10,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", position: "relative", padding: 16,
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
                    <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--heading)" }}>
                      Participant {i + 1}
                    </span>
                    <span className={`score-badge ${p.score >= 90 ? "score-high" : p.score >= 80 ? "score-mid" : "score-low"}`}>
                      {p.score}%
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px",
                background: "rgba(13,16,33,0.8)", borderTop: "1px solid var(--border)",
              }}>
                {["Mic", "Cam", "Share", "Chat", "AI"].map(l => (
                  <div key={l} className="ctrl-btn">{l[0]}</div>
                ))}
                <div className="ctrl-btn ctrl-end">✕</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "120px 0" }}>
      <div className="orb" style={{ width: 400, height: 400, background: "rgba(79,110,247,0.08)", top: "20%", right: "-10%" }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <FadeSection style={{ textAlign: "center", marginBottom: 64 }}>
          <span className="tag">Features</span>
          <h2 style={{
            fontFamily: "var(--heading)", fontWeight: 800,
            fontSize: "clamp(1.8rem, 4vw, 3rem)", marginTop: 12, marginBottom: 16,
            letterSpacing: "-0.02em",
          }}>
            Everything you need for{" "}
            <span className="gradient-text">smarter meetings</span>
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
            Powerful AI-driven tools designed to boost engagement and productivity across your entire organization.
          </p>
        </FadeSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <FadeSection key={f.title} delay={i * 0.08}>
              <div className="glass-hover" style={{ padding: 28, height: "100%" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(79,110,247,0.12)", border: "1px solid rgba(79,110,247,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <f.icon size={22} color="var(--primary)" />
                </div>
                <h3 style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 16, marginBottom: 10, color: "var(--text)" }}>
                  {f.title}
                </h3>
                <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection({ onLoginClick }) {
  return (
    <section id="pricing" style={{ padding: "120px 0" }}>
      <div className="orb" style={{ width: 500, height: 500, background: "rgba(124,58,237,0.08)", bottom: "0%", left: "-10%" }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <FadeSection style={{ textAlign: "center", marginBottom: 64 }}>
          <span className="tag">Pricing</span>
          <h2 style={{
            fontFamily: "var(--heading)", fontWeight: 800,
            fontSize: "clamp(1.8rem, 4vw, 3rem)", marginTop: 12, marginBottom: 16,
            letterSpacing: "-0.02em",
          }}>
            Simple, transparent pricing
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
            Choose the plan that fits your team. Upgrade anytime — no hidden fees.
          </p>
        </FadeSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 980, margin: "0 auto" }}>
          {plans.map((plan, i) => (
            <FadeSection key={plan.name} delay={i * 0.1}>
              <div className={`plan-card ${plan.highlighted ? "plan-highlight" : "plan-default"}`} style={{ height: "100%" }}>
                {plan.highlighted && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontFamily: "var(--heading)", fontWeight: 700, fontSize: 11,
                    color: "var(--primary)", background: "rgba(79,110,247,0.12)",
                    padding: "4px 12px", borderRadius: 20, marginBottom: 16, letterSpacing: "0.05em",
                  }}>
                    <Star size={10} fill="var(--primary)" /> MOST POPULAR
                  </span>
                )}
                <h3 style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: 20, color: "var(--text)" }}>
                  {plan.name}
                </h3>
                <div style={{ margin: "12px 0 6px" }}>
                  <span style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: 42, color: "var(--text)" }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>{plan.period}</span>
                  )}
                </div>
                <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>{plan.desc}</p>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                  {plan.features.map(feat => (
                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "rgba(34,211,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Check size={11} color="var(--success)" strokeWidth={3} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLoginClick}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    fontFamily: "var(--heading)", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    border: "none", transition: "transform 0.2s, box-shadow 0.2s",
                    ...(plan.highlighted
                      ? { background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff", boxShadow: "0 0 30px var(--primary-glow)" }
                      : { background: "rgba(255,255,255,0.07)", color: "var(--text)" }
                    ),
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  Get Started
                </button>
              </div>
            </FadeSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)", padding: "32px 24px",
      textAlign: "center", color: "var(--muted)", fontFamily: "var(--heading)",
      fontSize: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, var(--primary), var(--accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Video size={13} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>AttendAI</span>
      </div>
      © 2026 AttendAI. All rights reserved.
    </footer>
  );
}

/* ─── App ─── */
export default function AttendAIDashboard() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showLogin ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLogin]);

  return (
    <>
      <style>{styles}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Header onLoginClick={() => setShowLogin(true)} />
        <HeroSection onLoginClick={() => setShowLogin(true)} />
        <FeaturesSection />
        <PricingSection onLoginClick={() => setShowLogin(true)} />
        <Footer />
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}