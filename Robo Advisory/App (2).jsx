import { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_URL_HERE";
// Replace with your Google Apps Script Web App URL

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
// Hybrid light+dark palette
// Light zones: warm ivory/parchment for questionnaire steps
// Dark zones:  deep slate for dashboard/data cards
const T = {
  // Light surface (questionnaire bg)
  bgLight:    "#f7f3ee",
  surface:    "#ffffff",
  surfaceAlt: "#f0ebe3",

  // Dark surface (dashboard cards)
  bgDark:     "#1a1f2e",
  cardDark:   "#212736",
  cardDarker: "#181c29",

  // Borders
  borderLight: "#e2d9cc",
  borderDark:  "#2a3144",

  // Text
  textDark:   "#1a1a2e",
  textMid:    "#4a4a6a",
  textMuted:  "#8a8aaa",
  textLight:  "#f0ede8",
  textFaded:  "#5a6480",

  // Accents
  gold:       "#b8860b",
  goldLight:  "#d4a017",
  goldPale:   "#f5e6c0",
  teal:       "#0d9488",
  tealLight:  "#14b8a6",
  danger:     "#dc2626",
  dangerPale: "#fef2f2",
};

// ─── AHAM MODEL ────────────────────────────────────────────────────────────
const PROFILES = {
  Conservative: {
    color: T.teal, colorLight: "#e6faf8", borderColor: "#99e6df",
    cagr: "10–12%", cagrMid: 0.11, volatility: "Low",
    tagline: "Stable returns with capital protection",
    assets: [
      { name: "NIFTY 50",        pct: 30, type: "equity", color: "#b8860b" },
      { name: "Corporate Bonds", pct: 33, type: "debt",   color: "#0d9488" },
      { name: "Gold BEES ETF",   pct: 15, type: "gold",   color: "#d97706" },
      { name: "NIFTY Realty",    pct:  5, type: "sector", color: "#7c3aed" },
      { name: "NIFTY Smallcap",  pct:  7, type: "equity", color: "#ea580c" },
      { name: "NASDAQ-100 ETF",  pct: 10, type: "global", color: "#2563eb" },
    ],
  },
  Moderate: {
    color: T.gold, colorLight: "#fefce8", borderColor: "#fde68a",
    cagr: "12–18%", cagrMid: 0.15, volatility: "Moderate",
    tagline: "Balanced growth with managed risk",
    assets: [
      { name: "NIFTY 50",        pct: 40, type: "equity", color: "#b8860b" },
      { name: "Corporate Bonds", pct: 20, type: "debt",   color: "#0d9488" },
      { name: "Gold BEES ETF",   pct:  8, type: "gold",   color: "#d97706" },
      { name: "NIFTY Realty",    pct:  7, type: "sector", color: "#7c3aed" },
      { name: "NIFTY Smallcap",  pct: 15, type: "equity", color: "#ea580c" },
      { name: "NASDAQ-100 ETF",  pct: 10, type: "global", color: "#2563eb" },
    ],
  },
  Aggressive: {
    color: "#dc2626", colorLight: "#fff5f5", borderColor: "#fca5a5",
    cagr: "19–25%", cagrMid: 0.22, volatility: "High",
    tagline: "Maximum wealth creation, high volatility",
    assets: [
      { name: "NIFTY 50",        pct: 35, type: "equity", color: "#b8860b" },
      { name: "Corporate Bonds", pct: 10, type: "debt",   color: "#0d9488" },
      { name: "Gold BEES ETF",   pct:  5, type: "gold",   color: "#d97706" },
      { name: "NIFTY Realty",    pct: 12, type: "sector", color: "#7c3aed" },
      { name: "NIFTY Smallcap",  pct: 20, type: "equity", color: "#ea580c" },
      { name: "NASDAQ-100 ETF",  pct: 18, type: "global", color: "#2563eb" },
    ],
  },
};

const QUESTIONS = [
  {
    id: "horizon", step: "02", tag: "Time Horizon",
    title: "How long can you stay invested?",
    desc: "Longer horizons allow greater equity exposure and compounding.",
    q: "What is your intended investment horizon?",
    options: [
      { val: "low",    label: "Short-term",   sub: "Below 2 years",  icon: "⏱" },
      { val: "medium", label: "Medium-term",  sub: "2 – 5 years",    icon: "📅" },
      { val: "high",   label: "Long-term",    sub: "5+ years",       icon: "🌱" },
    ],
  },
  {
    id: "income", step: "03", tag: "Income Stability",
    title: "Tell us about your income.",
    desc: "Stability determines your capacity to absorb market fluctuations.",
    q: "How stable is your monthly income?",
    options: [
      { val: "low",    label: "Variable",     sub: "Freelance / Business / Commission",  icon: "〰️" },
      { val: "medium", label: "Moderate",     sub: "Salaried with variable components",  icon: "📊" },
      { val: "high",   label: "Very Stable",  sub: "Fixed salary / Government / PSU",    icon: "🏛" },
    ],
  },
  {
    id: "wealth", step: "04", tag: "Wealth Allocation",
    title: "What share of your wealth is this?",
    desc: "A smaller portion of total wealth allows more aggressive positioning.",
    q: "This investment is what % of your total savings?",
    options: [
      { val: "high",   label: "Major Portion",  sub: "More than 60% of my savings",   icon: "🏦" },
      { val: "medium", label: "Significant",    sub: "30% – 60% of my savings",       icon: "💼" },
      { val: "low",    label: "Small Slice",    sub: "Less than 30% of my savings",   icon: "🔹" },
    ],
  },
  {
    id: "reaction", step: "05", tag: "Risk Behaviour",
    title: "How do you react to losses?",
    desc: "Your emotional response to downturns is one of the most critical signals.",
    q: "If your portfolio dropped 20% in one month, you would:",
    options: [
      { val: "low",    label: "Exit",            sub: "Sell immediately — protect capital", icon: "🚪" },
      { val: "medium", label: "Hold & Watch",    sub: "Uncomfortable but willing to wait",  icon: "👀" },
      { val: "high",   label: "Buy More",        sub: "Add to position — it's a discount",  icon: "📈" },
    ],
  },
  {
    id: "experience", step: "06", tag: "Experience",
    title: "Your investment experience.",
    desc: "Prior experience refines the sophistication of your strategy.",
    q: "How experienced are you with investing?",
    options: [
      { val: "low",    label: "Beginner",      sub: "FDs, savings accounts, LIC",            icon: "🌱" },
      { val: "medium", label: "Intermediate",  sub: "Mutual funds, 1–3 years in equity",      icon: "📚" },
      { val: "high",   label: "Advanced",      sub: "Stocks, ETFs, derivatives, bonds",       icon: "⚡" },
    ],
  },
  {
    id: "goal", step: "07", tag: "Investment Goal",
    title: "What are you investing for?",
    desc: "Your primary goal defines return profile and liquidity needs.",
    q: "What is your primary investment objective?",
    options: [
      { val: "low",    label: "Capital Safety",     sub: "Protect principal. Safety first.",        icon: "🛡" },
      { val: "medium", label: "Balanced Growth",    sub: "Steady compounding, moderate risk.",      icon: "⚖️" },
      { val: "high",   label: "Wealth Creation",    sub: "Maximum returns. Accept volatility.",     icon: "🚀" },
    ],
  },
  {
    id: "returns", step: "08", tag: "Return Expectation",
    title: "What returns do you expect?",
    desc: "Higher expectations come with higher risk. This sets your CAGR band.",
    q: "What annual return do you realistically expect?",
    options: [
      { val: "low",    label: "8 – 10% CAGR",   sub: "Conservative, inflation-beating",   icon: "🌿" },
      { val: "medium", label: "12 – 18% CAGR",  sub: "Market-level balanced growth",      icon: "📈" },
      { val: "high",   label: "19 – 25% CAGR",  sub: "Alpha returns, high equity tilt",   icon: "⚡" },
    ],
  },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function scoreVal(v) { return v === "low" ? 1 : v === "medium" ? 2 : 3; }

function computeProfile(answers) {
  const total = Object.values(answers).reduce((s, v) => s + scoreVal(v), 0);
  let profile = "Moderate";
  if (total <= 11) profile = "Conservative";
  else if (total >= 17) profile = "Aggressive";
  return { total, profile };
}

// All currency in INR
function fmtINR(n) {
  if (!n || isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// ─── DONUT CHART ───────────────────────────────────────────────────────────
function DonutChart({ assets, size = 180 }) {
  const [go, setGo] = useState(false);
  useEffect(() => { setTimeout(() => setGo(true), 200); }, []);
  const r = 65, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.cardDarker} strokeWidth={26} />
      {assets.map((a, i) => {
        const dash   = (a.pct / 100) * circ;
        const offset = circ - (cum / 100) * circ;
        cum += a.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.color} strokeWidth={26}
            strokeDasharray={`${go ? dash : 0} ${circ}`}
            strokeDashoffset={offset} strokeLinecap="butt"
            style={{ transition: `stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1) ${i * 0.08}s`,
              transform: "rotate(-90deg)", transformOrigin: "center" }} />
        );
      })}
      <text x={cx} y={cy - 7} textAnchor="middle" fill={T.textLight}
        fontSize="10" fontFamily="'Outfit',sans-serif" letterSpacing="1" fontWeight="500">AHAM</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill={T.textFaded}
        fontSize="9" fontFamily="'Outfit',sans-serif">Portfolio</text>
    </svg>
  );
}

