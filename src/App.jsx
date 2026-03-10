import { useState, useEffect, useRef, useCallback } from "react";

const DURATIONS = [
  { label: "30s", seconds: 30, desc: "Quick & punchy" },
  { label: "1 min", seconds: 60, desc: "Focused thought" },
  { label: "3 min", seconds: 180, desc: "Deep dive" },
  { label: "5 min", seconds: 300, desc: "Full speech" },
];

const THEME_COLORS = [
  { name: "Coral", accent: "#E05A5A" },
  { name: "Amber", accent: "#E88C2A" },
  { name: "Emerald", accent: "#3AAB6D" },
  { name: "Ocean", accent: "#4A7FD4" },
  { name: "Violet", accent: "#8B6BBE" },
  { name: "Rose", accent: "#D4609A" },
];

const SOUNDS = {
  tick: (ctx) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 800; g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    o.start(); o.stop(ctx.currentTime + 0.05);
  },
  wheelTick: (ctx, pitch = 1) => {
    // Soft wooden click sound
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800 * pitch;
    filter.Q.value = 2;
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    src.start(); src.stop(ctx.currentTime + 0.04);
  },
  start: (ctx) => {
    [440, 550, 660].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
      o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
  },
  done: (ctx) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  },
};

// ── Spin Wheel ──────────────────────────────────────────────────────────────
function SpinWheel({ spinning, onSpinEnd, accent, onWheelTick, size = 230 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);
  const velRef = useRef(0);

  const segColors = [
    "#f0f4ff","#e8f8f0","#fff8ee","#f5f0fb","#fef0f0","#eef4ff",
    "#f0fff4","#fffbee","#f0f0ff","#fff0f5","#eefff8","#fff5f0",
  ];

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
    const segs = 12, segA = (2 * Math.PI) / segs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer shadow ring
    const glow = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 14);
    glow.addColorStop(0, "rgba(0,0,0,0.1)"); glow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(cx, cy, r + 12, 0, 2 * Math.PI);
    ctx.fillStyle = glow; ctx.fill();

    for (let i = 0; i < segs; i++) {
      const s = angle + i * segA, e = s + segA;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e); ctx.closePath();
      ctx.fillStyle = segColors[i % segColors.length]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();

      // Dot accent
      const mid = s + segA / 2;
      ctx.beginPath(); ctx.arc(cx + r * 0.72 * Math.cos(mid), cy + r * 0.72 * Math.sin(mid), 4, 0, 2 * Math.PI);
      ctx.fillStyle = `${accent}55`; ctx.fill();
    }

    // Outer ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 3; ctx.stroke();

    // Center hub
    const hub = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 30);
    hub.addColorStop(0, "#ffffff"); hub.addColorStop(1, "#e8e8e8");
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = hub; ctx.fill();
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font = "bold 10px 'DM Sans', sans-serif";
    ctx.fillStyle = "#777"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SPIN", cx, cy);
  }, [accent]);

  useEffect(() => { draw(0); }, [draw]);

  useEffect(() => {
    if (!spinning) return;
    velRef.current = 0.28 + Math.random() * 0.18;
    let lastAngle = angleRef.current;
    const segA = (2 * Math.PI) / 12;
    const animate = () => {
      velRef.current *= 0.984;
      angleRef.current += velRef.current;
      draw(angleRef.current);
      // Fire tick when crossing a segment boundary
      const prevSeg = Math.floor(lastAngle / segA);
      const curSeg = Math.floor(angleRef.current / segA);
      if (curSeg !== prevSeg && onWheelTick) {
        // Pitch rises slightly as wheel slows (faster = lower pitch)
        const pitch = Math.max(0.6, Math.min(2.0, 0.06 / velRef.current));
        onWheelTick(pitch);
      }
      lastAngle = angleRef.current;
      if (velRef.current > 0.003) animRef.current = requestAnimationFrame(animate);
      else onSpinEnd();
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, draw, onSpinEnd, onWheelTick]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: "50%", display: "block" }} />
      <div style={{
        position: "absolute", top: "50%", right: -20, transform: "translateY(-50%)",
        width: 0, height: 0,
        borderTop: "13px solid transparent", borderBottom: "13px solid transparent",
        borderRight: `24px solid ${accent}`,
        filter: `drop-shadow(0 2px 6px ${accent}88)`,
      }} />
    </div>
  );
}