// ─── ANIMATED COUNTER ──────────────────────────────────────────────────────
function Counter({ target, duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let s = null;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{fmtINR(val)}</>;
}

// ─── SCORE GAUGE ───────────────────────────────────────────────────────────
function Gauge({ score }) {
  const [go, setGo] = useState(false);
  useEffect(() => { setTimeout(() => setGo(true), 400); }, []);
  const pct   = ((score - 7) / 14) * 100;
  const color = score <= 11 ? T.teal : score >= 17 ? "#dc2626" : T.gold;
  return (
    <div>
      <div style={{ height: 10, background: T.cardDarker, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.teal}, ${color})`,
          width: go ? `${pct}%` : "0%", transition: "width 1.6s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10,
        color: T.textFaded, fontFamily: "'Outfit',sans-serif" }}>
        <span>Conservative</span><span>Moderate</span><span>Aggressive</span>
      </div>
    </div>
  );
}

// ─── ASSET BAR ─────────────────────────────────────────────────────────────
function AssetBar({ asset, delay, animate }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: asset.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.textLight, fontFamily: "'Outfit',sans-serif" }}>{asset.name}</span>
          <span style={{ fontSize: 10, color: T.textFaded, background: T.cardDarker,
            border: `1px solid ${T.borderDark}`, borderRadius: 4, padding: "1px 6px",
            fontFamily: "'Outfit',sans-serif", textTransform: "uppercase", letterSpacing: ".06em" }}>
            {asset.type}
          </span>
        </div>
        <span style={{ fontFamily: "'Outfit',monospace", fontSize: 14, color: asset.color, fontWeight: 600 }}>
          {asset.pct}%
        </span>
      </div>
      <div style={{ height: 5, background: T.cardDarker, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: asset.color,
          width: animate ? `${asset.pct}%` : "0%",
          transition: `width 1.2s cubic-bezier(.4,0,.2,1) ${delay}s` }} />
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]     = useState("intro");
  const [qIndex, setQIndex]   = useState(0);
  const [answers, setAnswers] = useState({});
  const [personal, setPersonal] = useState({ name:"", email:"", phone:"", investment:"", years:"" });
  const [errors, setErrors]   = useState({});
  const [result, setResult]   = useState(null);
  const [sending, setSending] = useState(false);
  const [barsGo, setBarsGo]   = useState(false);
  const [entered, setEntered] = useState(false);
  const topRef = useRef(null);

  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  const totalQ = QUESTIONS.length;
  const progressPct =
    phase === "intro"    ? 0 :
    phase === "dashboard"|| phase === "success" ? 100 :
    Math.round(((qIndex + 1) / totalQ) * 100);

  function top() { topRef.current?.scrollIntoView({ behavior: "smooth" }); }

  function validatePersonal() {
    const e = {};
    if (!personal.name.trim())                           e.name = "Required";
    if (!/\S+@\S+\.\S+/.test(personal.email))           e.email = "Enter valid email";
    if (!personal.phone.trim())                          e.phone = "Required";
    const inv = parseFloat(personal.investment);
    if (!inv || inv < 1000)                              e.investment = "Minimum ₹1,000";
    if (!personal.years || parseInt(personal.years) < 1) e.years = "Minimum 1 year";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function startQ() { if (!validatePersonal()) return; setPhase("questions"); setQIndex(0); top(); }

  function pick(val) {
    setAnswers(p => ({ ...p, [QUESTIONS[qIndex].id]: val }));
    setErrors({});
    // Auto-advance after short delay
    setTimeout(() => {
      if (qIndex < totalQ - 1) { setQIndex(i => i + 1); top(); }
      else buildResult({ ...answers, [QUESTIONS[qIndex].id]: val });
    }, 380);
  }

  function goBack() {
    setErrors({});
    if (qIndex === 0) setPhase("intro");
    else setQIndex(i => i - 1);
    top();
  }

  function buildResult(ans) {
    const { total, profile } = computeProfile(ans);
    const p       = PROFILES[profile];
    const invest  = parseFloat(personal.investment);
    const years   = parseInt(personal.years);
    const proj    = invest * Math.pow(1 + p.cagrMid, years);
    setResult({ total, profile, p, invest, years, proj, ans });
    setPhase("dashboard");
    setTimeout(() => setBarsGo(true), 700);
    top();
  }

  async function submitReport() {
    setSending(true);
    const { total, profile, p } = result;
    const payload = {
      name: personal.name, email: personal.email, phone: personal.phone,
      investment: personal.investment, targetYears: personal.years,
      ...result.ans,
      riskScore: total, riskProfile: profile,
      cagr: p.cagr, projection: fmtINR(result.proj),
      timestamp: new Date().toISOString(),
    };
    try {
      if (APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE") {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        console.log("📤 Demo mode:", payload);
        await new Promise(r => setTimeout(r, 1200));
      }
      setPhase("success"); top();
    } catch {
      setPhase("success"); top();
    }
  }

  // ── Is light phase ──
  const isLight = phase === "intro" || phase === "questions";

  // ── Root bg transitions between light and dark ──
  const rootBg = isLight
    ? "linear-gradient(160deg, #f7f3ee 0%, #ede8df 100%)"
    : "linear-gradient(160deg, #1a1f2e 0%, #141825 100%)";

  return (
    <div style={{ minHeight: "100vh", background: rootBg, transition: "background 0.7s ease",
      fontFamily: "'Outfit', sans-serif", overflowX: "hidden", position: "relative" }}>

      {/* Decorative pattern — light mode */}
      {isLight && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(184,134,11,.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px" }} />
      )}
      {/* Decorative pattern — dark mode */}
      {!isLight && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(rgba(184,134,11,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,134,11,.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px" }} />
      )}

      {/* Glow orbs */}
      <div style={{ position: "fixed", top: -120, right: -120, width: 400, height: 400,
        borderRadius: "50%", background: isLight ? "rgba(184,134,11,.08)" : "rgba(184,134,11,.06)",
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0, transition: "background 0.7s" }} />
      <div style={{ position: "fixed", bottom: -120, left: -120, width: 360, height: 360,
        borderRadius: "50%", background: isLight ? "rgba(13,148,136,.06)" : "rgba(13,148,136,.07)",
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

      <div ref={topRef} style={{ position: "relative", zIndex: 1, maxWidth: 720,
        margin: "0 auto", padding: "48px 20px 80px",
        opacity: entered ? 1 : 0, transform: entered ? "none" : "translateY(20px)",
        transition: "opacity .5s ease, transform .5s ease" }}>

        {/* ── HEADER ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10,
              background: isLight ? T.goldPale : "rgba(184,134,11,.15)",
              border: `1.5px solid ${T.gold}`,
              display: "grid", placeItems: "center",
              boxShadow: isLight ? "0 2px 8px rgba(184,134,11,.2)" : "none" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={T.gold} strokeWidth="1.7">
                <polyline points="2,14 7,8 11,11 18,4"/>
                <line x1="2" y1="18" x2="18" y2="18"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17,
                color: isLight ? T.textDark : T.gold, fontWeight: 600,
                letterSpacing: ".05em", transition: "color .5s" }}>
                AHAM
              </div>
              <div style={{ fontSize: 10, color: isLight ? T.textMid : T.textFaded,
                letterSpacing: ".12em", textTransform: "uppercase", marginTop: 1,
                transition: "color .5s" }}>
                Adaptive Hybrid Asset Allocation
              </div>
            </div>
          </div>

          {/* Mode indicator pill */}
          <div style={{ fontSize: 11, padding: "4px 12px", borderRadius: 99,
            background: isLight ? "rgba(184,134,11,.1)" : "rgba(184,134,11,.12)",
            border: `1px solid ${isLight ? "rgba(184,134,11,.25)" : "rgba(184,134,11,.2)"}`,
            color: T.gold, letterSpacing: ".08em", textTransform: "uppercase",
            fontFamily: "'Outfit', monospace" }}>
            SEBI-Compliant
          </div>
        </header>

        {/* ── PROGRESS ── */}
        {phase !== "intro" && phase !== "success" && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: isLight ? T.textMid : T.textFaded,
                textTransform: "uppercase", letterSpacing: ".08em" }}>
                {phase === "dashboard" ? "Profile Complete" : `Question ${qIndex + 1} of ${totalQ}`}
              </span>
              <span style={{ fontFamily: "'Outfit', monospace", fontSize: 12, color: T.gold }}>
                {progressPct}%
              </span>
            </div>
            <div style={{ height: 4, background: isLight ? T.borderLight : T.borderDark,
              borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99,
                background: `linear-gradient(90deg, ${T.gold}, ${T.teal})`,
                width: `${progressPct}%`, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
            </div>
          </div>
        )}

        {/* ══════════ INTRO / PERSONAL ══════════ */}
        {phase === "intro" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={tagStyle(true)}>01 · Identity</div>
            <h1 style={titleStyle(true)}>
              Discover your<br />
              <span style={{ color: T.gold }}>Investor Profile.</span>
            </h1>
            <p style={descStyle(true)}>
              A 3-minute SEBI-aligned questionnaire. You'll receive a personalised
              AHAM portfolio report with 6-asset allocation and projections in INR —
              straight to your inbox.
            </p>

            <div style={lightCard}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <InputField label="Full Name"           error={errors.name}
                  value={personal.name}     onChange={v => setPersonal(p=>({...p,name:v}))}
                  placeholder="Karthikeyan K." />
                <InputField label="Email Address"       error={errors.email} type="email"
                  value={personal.email}    onChange={v => setPersonal(p=>({...p,email:v}))}
                  placeholder="you@example.com" />
                <InputField label="Phone Number"        error={errors.phone} type="tel"
                  value={personal.phone}    onChange={v => setPersonal(p=>({...p,phone:v}))}
                  placeholder="+91 98765 43210" />
                <InputField label="Initial Investment (₹)" error={errors.investment} type="number"
                  value={personal.investment} onChange={v => setPersonal(p=>({...p,investment:v}))}
                  placeholder="₹5,00,000" />
              </div>
              <InputField label="Investment Target (Years)" error={errors.years} type="number"
                value={personal.years} onChange={v => setPersonal(p=>({...p,years:v}))}
                placeholder="10" style={{ maxWidth: 220 }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <GoldBtn onClick={startQ}>Begin Profiling →</GoldBtn>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
              {["SEBI-Compliant Framework", "Data stays private", "Report in your inbox"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: T.textMid }}>
                  <span style={{ color: T.teal }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ QUESTIONS ══════════ */}
        {phase === "questions" && (() => {
          const q = QUESTIONS[qIndex];
          const chosen = answers[q.id];
          return (
            <div key={qIndex} style={{ animation: "fadeUp .3s ease" }}>
              <div style={tagStyle(true)}>{q.step} · {q.tag}</div>
              <h1 style={titleStyle(true)}>{q.title}</h1>
              <p style={descStyle(true)}>{q.desc}</p>

              <div style={{ ...lightCard, marginBottom: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: T.textDark,
                  marginBottom: 20, lineHeight: 1.5 }}>
                  <span style={{ color: T.gold, fontFamily: "monospace",
                    fontSize: 12, marginRight: 8 }}>Q{qIndex+1}</span>
                  {q.q}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.options.map(opt => {
                    const sel = chosen === opt.val;
                    return (
                      <button key={opt.val} onClick={() => pick(opt.val)}
                        style={{ display: "flex", alignItems: "center", gap: 16,
                          background: sel ? T.goldPale : T.surface,
                          border: `1.5px solid ${sel ? T.gold : T.borderLight}`,
                          boxShadow: sel ? `0 0 0 3px rgba(184,134,11,.1)` : "0 1px 3px rgba(0,0,0,.06)",
                          borderRadius: 14, padding: "16px 20px", cursor: "pointer",
                          textAlign: "left", width: "100%",
                          transition: "all .18s ease",
                          transform: sel ? "translateX(4px)" : "none" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: sel ? "rgba(184,134,11,.15)" : T.surfaceAlt,
                          border: `1px solid ${sel ? T.gold : T.borderLight}`,
                          display: "grid", placeItems: "center", fontSize: 18 }}>
                          {opt.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600,
                            color: sel ? T.gold : T.textDark }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{opt.sub}</div>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${sel ? T.gold : T.borderLight}`,
                          background: sel ? T.gold : "transparent",
                          display: "grid", placeItems: "center", transition: "all .18s" }}>
                          {sel && <div style={{ width: 6, height: 6, borderRadius: "50%",
                            background: "#fff" }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errors.q && <div style={{ fontSize: 12, color: T.danger, marginTop: 10 }}>{errors.q}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <GhostBtn onClick={goBack}>← Back</GhostBtn>
                <div style={{ fontSize: 12, color: T.textMuted, alignSelf: "center" }}>
                  {totalQ - qIndex - 1} questions remaining
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════ DASHBOARD ══════════ */}
        {phase === "dashboard" && result && (() => {
          const { total, profile, p, invest, years, proj } = result;
          return (
            <div style={{ animation: "fadeUp .4s ease" }}>

              {/* Hero badge */}
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                  background: `${p.colorLight}`, border: `1px solid ${p.borderColor}`,
                  borderRadius: 99, padding: "6px 18px", marginBottom: 16,
                  fontSize: 11, color: p.color, letterSpacing: ".1em",
                  textTransform: "uppercase", fontFamily: "monospace" }}>
                  ✦ AHAM Profile Complete
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,6vw,42px)",
                  fontWeight: 700, color: T.textLight, marginBottom: 8, lineHeight: 1.2 }}>
                  Welcome, <span style={{ color: T.gold }}>{personal.name.split(" ")[0]}</span>
                </h1>
                <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 99,
                  background: `${p.color}22`, border: `1px solid ${p.color}55`,
                  color: p.color, fontSize: 14, fontWeight: 600, letterSpacing: ".06em" }}>
                  {profile} Investor — {p.tagline}
                </div>
              </div>

              {/* Donut + Score card */}
              <div style={{ ...darkCard, display: "flex", gap: 28,
                flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 12 }}>
                  <DonutChart assets={p.assets} size={180} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: T.textFaded,
                        textTransform: "uppercase", letterSpacing: ".08em" }}>Risk Score</span>
                      <span style={{ fontFamily: "monospace", color: p.color, fontSize: 13 }}>
                        {total} / 21
                      </span>
                    </div>
                    <Gauge score={total} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "Target CAGR",  v: p.cagr },
                      { l: "Volatility",   v: p.volatility },
                      { l: "Horizon",      v: `${years} Years` },
                      { l: "Initial",      v: fmtINR(invest) },
                    ].map(m => (
                      <div key={m.l} style={{ background: T.cardDarker,
                        border: `1px solid ${T.borderDark}`,
                        borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 15,
                          color: T.gold, fontWeight: 500 }}>{m.v}</div>
                        <div style={{ fontSize: 10, color: T.textFaded, marginTop: 3,
                          textTransform: "uppercase", letterSpacing: ".06em" }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projection card */}
              <div style={{ ...darkCard, marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textFaded, textTransform: "uppercase",
                  letterSpacing: ".1em", marginBottom: 8, fontFamily: "monospace" }}>
                  {years}-Year Projection (INR) — Monte Carlo Median
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42,
                  color: T.gold, fontWeight: 700, marginBottom: 4 }}>
                  <Counter target={proj} />
                </div>
                <div style={{ fontSize: 13, color: T.textFaded, marginBottom: 20 }}>
                  On initial investment of {fmtINR(invest)} · {p.cagr} CAGR
                </div>
                <div style={{ display: "flex", justifyContent: "center",
                  gap: 0, borderRadius: 12, overflow: "hidden",
                  border: `1px solid ${T.borderDark}` }}>
                  {[
                    { l: "Worst Case (5th %ile)",  v: fmtINR(proj * 0.62), c: "#dc2626" },
                    { l: "Median Outcome",          v: fmtINR(proj),        c: T.gold    },
                    { l: "Best Case (95th %ile)",   v: fmtINR(proj * 1.45), c: T.teal   },
                  ].map((s, i) => (
                    <div key={s.l} style={{ flex: 1, padding: "16px 12px", textAlign: "center",
                      background: T.cardDarker,
                      borderRight: i < 2 ? `1px solid ${T.borderDark}` : "none" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 14,
                        color: s.c, fontWeight: 600 }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: T.textFaded, marginTop: 4 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6-Asset breakdown */}
              <div style={{ ...darkCard, marginBottom: 16 }}>
                <div style={{ ...tagStyle(false), marginBottom: 20 }}>
                  AHAM · 6-Asset Allocation
                </div>
                {p.assets.map((a, i) => (
                  <AssetBar key={a.name} asset={a} delay={i * 0.08} animate={barsGo} />
                ))}
                {/* Legend */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16,
                  paddingTop: 16, borderTop: `1px solid ${T.borderDark}` }}>
                  {[
                    { type: "equity", label: "Domestic Equity",  color: "#b8860b" },
                    { type: "debt",   label: "Fixed Income",      color: "#0d9488" },
                    { type: "gold",   label: "Gold Hedge",        color: "#d97706" },
                    { type: "sector", label: "Sectoral",          color: "#7c3aed" },
                    { type: "global", label: "Global Equity",     color: "#2563eb" },
                  ].map(l => (
                    <div key={l.type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: 11, color: T.textFaded }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ ...darkCard, marginBottom: 8 }}>
                <div style={{ background: "rgba(184,134,11,.07)",
                  border: "1px solid rgba(184,134,11,.15)",
                  borderRadius: 10, padding: "16px 20px",
                  fontSize: 13, color: T.textFaded, lineHeight: 1.8, marginBottom: 20 }}>
                  <strong style={{ color: T.textLight }}>What happens next?</strong> Your complete
                  AHAM portfolio report — 6-asset breakdown, Monte Carlo projections in INR,
                  and SEBI-compliant suitability summary — will be sent to{" "}
                  <strong style={{ color: T.gold }}>{personal.email}</strong> within minutes.
                </div>
                <button onClick={submitReport} disabled={sending}
                  style={{ width: "100%",
                    background: sending ? T.borderDark : `linear-gradient(135deg, ${T.gold}, #8a6200)`,
                    border: "none", color: sending ? T.textFaded : "#1a1000",
                    padding: "15px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif", cursor: sending ? "not-allowed" : "pointer",
                    letterSpacing: ".04em", transition: "all .2s" }}>
                  {sending ? "Sending your report…" : "Send My Full Report →"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══════════ SUCCESS ══════════ */}
        {phase === "success" && (
          <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeUp .4s ease" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              background: "rgba(13,148,136,.12)", border: `2px solid ${T.teal}`,
              display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none"
                stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6,17 13,24 26,10"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34,
              fontWeight: 700, color: T.textLight, marginBottom: 12 }}>
              Report Dispatched!
            </h2>
            <p style={{ color: T.textFaded, fontSize: 15, maxWidth: 400,
              margin: "0 auto", lineHeight: 1.8 }}>
              Your personalised AHAM portfolio report is on its way to{" "}
              <strong style={{ color: T.gold }}>{personal.email}</strong>.
              Check your inbox — and spam folder just in case.
            </p>
            <div style={{ marginTop: 40, paddingTop: 28,
              borderTop: `1px solid ${T.borderDark}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16, color: T.gold, marginBottom: 4 }}>Karthikeyan K.</div>
              <div style={{ fontSize: 12, color: T.textFaded }}>
                Financial Systems & Business Automation
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 48,
          fontSize: 11, color: isLight ? T.textMuted : T.textFaded,
          letterSpacing: ".04em", transition: "color .5s" }}>
          SEBI-Compliant Framework &nbsp;·&nbsp;
          <span style={{ color: T.gold }}>Karthikeyan K.</span> &nbsp;·&nbsp;
          Financial Systems & Business Automation &nbsp;·&nbsp;
          <span style={{ color: T.gold }}>AHAM v2.0</span>
        </footer>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
        button:focus { outline: none; }
        input:focus  { outline: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::placeholder { color: #b0a898; }
      `}</style>
    </div>
  );
}

// ─── SUB COMPONENTS ────────────────────────────────────────────────────────
function InputField({ label, error, value, onChange, type = "text", placeholder, style: sx }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 4, ...sx }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600,
        color: T.textMid, letterSpacing: ".08em",
        textTransform: "uppercase", marginBottom: 7 }}>
        {label}
      </label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", background: T.surface,
          border: `1.5px solid ${error ? T.danger : focused ? T.gold : T.borderLight}`,
          boxShadow: focused ? `0 0 0 3px rgba(184,134,11,.1)` : "0 1px 3px rgba(0,0,0,.05)",
          borderRadius: 10, padding: "13px 16px",
          color: T.textDark, fontSize: 14,
          fontFamily: "'Outfit', sans-serif",
          transition: "border .2s, box-shadow .2s" }} />
      {error && <div style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function GoldBtn({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: `linear-gradient(135deg, ${T.gold}, #8a6200)`,
        border: "none", color: "#fff8e8",
        padding: "14px 32px", borderRadius: 10,
        fontSize: 14, fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
        cursor: "pointer", letterSpacing: ".04em",
        boxShadow: hov ? `0 6px 20px rgba(184,134,11,.35)` : `0 2px 8px rgba(184,134,11,.2)`,
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all .2s" }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ background: "transparent",
        border: `1px solid ${T.borderLight}`,
        color: T.textMid, padding: "12px 22px",
        borderRadius: 10, fontSize: 13,
        fontFamily: "'Outfit', sans-serif",
        cursor: "pointer" }}>
      {children}
    </button>
  );
}

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────
const lightCard = {
  background: T.surface,
  border: `1px solid ${T.borderLight}`,
  borderRadius: 16,
  padding: "28px 32px",
  marginBottom: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,.06)",
};

const darkCard = {
  background: T.cardDark,
  border: `1px solid ${T.borderDark}`,
  borderRadius: 16,
  padding: "28px 32px",
  boxShadow: "0 4px 24px rgba(0,0,0,.2)",
  position: "relative",
};

function tagStyle(light) {
  return {
    fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase",
    color: T.gold, marginBottom: 8, fontFamily: "monospace",
  };
}

function titleStyle(light) {
  return {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(26px,5vw,38px)",
    fontWeight: 700, lineHeight: 1.2, marginBottom: 12,
    color: light ? T.textDark : T.textLight,
  };
}

function descStyle(light) {
  return {
    fontSize: 15, color: light ? T.textMid : T.textFaded,
    lineHeight: 1.75, marginBottom: 32, maxWidth: 520,
  };
}