// ── Circular Timer ──────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, color }) {
  const r = 54, circ = 2 * Math.PI * r;
  const dash = circ * (seconds / total);
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  const display = total >= 60 ? `${mins}:${String(secs).padStart(2, "0")}` : `${seconds}s`;
  return (
    <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f0f0f0" strokeWidth="7" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Mono', monospace", letterSpacing: "-1px" }}>{display}</span>
      </div>
    </div>
  );
}

// ── Settings Panel ──────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose, ideationMins, setIdeationMins, soundOn, setSoundOn, themeIdx, setThemeIdx }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>Settings</h3>
          <button onClick={onClose} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#555" }}>✕</button>
        </div>

        {/* Ideation time */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 10 }}>Ideation Time</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[0.5, 1, 2, 3].map(m => (
              <button key={m} onClick={() => setIdeationMins(m)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 12, border: ideationMins === m ? `2px solid ${THEME_COLORS[themeIdx].accent}` : "2px solid #ececec",
                background: ideationMins === m ? THEME_COLORS[themeIdx].accent + "12" : "#fafafa",
                fontSize: 13, fontWeight: 700, color: ideationMins === m ? THEME_COLORS[themeIdx].accent : "#888", cursor: "pointer",
              }}>{m === 0.5 ? "30s" : `${m}m`}</button>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>Sound Effects</div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 2 }}>Ticks, alerts & completion chime</div>
          </div>
          <div onClick={() => setSoundOn(s => !s)} style={{
            width: 46, height: 26, borderRadius: 13, background: soundOn ? THEME_COLORS[themeIdx].accent : "#ddd",
            cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ position: "absolute", top: 3, left: soundOn ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        {/* Theme color */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 10 }}>Theme Color</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {THEME_COLORS.map((t, i) => (
              <div key={i} onClick={() => setThemeIdx(i)} style={{
                width: 32, height: 32, borderRadius: "50%", background: t.accent, cursor: "pointer",
                border: themeIdx === i ? `3px solid #1a1a1a` : "3px solid transparent",
                boxShadow: themeIdx === i ? `0 0 0 2px #fff, 0 0 0 4px ${t.accent}` : "none",
                transition: "all 0.15s",
              }} title={t.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);
  const [phase, setPhase] = useState("home");
  const [spinning, setSpinning] = useState(false);
  const [topic, setTopic] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [ideationTime, setIdeationTime] = useState(60);
  const [ideationStarted, setIdeationStarted] = useState(false);
  const [speakTime, setSpeakTime] = useState(0);

  // Streak state — loaded from persistent storage
  const [streakDays, setStreakDays] = useState(0);       // days in a row
  const [practicedToday, setPracticedToday] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const [quote, setQuote] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ideationMins, setIdeationMins] = useState(1);
  const [soundOn, setSoundOn] = useState(true);
  const [themeIdx, setThemeIdx] = useState(2);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const accent = THEME_COLORS[themeIdx].accent;

  const todayStr = () => new Date().toISOString().slice(0, 10); // "2026-03-10"

  // ── Load streak from storage on mount ──
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("speakspin-streak");
        if (raw) {
          const data = JSON.parse(raw);
          const today = todayStr();
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);
          if (data.lastDate === today) {
            setStreakDays(data.days);
            setPracticedToday(true);
          } else if (data.lastDate === yesterdayStr) {
            setStreakDays(data.days);
          } else {
            setStreakDays(0);
          }
        }
      } catch {}
      setStorageReady(true);
    };
    load();
  }, []);

  // ── Save streak to storage ──
  const saveStreak = (days, dateStr) => {
    try {
      localStorage.setItem("speakspin-streak", JSON.stringify({ days, lastDate: dateStr }));
    } catch {}
  };

  const playSound = useCallback((type, pitch = 1) => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      if (type === "wheelTick") SOUNDS.wheelTick(ctx, pitch);
      else SOUNDS[type]?.(ctx);
    } catch {}
  }, [soundOn]);

  const fetchTopic = async (duration) => {
    setLoadingTopic(true);
    try {
      const res = await fetch("https://speakspin-proxy.shawnbiju1.workers.dev", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Generate a single speaking practice topic for a ${duration.label} impromptu speech. Return ONLY JSON: {"topic": "...", "hint": "..."}. topic: max 8 words, punchy. hint: one short sentence approach tip. No markdown.` }]
        })
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return parsed.topic + (parsed.hint ? `\n${parsed.hint}` : "");
    } catch { return "What makes a great leader?\nThink of someone you admire and why."; }
    finally { setLoadingTopic(false); }
  };

  const fetchQuote = async (data) => {
    setLoadingQuote(true);
    try {
      const res = await fetch("https://speakspin-proxy.shawnbiju1.workers.dev", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 80,
          messages: [{ role: "user", content: `Someone just finished a ${data.duration} speaking session on the topic "${data.topic}". They are on a ${data.streak}-day streak. Write a single short phrase or sentence (max 12 words) for their completion screen. Mix it up — sometimes it's a punchy motivational line about consistency or effort, sometimes it's a light witty joke related to public speaking or their topic. Keep it fresh and unexpected. No exclamation marks. No quotes around it. Just the phrase.` }]
        })
      });
      const d = await res.json();
      return d.content.map(i => i.text || "").join("").trim().replace(/^["']|["']$/g, "");
    } catch { return "Showing up is the whole game"; }
    finally { setLoadingQuote(false); }
  };

  const handleWheelTick = useCallback((pitch) => {
    playSound("wheelTick", pitch);
  }, [playSound]);

  const handleSpin = async () => {
    if (spinning || loadingTopic) return;
    playSound("start");
    setSpinning(true);
    setPhase("spinning");
    const t = await fetchTopic(selectedDuration);
    setTopic(t);
  };

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setPhase("ideation");
    setIdeationTime(Math.round(ideationMins * 60));
    setIdeationStarted(false);
  }, [ideationMins]);

  const startIdeation = () => {
    setIdeationStarted(true);
    playSound("start");
    clearInterval(timerRef.current);
    const total = Math.round(ideationMins * 60);
    setIdeationTime(total);
    timerRef.current = setInterval(() => {
      setIdeationTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); startSpeaking(); return 0; }
        if (t <= 6) playSound("tick");
        return t - 1;
      });
    }, 1000);
  };

  const startSpeaking = () => {
    setPhase("speaking");
    playSound("start");
    setSpeakTime(selectedDuration.seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSpeakTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); finishSession(); return 0; }
        if (t <= 4) playSound("tick");
        return t - 1;
      });
    }, 1000);
  };

  const finishSession = async () => {
    const today = todayStr();
    let newDays = streakDays;
    if (!practicedToday) {
      newDays = streakDays + 1;
      setStreakDays(newDays);
      setPracticedToday(true);
      saveStreak(newDays, today);
    }
    const topicLine = topic.split("\n")[0];
    setPhase("done");
    playSound("done");
    const q = await fetchQuote({ streak: newDays, topic: topicLine, duration: selectedDuration.label });
    setQuote(q);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const isMobile = window.innerWidth < 480;
  const wheelSize = Math.min(window.innerWidth - 100, 230);

  // ── Styles ──
  const base = {
    fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
    minHeight: "100vh", minHeight: "100dvh",
    background: "#f5f5f0",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: isMobile ? 16 : 24,
  };
  const card = {
    background: "#fff", borderRadius: 24,
    boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
    padding: isMobile ? "24px 18px" : "32px 28px",
    maxWidth: 420, width: "100%", textAlign: "center",
  };
  const primaryBtn = (full) => ({
    background: accent, color: "#fff", border: "none", borderRadius: 14,
    padding: isMobile ? "16px 24px" : "14px 24px",
    fontSize: isMobile ? 16 : 15, fontWeight: 700, cursor: "pointer",
    width: full ? "100%" : "auto", letterSpacing: "0.2px",
    WebkitTapHighlightColor: "transparent",
  });
  const ghostBtn = {
    background: "transparent", color: "#888", border: "1.5px solid #e0e0e0",
    borderRadius: 14, padding: isMobile ? "15px 24px" : "13px 24px",
    fontSize: isMobile ? 15 : 14, fontWeight: 600, cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
  const pill = (color) => ({
    display: "inline-block", background: color + "18", color,
    borderRadius: 8, padding: "4px 12px", fontSize: 11,
    fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14,
  });

  const topicLine = topic.split("\n")[0];
  const topicHint = topic.split("\n")[1];

  // ── DONE ──
  if (phase === "done") return (
    <div style={{ ...base, background: "linear-gradient(160deg, #fffbf0 0%, #fff7e0 50%, #fef3d0 100%)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Mono&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      <style>{`@keyframes popIn { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} } @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center", padding: isMobile ? "0 4px" : 0 }}>
        <div style={{ fontSize: isMobile ? 60 : 72, marginBottom: 8, animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>🏆</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "linear-gradient(135deg, #F5A623, #E8831A)",
          borderRadius: 20, padding: "12px 28px", marginBottom: 14,
          boxShadow: "0 4px 20px rgba(232,131,26,0.35)",
          animation: "fadeUp 0.4s 0.2s both",
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>{streakDays}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Day{streakDays !== 1 ? "s" : ""} streak</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>🔥 keep it up</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#C8841A", fontWeight: 600, marginBottom: 14, animation: "fadeUp 0.4s 0.28s both" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div style={{
          background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "14px 20px",
          marginBottom: 16, border: "1px solid rgba(245,166,35,0.2)",
          animation: "fadeUp 0.4s 0.35s both",
        }}>
          <div style={{ fontSize: 10, color: "#C8841A", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>You spoke on · {selectedDuration.label}</div>
          <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#3a2a0a", lineHeight: 1.4 }}>{topicLine}</div>
        </div>
        <div style={{ animation: "fadeUp 0.4s 0.5s both", minHeight: 32, marginBottom: 24 }}>
          {loadingQuote
            ? <div style={{ fontSize: 13, color: "#C8841A", opacity: 0.6 }}>…</div>
            : <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "#7A4F0A", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{quote}"</p>
          }
        </div>
        <button style={{
          background: "linear-gradient(135deg, #F5A623, #E8831A)", color: "#fff",
          border: "none", borderRadius: 14, padding: "16px 0", fontSize: isMobile ? 16 : 15,
          fontWeight: 700, cursor: "pointer", width: "100%",
          boxShadow: "0 4px 16px rgba(232,131,26,0.3)",
          animation: "fadeUp 0.4s 0.6s both",
          WebkitTapHighlightColor: "transparent",
        }} onClick={() => { setPhase("home"); setTopic(""); }}>
          Practice Again →
        </button>
      </div>
    </div>
  );

  // ── SPEAKING ──
  if (phase === "speaking") return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <div style={card}>
        <div style={pill(accent)}>SPEAKING · {selectedDuration.label}</div>
        <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 20px", lineHeight: 1.4 }}>{topicLine}</h2>
        <CircularTimer seconds={speakTime} total={selectedDuration.seconds} color={accent} />
        <p style={{ fontSize: 13, color: "#bbb", margin: "12px 0 20px" }}>Speak clearly and confidently</p>
        <button style={primaryBtn(true)} onClick={() => { clearInterval(timerRef.current); finishSession(); }}>Finish Early</button>
      </div>
    </div>
  );

  // ── IDEATION ──
  if (phase === "ideation") return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <div style={card}>
        <div style={pill(accent)}>YOUR TOPIC</div>
        <h2 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 6px", lineHeight: 1.4 }}>{topicLine}</h2>
        {topicHint && <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px", lineHeight: 1.5 }}>{topicHint}</p>}
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: "#bbb", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            {ideationStarted ? "Prep time left" : `${ideationMins === 0.5 ? "30s" : `${ideationMins} min`} to prepare`}
          </p>
          <CircularTimer seconds={ideationTime} total={Math.round(ideationMins * 60)} color={accent} />
        </div>
        {!ideationStarted
          ? <button style={{ ...primaryBtn(true), marginTop: 20 }} onClick={startIdeation}>Start Ideating →</button>
          : ideationTime === 0
            ? <button style={{ ...primaryBtn(true), marginTop: 20 }} onClick={startSpeaking}>Start Speaking →</button>
            : <button style={{ ...ghostBtn, width: "100%", marginTop: 20 }} onClick={() => { clearInterval(timerRef.current); startSpeaking(); }}>Skip → Start Speaking</button>
        }
      </div>
    </div>
  );

  // ── HOME / SPINNING ──
  return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}
        ideationMins={ideationMins} setIdeationMins={setIdeationMins}
        soundOn={soundOn} setSoundOn={setSoundOn}
        themeIdx={themeIdx} setThemeIdx={setThemeIdx} />

      <div style={{ ...card, paddingTop: 24 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ textAlign: "left" }}>
            {streakDays > 0 && <div style={{ fontSize: 12, color: accent, fontWeight: 700 }}>🔥 {streakDays} day{streakDays !== 1 ? "s" : ""} streak{practicedToday ? " · ✓ today" : ""}</div>}
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1a1a1a", margin: "2px 0 0", letterSpacing: "-0.5px" }}>🎙️ Practice Public Speaking</h1>
            <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>Spin. Prepare. Speak.</p>
          </div>
          <button onClick={() => setSettingsOpen(true)} style={{
            background: "#f5f5f5", border: "none", borderRadius: 12, width: 40, height: 40,
            cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 8, WebkitTapHighlightColor: "transparent",
          }}>⚙️</button>
        </div>

        {/* Duration selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 24 }}>
          {DURATIONS.map(d => (
            <button key={d.label} onClick={() => setSelectedDuration(d)} style={{
              border: selectedDuration.label === d.label ? `2.5px solid ${accent}` : "2px solid #ececec",
              background: selectedDuration.label === d.label ? accent + "12" : "#fafafa",
              borderRadius: 12, padding: isMobile ? "10px 2px" : "10px 4px", cursor: "pointer", transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: selectedDuration.label === d.label ? accent : "#555" }}>{d.label}</div>
              <div style={{ fontSize: 9, color: "#ccc", marginTop: 2 }}>{d.desc}</div>
            </button>
          ))}
        </div>

        {/* Spin wheel */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative" }}>
          {loadingTopic && (
            <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.8)", borderRadius: "50%" }}>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>Loading…</span>
            </div>
          )}
          <SpinWheel spinning={spinning} onSpinEnd={handleSpinEnd} accent={accent} onWheelTick={handleWheelTick} size={wheelSize} />
        </div>

        <button style={{ ...primaryBtn(true), opacity: spinning ? 0.6 : 1 }} onClick={handleSpin} disabled={spinning || loadingTopic}>
          {spinning ? "Spinning…" : "Find Topic →"}
        </button>
      </div>
    </div>
  );
}