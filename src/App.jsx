
import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWhLM0SmF1Gi2E98d7zZCVmcNNhzHst_0",
  authDomain: "public-speaking-practice-app.firebaseapp.com",
  projectId: "public-speaking-practice-app",
  storageBucket: "public-speaking-practice-app.firebasestorage.app",
  messagingSenderId: "78755181434",
  appId: "1:78755181434:web:2785da659a286e5a46dcc3"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


const DURATIONS = [
  { label: "1 min", seconds: 60, desc: "Focused thought" },
  { label: "2 min", seconds: 120, desc: "Steady pace" },
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

// ── 180 Backup Topics (never shown as AI-generated) ──────────────────────────
const BACKUP_TOPICS = [
  { topic: "The best advice you ever ignored", hint: "Start with the moment you dismissed it." },
  { topic: "Why mornings set the tone for everything", hint: "Think about your own morning habits." },
  { topic: "A skill everyone should learn by 25", hint: "Pick one and argue passionately for it." },
  { topic: "The most overrated social media platform", hint: "Back your claim with real examples." },
  { topic: "Why boredom is actually good for you", hint: "Connect it to creativity and rest." },
  { topic: "What animals can teach us about leadership", hint: "Pick a specific animal and draw parallels." },
  { topic: "The problem with always being busy", hint: "Challenge the idea that busyness equals success." },
  { topic: "Why your hometown shaped who you are", hint: "Find one specific memory that proves it." },
  { topic: "The most important meal of the day isn't breakfast", hint: "Make a case for dinner or lunch instead." },
  { topic: "What video games taught me about strategy", hint: "Draw real life lessons from game mechanics." },
  { topic: "The lie we tell ourselves about multitasking", hint: "Use science or personal experience to back it up." },
  { topic: "Why handwritten notes beat digital ones", hint: "Talk about memory, connection, and attention." },
  { topic: "The forgotten art of doing nothing", hint: "Defend stillness in a world obsessed with productivity." },
  { topic: "What silence teaches you about yourself", hint: "Explore discomfort and self-awareness." },
  { topic: "Why failure should be on your resume", hint: "Reframe failure as a credential worth having." },
  { topic: "The best book you never finished", hint: "Explain what stopped you and what it still taught you." },
  { topic: "Why walking is underrated as a superpower", hint: "Connect walking to thinking and creativity." },
  { topic: "The thing nobody tells you about growing up", hint: "Pick one honest truth about adulthood." },
  { topic: "How music changes the way you think", hint: "Use a specific song or genre as your anchor." },
  { topic: "Why we should bring back letter writing", hint: "Talk about patience, intention, and connection." },
  { topic: "The hidden cost of convenience", hint: "Explore what we lose when things become too easy." },
  { topic: "Why sport is the best classroom", hint: "Pick a lesson sport taught you that school never did." },
  { topic: "What your playlist says about you", hint: "Use music taste as a window into personality." },
  { topic: "The power of saying no", hint: "Focus on what opens up when you stop saying yes to everything." },
  { topic: "Why sleep is the ultimate performance drug", hint: "Connect rest to decision making and energy." },
  { topic: "The most important room in any home", hint: "Argue for kitchen, bedroom, or an unexpected choice." },
  { topic: "What cooking teaches you about patience", hint: "Draw parallels between recipes and real life." },
  { topic: "Why comedy is a serious art form", hint: "Defend stand-up or satire as meaningful expression." },
  { topic: "The underrated power of asking questions", hint: "Show how curiosity changes conversations." },
  { topic: "Why every city needs more green spaces", hint: "Connect nature in cities to mental health." },
  { topic: "What travel taught me that school never could", hint: "Focus on one specific lesson from one specific trip." },
  { topic: "The problem with chasing happiness", hint: "Argue for meaning or contentment instead." },
  { topic: "Why libraries are the most democratic places on earth", hint: "Talk about access, knowledge, and community." },
  { topic: "What your commute says about city planning", hint: "Use your own experience as a case study." },
  { topic: "The surprising lesson I learned from a stranger", hint: "Make it personal and specific." },
  { topic: "Why tea is better than coffee", hint: "Have fun with this — pick a side and own it." },
  { topic: "The one habit that changed everything for me", hint: "Be specific and honest about the impact." },
  { topic: "Why we should talk to our neighbours more", hint: "Connect community to wellbeing and safety." },
  { topic: "What my biggest mistake taught me", hint: "Own it fully before explaining the lesson." },
  { topic: "The case for a four-day work week", hint: "Focus on productivity, not just rest." },
  { topic: "Why being ordinary is extraordinary", hint: "Push back on hustle culture and celebrate the everyday." },
  { topic: "What children understand that adults have forgotten", hint: "Pick one specific thing — wonder, honesty, play." },
  { topic: "The problem with expert opinions", hint: "Explore when to trust experts and when to question them." },
  { topic: "Why reading fiction makes you a better person", hint: "Connect storytelling to empathy." },
  { topic: "The one city everyone should visit once", hint: "Pick somewhere unexpected and make a real case for it." },
  { topic: "What a rainy day teaches you about slowing down", hint: "Use weather as a metaphor for perspective." },
  { topic: "Why the best conversations happen after midnight", hint: "Explore vulnerability, honesty, and late night energy." },
  { topic: "The thing I wish I had started earlier", hint: "Be specific — a skill, habit, or relationship." },
  { topic: "Why nostalgia is both beautiful and dangerous", hint: "Acknowledge its comfort and its distortion." },
  { topic: "What mountains teach you about perspective", hint: "Use the physical climb as a metaphor." },
  { topic: "The underrated genius of simple ideas", hint: "Find a simple concept and show its hidden depth." },
  { topic: "Why gratitude is a practice not a feeling", hint: "Focus on the daily work of noticing good things." },
  { topic: "What your favorite food reveals about your culture", hint: "Pick one dish and trace its story." },
  { topic: "The most important conversation you haven't had yet", hint: "Make the audience think about their own unfinished talks." },
  { topic: "Why deadlines make you more creative", hint: "Argue that constraints unlock better thinking." },
  { topic: "The art of apologising well", hint: "Break down what makes an apology actually land." },
  { topic: "What the ocean teaches us about humility", hint: "Use scale and depth as your metaphors." },
  { topic: "Why we should celebrate small wins more", hint: "Connect micro-celebrations to motivation and momentum." },
  { topic: "The problem with trying to be perfect", hint: "Show how perfectionism kills progress." },
  { topic: "What dogs understand about unconditional love", hint: "Use pet behaviour as a lens on human relationships." },
  { topic: "Why the best ideas come in the shower", hint: "Explore diffuse thinking and mental rest." },
  { topic: "The moment I realised I was wrong about something big", hint: "Be vulnerable and specific." },
  { topic: "Why kindness is a strength not a weakness", hint: "Push back on the idea that nice people finish last." },
  { topic: "What a blank page teaches you about fear", hint: "Connect the act of starting to overcoming resistance." },
  { topic: "The case for keeping a journal", hint: "Focus on clarity, memory, and self-understanding." },
  { topic: "Why the best teachers never stop learning", hint: "Argue that curiosity is the core of great teaching." },
  { topic: "What your relationship with money says about you", hint: "Be honest and personal." },
  { topic: "The hidden value of being an outsider", hint: "Show how not fitting in gives you a unique perspective." },
  { topic: "Why we remember smells better than faces", hint: "Explore the science and emotion of scent memory." },
  { topic: "The most underrated form of exercise", hint: "Pick something unexpected — dancing, gardening, swimming." },
  { topic: "What a good mentor looks like", hint: "Describe qualities, not just actions." },
  { topic: "Why cities should be designed for pedestrians", hint: "Connect walkability to community and health." },
  { topic: "The one thing I'd tell my younger self", hint: "Keep it specific — one piece of advice, not a list." },
  { topic: "What laughter reveals about a person", hint: "Use humour as a window into values and character." },
  { topic: "Why being a beginner again is liberating", hint: "Connect beginner's mind to growth and humility." },
  { topic: "The most powerful word in any language", hint: "Pick one word and defend your choice." },
  { topic: "What your handshake says about you", hint: "Use body language as a window into confidence." },
  { topic: "Why dinner tables matter more than ever", hint: "Connect shared meals to family, culture, and belonging." },
  { topic: "The surprising thing stress is good for", hint: "Distinguish between good stress and chronic stress." },
  { topic: "What maps can teach you about power", hint: "Explore how geography shapes history and politics." },
  { topic: "Why every person should try public speaking", hint: "Make the case for overcoming this specific fear." },
  { topic: "The moment a song changed how you saw the world", hint: "Be specific about the song and the moment." },
  { topic: "What your favourite season says about you", hint: "Have fun — connect personality to seasonal preference." },
  { topic: "Why the first five minutes of any meeting matter most", hint: "Focus on first impressions and energy." },
  { topic: "The case for embracing uncertainty", hint: "Show how not knowing can be freeing." },
  { topic: "What graffiti tells us about a city's soul", hint: "Treat street art as cultural expression, not vandalism." },
  { topic: "Why the best stories have no easy answers", hint: "Connect moral ambiguity to real life complexity." },
  { topic: "The thing I do every day that keeps me sane", hint: "Be honest and personal about your routine." },
  { topic: "What chess teaches you about thinking ahead", hint: "Draw lessons from the game into everyday decisions." },
  { topic: "Why learning a language changes your brain", hint: "Connect bilingualism to empathy and flexibility." },
  { topic: "The problem with social media highlight reels", hint: "Explore comparison culture and mental health." },
  { topic: "What your desk says about your mind", hint: "Connect physical environment to mental state." },
  { topic: "Why the best holidays aren't the planned ones", hint: "Make a case for spontaneity over itineraries." },
  { topic: "The surprising thing about introversion", hint: "Push back on common myths about quiet people." },
  { topic: "What the night sky reminds us of", hint: "Use stars and scale as a lens on perspective." },
  { topic: "Why repetition is the mother of mastery", hint: "Connect practice and boredom to excellence." },
  { topic: "The most important thing in a friendship", hint: "Pick one quality and defend it fully." },
  { topic: "What your first job taught you", hint: "Find the unexpected lesson in an early work experience." },
  { topic: "Why we need more silence in our lives", hint: "Connect quiet to creativity and mental clarity." },
  { topic: "The case for being wildly optimistic", hint: "Show that optimism is strategic, not naive." },
  { topic: "What a great logo tells you about a brand", hint: "Use design as a lens on identity and trust." },
  { topic: "Why the best ideas are borrowed ones", hint: "Defend remix culture and creative inspiration." },
  { topic: "The one thing money genuinely can't buy", hint: "Pick something specific and make a real argument." },
  { topic: "What hospitals teach you about time", hint: "Use the experience of illness or waiting to reframe priorities." },
  { topic: "Why we should take more photos of ordinary moments", hint: "Argue against saving cameras only for big events." },
  { topic: "The most underrated life skill nobody teaches", hint: "Pick something practical — negotiation, listening, rest." },
  { topic: "What your coffee order says about your personality", hint: "Have fun but find genuine insight in small choices." },
  { topic: "Why every generation thinks the next one is worse", hint: "Explore the psychology of generational criticism." },
  { topic: "The thing about home that you only understand when you leave", hint: "Be specific about what distance revealed." },
  { topic: "What a great photograph captures that words can't", hint: "Explore the unique power of visual storytelling." },
  { topic: "Why the best conversations are the unplanned ones", hint: "Defend serendipity over scheduled catch-ups." },
  { topic: "The problem with always needing a plan", hint: "Show how over-planning kills spontaneity and joy." },
  { topic: "What your childhood bedroom taught you", hint: "Use that space as a lens on who you became." },
  { topic: "Why rain makes cities more beautiful", hint: "Find the unexpected poetry in grey weather." },
  { topic: "The most interesting person you've ever met", hint: "What made them interesting? One specific quality." },
  { topic: "What your relationship with time says about you", hint: "Explore punctuality, deadlines, and how you use hours." },
  { topic: "Why handmade things have more value than manufactured ones", hint: "Connect craft to meaning and attention." },
  { topic: "The surprising thing about being lost", hint: "Reframe getting lost as a way of finding something." },
  { topic: "What a great apology actually sounds like", hint: "Break it down into real components." },
  { topic: "Why trees are the most underappreciated life form", hint: "Make a passionate case for trees." },
  { topic: "The thing about competition that nobody talks about", hint: "Find the uncomfortable truth in rivalry." },
  { topic: "What your shoe collection says about your life", hint: "Use objects as a way into personal history." },
  { topic: "Why imagination is more valuable than knowledge", hint: "Use Einstein's famous idea and push it further." },
  { topic: "The most interesting thing about the city you grew up in", hint: "Find the detail most outsiders would miss." },
  { topic: "What staying up all night teaches you", hint: "Explore what happens to the mind and body after dark." },
  { topic: "Why we should spend more time with elderly people", hint: "Connect age and wisdom to what younger people lack." },
  { topic: "The case for being deeply, unapologetically weird", hint: "Defend individuality against the pressure to conform." },
  { topic: "What your reaction to traffic reveals about you", hint: "Use a mundane frustration as a character study." },
  { topic: "Why the best teams don't always have the best players", hint: "Focus on chemistry, trust, and shared goals." },
  { topic: "The thing I believed for years that turned out to be wrong", hint: "Be humble and specific." },
  { topic: "What your grocery list says about your life right now", hint: "Use everyday choices as a mirror." },
  { topic: "Why art belongs in hospitals and not just galleries", hint: "Connect creativity to healing and humanity." },
  { topic: "The most powerful thing a parent can say to a child", hint: "Pick one phrase and explain why it matters." },
  { topic: "What a good night's sleep is actually worth", hint: "Quantify rest in terms of relationships, decisions, mood." },
  { topic: "Why we should normalise not knowing", hint: "Defend intellectual humility in a world that rewards confidence." },
  { topic: "The hidden beauty in everyday routines", hint: "Find poetry in the ordinary." },
  { topic: "What your reaction to criticism says about your ego", hint: "Be honest and self-aware." },
  { topic: "Why local businesses matter more than we think", hint: "Connect community economics to identity and belonging." },
  { topic: "The most counterintuitive thing about success", hint: "Find the unexpected truth that high achievers know." },
  { topic: "What a long walk teaches you about your problems", hint: "Connect movement to mental clarity." },
  { topic: "Why we should read more poetry", hint: "Make poetry feel relevant and urgent, not dusty." },
  { topic: "The thing about growing older nobody prepares you for", hint: "Be honest about one specific change." },
  { topic: "What the way you eat says about the way you live", hint: "Use food habits as a personality lens." },
  { topic: "Why saying thank you is more powerful than sorry", hint: "Explore gratitude as an alternative to apology." },
  { topic: "The most important quality in a leader", hint: "Pick one trait and argue it's the most crucial." },
  { topic: "What your relationship with your phone says about loneliness", hint: "Connect device use to the search for connection." },
  { topic: "Why daydreaming should be taken seriously", hint: "Defend mind-wandering as productive." },
  { topic: "The surprising lesson from my biggest embarrassment", hint: "Own it and find the gold in it." },
  { topic: "What the best teachers have in common", hint: "Find one quality that cuts across all great educators." },
  { topic: "Why we should be kinder in traffic", hint: "Use road rage as a microcosm of society." },
  { topic: "The case for keeping some things private", hint: "Push back on oversharing culture." },
  { topic: "What a broken thing teaches you about impermanence", hint: "Use a specific broken object as your starting point." },
  { topic: "Why the middle seat on a plane is actually fine", hint: "Make a playful but genuine case for the worst seat." },
  { topic: "The most honest thing anyone ever said to me", hint: "Make it personal and reflect on why it landed." },
  { topic: "What your handwriting says about your inner world", hint: "Use penmanship as a window into character." },
  { topic: "Why we should bring back more rituals", hint: "Connect ritual to meaning, continuity, and community." },
  { topic: "The best decision I ever made on impulse", hint: "Celebrate intuition alongside reason." },
  { topic: "What the sound of rain does to the human mind", hint: "Explore the psychology of white noise and comfort." },
  { topic: "Why every workplace needs a comedian", hint: "Make the case for humour as a professional asset." },
  { topic: "The most interesting thing about how languages die", hint: "Connect language loss to cultural identity." },
  { topic: "What your relationship with mirrors tells you", hint: "Explore vanity, self-image, and confidence." },
  { topic: "Why we should stop apologising for our hobbies", hint: "Defend leisure without productivity guilt." },
  { topic: "The thing about ambition nobody warns you about", hint: "Find the shadow side of drive and ambition." },
  { topic: "What the perfect sandwich teaches you about balance", hint: "Use food construction as a metaphor for life." },
];

// ── 60 Backup Quotes ─────────────────────────────────────────────────────────
const BACKUP_QUOTES = [
  "Courage is a muscle. You just worked it.",
  "Every rep counts, even the ugly ones.",
  "You spoke. That already puts you ahead.",
  "Discomfort today, confidence tomorrow.",
  "The mic fears no one who keeps showing up.",
  "Your voice gets stronger every time you use it.",
  "That wasn't practice. That was progress.",
  "Silence is easy. You chose harder.",
  "One more session closer to unstoppable.",
  "The best speakers were once the most nervous.",
  "You didn't wait. You went. That matters.",
  "Words get braver the more you say them.",
  "Somewhere, your future audience is waiting.",
  "You just did the thing most people avoid.",
  "Consistency is the only cheat code that works.",
  "Each session is a deposit in the confidence bank.",
  "Fear invited itself. You spoke anyway.",
  "Today's stumble is tomorrow's style.",
  "The stage doesn't care about perfect. Neither should you.",
  "You showed up. Half the world didn't.",
  "Comfort zones are just fears with good PR.",
  "That felt hard because it was hard. Well done.",
  "The gap between thinking and saying is closing.",
  "Another day, another topic conquered.",
  "Practice is just courage in disguise.",
  "Your streak is evidence of a decision made daily.",
  "Nobody great got there without reps like this.",
  "You're building something invisible but real.",
  "The nerves mean you care. Keep caring.",
  "A little better every time. That's the whole game.",
  "There's a version of you who never starts. Not you.",
  "Words once feared now feel almost friendly.",
  "You just narrated your thoughts to the universe. Bold.",
  "The awkward phase is mandatory. You're in it. Good.",
  "Imperfect and out loud beats perfect and silent.",
  "You can't edit what you never say.",
  "That topic didn't stand a chance.",
  "The only bad session is the one you skipped.",
  "Your voice was made to take up space.",
  "Another brick in the wall of confidence.",
  "Every great speaker has a session that felt like this.",
  "Forward is forward, even when it's slow.",
  "You practiced something most people just wish for.",
  "Momentum is quiet until suddenly it isn't.",
  "The version of you from last month would be impressed.",
  "Keep going. The compound interest on practice is real.",
  "That wasn't easy. You did it anyway.",
  "Your voice is developing a personality of its own.",
  "The world needs people who practice speaking truth.",
  "Repetition is how excellence disguises itself as habit.",
  "You turned a blank minute into a spoken thought.",
  "Most people are too scared to start. You started.",
  "Every session rewires the fear response a little.",
  "That topic chose the right speaker today.",
  "You just rehearsed for a moment that hasn't happened yet.",
  "The path to confident is paved with sessions like this.",
  "Done imperfectly is infinitely better than not done.",
  "You brought words to a fight most people flee.",
  "Your streak is just your commitment made visible.",
  "Ten years from now you'll be glad you practiced today.",
  "That was real. Raw. And exactly right.",
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

// ── Spin Wheel ────────────────────────────────────────────────────────────────
function SpinWheel({ spinning, onSpinEnd, accent, onWheelTick, size = 230, dark }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);
  const velRef = useRef(0);

  const segColors = dark
    ? ["#1e3a6e","#0f4d2e","#5c3a00","#3a1a5c","#5c1a1a","#0f2d5c",
       "#0f4020","#4d4000","#1a1a5c","#5c1a3a","#0f4030","#4d2a00"]
    : ["#f0f4ff","#e8f8f0","#fff8ee","#f5f0fb","#fef0f0","#eef4ff",
       "#f0fff4","#fffbee","#f0f0ff","#fff0f5","#eefff8","#fff5f0"];

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
    const segs = 12, segA = (2 * Math.PI) / segs;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 14);
    glow.addColorStop(0, "rgba(0,0,0,0.1)"); glow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(cx, cy, r + 12, 0, 2 * Math.PI);
    ctx.fillStyle = glow; ctx.fill();

    for (let i = 0; i < segs; i++) {
      const s = angle + i * segA, e = s + segA;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e); ctx.closePath();
      ctx.fillStyle = segColors[i % segColors.length]; ctx.fill();
      ctx.strokeStyle = dark ? "#1a1a1a" : "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
      const mid = s + segA / 2;
      ctx.beginPath(); ctx.arc(cx + r * 0.72 * Math.cos(mid), cy + r * 0.72 * Math.sin(mid), 4, 0, 2 * Math.PI);
      ctx.fillStyle = `${accent}55`; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = dark ? "#555" : "#e8e8e8"; ctx.lineWidth = 4; ctx.stroke();

    const hub = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 30);
    hub.addColorStop(0, dark ? "#444" : "#ffffff");
    hub.addColorStop(1, dark ? "#2a2a2a" : "#e8e8e8");
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = hub; ctx.fill();
    ctx.strokeStyle = dark ? "#555" : "#ddd"; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font = "bold 10px 'DM Sans', sans-serif";
    ctx.fillStyle = dark ? "#aaa" : "#777"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SPIN", cx, cy);
  }, [accent, dark, segColors]);

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
      const prevSeg = Math.floor(lastAngle / segA);
      const curSeg = Math.floor(angleRef.current / segA);
      if (curSeg !== prevSeg && onWheelTick) {
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

// ── Circular Timer ────────────────────────────────────────────────────────────
function CircularTimer({ seconds, total, color, dark }) {
  const r = 54, circ = 2 * Math.PI * r;
  const dash = circ * (seconds / total);
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  const display = total >= 60 ? `${mins}:${String(secs).padStart(2, "0")}` : `${seconds}s`;
  return (
    <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke={dark ? "#444" : "#f0f0f0"} strokeWidth="7" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: dark ? "#f0f0f0" : "#1a1a1a", fontFamily: "'DM Mono', monospace", letterSpacing: "-1px" }}>{display}</span>
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose, ideationMins, setIdeationMins, soundOn, setSoundOn, themeIdx, setThemeIdx, dark, setDark }) {
  if (!open) return null;
  const accent = THEME_COLORS[themeIdx].accent;
  const bg = dark ? "#1a1a1a" : "#fff";
  const text = dark ? "#f0f0f0" : "#1a1a1a";
  const sub = dark ? "#888" : "#555";
  const border = dark ? "#333" : "#ececec";
  const btnBg = dark ? "#2a2a2a" : "#fafafa";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div style={{ background: bg, borderRadius: 24, padding: "28px 24px", width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: text }}>Settings</h3>
          <button onClick={onClose} style={{ background: dark ? "#333" : "#f0f0f0", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: sub }}>✕</button>
        </div>

        {/* Dark mode toggle */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: sub }}>Dark Mode</div>
          </div>
          <div onClick={() => setDark(d => !d)} style={{
            width: 46, height: 26, borderRadius: 13, background: dark ? accent : "#ddd",
            cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ position: "absolute", top: 3, left: dark ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        {/* Ideation time */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: sub, display: "block", marginBottom: 10 }}>Ideation Time</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[0.5, 1, 2, 3].map(m => (
              <button key={m} onClick={() => setIdeationMins(m)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 12,
                border: ideationMins === m ? `2px solid ${accent}` : `2px solid ${border}`,
                background: ideationMins === m ? accent + "18" : btnBg,
                fontSize: 13, fontWeight: 700,
                color: ideationMins === m ? accent : sub, cursor: "pointer",
              }}>{m === 0.5 ? "30s" : `${m}m`}</button>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: sub }}>Sound Effects</div>
            <div style={{ fontSize: 12, color: dark ? "#666" : "#bbb", marginTop: 2 }}>Ticks, alerts & completion chime</div>
          </div>
          <div onClick={() => setSoundOn(s => !s)} style={{
            width: 46, height: 26, borderRadius: 13, background: soundOn ? accent : "#ddd",
            cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ position: "absolute", top: 3, left: soundOn ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        {/* Theme color */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: sub, display: "block", marginBottom: 10 }}>Theme Color</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {THEME_COLORS.map((t, i) => (
              <div key={i} onClick={() => setThemeIdx(i)} style={{
                width: 32, height: 32, borderRadius: "50%", background: t.accent, cursor: "pointer",
                border: themeIdx === i ? `3px solid ${dark ? "#fff" : "#1a1a1a"}` : "3px solid transparent",
                boxShadow: themeIdx === i ? `0 0 0 2px ${bg}, 0 0 0 4px ${t.accent}` : "none",
                transition: "all 0.15s",
              }} title={t.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Byline ────────────────────────────────────────────────────────────────────
function Byline({ dark }) {
  return (
    <p style={{ fontSize: 12, color: dark ? "#555" : "#aaa", margin: "14px 0 0", textAlign: "center", letterSpacing: "0.2px" }}>
      — made by Shawn Biju
    </p>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);
  const [phase, setPhase] = useState("home");
  const [spinning, setSpinning] = useState(false);
  const [topic, setTopic] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [ideationTime, setIdeationTime] = useState(60);
  const [ideationStarted, setIdeationStarted] = useState(false);
  const [speakTime, setSpeakTime] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [practicedToday, setPracticedToday] = useState(false);
  const [quote, setQuote] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ideationMins, setIdeationMins] = useState(1);
  const [soundOn, setSoundOn] = useState(true);
  const [themeIdx, setThemeIdx] = useState(2);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("speakspin-dark") === "true"; } catch { return false; }
  });
  const [topicHistory, setTopicHistory] = useState([]);
  const [usedBackupIndices, setUsedBackupIndices] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const accent = THEME_COLORS[themeIdx].accent;
  const todayStr = () => new Date().toISOString().slice(0, 10);

  // ── Firebase auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // Load streak from Firestore
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const today = todayStr();
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            if (data.lastDate === today) { setStreakDays(data.days); setPracticedToday(true); }
            else if (data.lastDate === yesterdayStr) setStreakDays(data.days);
            else setStreakDays(0);
          }
        } catch {}
      } else {
        // Load from localStorage when not signed in
        try {
          const raw = localStorage.getItem("speakspin-streak");
          if (raw) {
            const data = JSON.parse(raw);
            const today = todayStr();
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            if (data.lastDate === today) { setStreakDays(data.days); setPracticedToday(true); }
            else if (data.lastDate === yesterdayStr) setStreakDays(data.days);
            else setStreakDays(0);
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {}
  };

  const handleSignOut = async () => {
    try { await signOut(auth); setStreakDays(0); setPracticedToday(false); } catch {}
  };

  // ── Persist dark mode ──
  useEffect(() => {
    try { localStorage.setItem("speakspin-dark", String(dark)); } catch {}
  }, [dark]);

  // ── Persist theme ──
  useEffect(() => {
    try { localStorage.setItem("speakspin-theme", String(themeIdx)); } catch {}
  }, [themeIdx]);

  const saveStreak = async (days, dateStr) => {
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { days, lastDate: dateStr }, { merge: true });
      } catch {}
    } else {
      try { localStorage.setItem("speakspin-streak", JSON.stringify({ days, lastDate: dateStr })); } catch {}
    }
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

  // ── Get a backup topic that hasn't been used yet ──
  const getBackupTopic = () => {
    const available = BACKUP_TOPICS.map((_, i) => i).filter(i => !usedBackupIndices.includes(i));
    if (available.length === 0) {
      // All used — reset
      setUsedBackupIndices([]);
      const idx = Math.floor(Math.random() * BACKUP_TOPICS.length);
      setUsedBackupIndices([idx]);
      const t = BACKUP_TOPICS[idx];
      return t.topic + (t.hint ? `\n${t.hint}` : "");
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    setUsedBackupIndices(prev => [...prev, idx]);
    const t = BACKUP_TOPICS[idx];
    return t.topic + (t.hint ? `\n${t.hint}` : "");
  };

  // ── Get a random backup quote ──
  const getBackupQuote = () => {
    return BACKUP_QUOTES[Math.floor(Math.random() * BACKUP_QUOTES.length)];
  };

  // ── Fetch topic from Gemini (backup if fails) ──
  const fetchTopic = async (duration) => {
    setLoadingTopic(true);
    try {
      const avoidList = topicHistory.slice(-10).join(", ");
      const res = await fetch("https://speakspin-proxy.shawnbiju1.workers.dev", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gemini: true,
    model: "gemini-1.5-flash",
    contents: [{
      parts: [{
        text: `Generate a single UNIQUE and creative speaking practice topic...`
      }]
    }],
    generationConfig: { temperature: 1.2, maxOutputTokens: 150 }
  })
});
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const newTopic = parsed.topic + (parsed.hint ? `\n${parsed.hint}` : "");
      setTopicHistory(h => [...h.slice(-19), parsed.topic]);
      return newTopic;
    } catch {
      return getBackupTopic();
    } finally {
      setLoadingTopic(false);
    }
  };

  // ── Fetch quote from Gemini (backup if fails) ──
  const fetchQuote = async (data) => {
    setLoadingQuote(true);
    try {
      const res = await fetch("https://speakspin-proxy.shawnbiju1.workers.dev", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gemini: true,
    model: "gemini-1.5-flash",
    contents: [{
      parts: [{
        text: `Someone just finished a ${data.duration}...`
      }]
    }],
    generationConfig: { temperature: 1.3, maxOutputTokens: 60 }
  })
});
      const d = await res.json();
      if (d.error) throw new Error(d.error.message);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text.trim().replace(/^["']|["']$/g, "");
    } catch {
      return getBackupQuote();
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleWheelTick = useCallback((pitch) => { playSound("wheelTick", pitch); }, [playSound]);

const handleSpin = async () => {
  if (spinning || loadingTopic) return;
  playSound("start");
  setSpinning(true);
  setPhase("spinning");
  const t = await fetchTopic(selectedDuration);
  setTopic(t);
};

useEffect(() => {
  const handleKey = (e) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (phase === "home" && !spinning && !loadingTopic) {
      handleSpin();
    } else if (phase === "ideation" && !ideationStarted) {
      startIdeation();
    } else if (phase === "ideation" && ideationStarted) {
      clearInterval(timerRef.current);
      startSpeaking();
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [spinning, loadingTopic, phase, ideationStarted]);
useEffect(() => {
  const handleKey = (e) => {
    if (e.code === "Space" && !spinning && !loadingTopic && phase === "home") {
      e.preventDefault();
      handleSpin();
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [spinning, loadingTopic, handleSpin]);

  
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
      await saveStreak(newDays, today);
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

  // ── Theme-aware styles ──
  const bg = dark ? "#111" : "#f5f5f0";
  const cardBg = dark ? "#1a1a1a" : "#fff";
  const cardBorder = dark ? "1px solid #2a2a2a" : "none";
  const textPrimary = dark ? "#f0f0f0" : "#1a1a1a";
  const textSub = dark ? "#666" : "#bbb";
  const textMuted = dark ? "#444" : "#f0f0f0";

  const base = {
    fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
    minHeight: "100dvh",
    background: bg,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: isMobile ? 16 : 24,
    position: "relative",
    transition: "background 0.3s",
  };
  const card = {
    background: cardBg,
    border: cardBorder,
    borderRadius: 24,
    boxShadow: dark ? "0 2px 24px rgba(0,0,0,0.4)" : "0 2px 24px rgba(0,0,0,0.07)",
    padding: isMobile ? "24px 18px" : "32px 28px",
    maxWidth: 420, width: "100%", textAlign: "center",
    transition: "background 0.3s",
  };
  const primaryBtn = (full) => ({
    background: accent, color: "#fff", border: "none", borderRadius: 14,
    padding: isMobile ? "16px 24px" : "14px 24px",
    fontSize: isMobile ? 16 : 15, fontWeight: 700, cursor: "pointer",
    width: full ? "100%" : "auto", letterSpacing: "0.2px",
    WebkitTapHighlightColor: "transparent",
  });
  const ghostBtn = {
    background: "transparent",
    color: dark ? "#666" : "#888",
    border: `1.5px solid ${dark ? "#333" : "#e0e0e0"}`,
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

  const fullscreenBtn = (
    <button onClick={() => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }} style={{
      position: "fixed", bottom: 20, left: 20,
      background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)",
      border: "none", borderRadius: 10,
      width: 38, height: 38, cursor: "pointer", fontSize: 16,
      display: "flex", alignItems: "center", justifyContent: "center",
      WebkitTapHighlightColor: "transparent", zIndex: 50,
      backdropFilter: "blur(4px)",
    }} title="Fullscreen">⛶</button>
  );

  // ── DONE ──
  if (phase === "done") return (
    <div style={{ ...base, background: dark ? "#111008" : "linear-gradient(160deg, #fffbf0 0%, #fff7e0 50%, #fef3d0 100%)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Mono&display=swap" rel="stylesheet" />
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
        <div style={{ fontSize: 13, color: dark ? "#C8841A" : "#C8841A", fontWeight: 600, marginBottom: 14, animation: "fadeUp 0.4s 0.28s both" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div style={{
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
          borderRadius: 16, padding: "14px 20px",
          marginBottom: 16, border: "1px solid rgba(245,166,35,0.2)",
          animation: "fadeUp 0.4s 0.35s both",
        }}>
          <div style={{ fontSize: 10, color: "#C8841A", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>You spoke on · {selectedDuration.label}</div>
          <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: dark ? "#f0e0c0" : "#3a2a0a", lineHeight: 1.4 }}>{topicLine}</div>
        </div>
        <div style={{ animation: "fadeUp 0.4s 0.5s both", minHeight: 32, marginBottom: 24 }}>
          {loadingQuote
            ? <div style={{ fontSize: 13, color: "#C8841A", opacity: 0.6 }}>…</div>
            : <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: dark ? "#d4a060" : "#7A4F0A", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{quote}"</p>
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
      <Byline dark={dark} />
      {fullscreenBtn}
    </div>
  );

  // ── SPEAKING ──
  if (phase === "speaking") return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <div style={card}>
        <div style={pill(accent)}>SPEAKING · {selectedDuration.label}</div>
        <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: textPrimary, margin: "0 0 20px", lineHeight: 1.4 }}>{topicLine}</h2>
        <CircularTimer seconds={speakTime} total={selectedDuration.seconds} color={accent} dark={dark} />
        <p style={{ fontSize: 13, color: textSub, margin: "12px 0 0" }}>Speak clearly and confidently</p>
      </div>
      <Byline dark={dark} />
      {fullscreenBtn}
    </div>
  );

  // ── IDEATION ──
  if (phase === "ideation") return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <div style={card}>
        <div style={pill(accent)}>YOUR TOPIC</div>
        <h2 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: textPrimary, margin: "0 0 6px", lineHeight: 1.4 }}>{topicLine}</h2>
        {topicHint && <p style={{ fontSize: 13, color: textSub, margin: "0 0 20px", lineHeight: 1.5 }}>{topicHint}</p>}
        <div style={{ borderTop: `1px solid ${dark ? "#2a2a2a" : "#f0f0f0"}`, paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: textSub, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            {ideationStarted ? "Prep time left" : `${ideationMins === 0.5 ? "30s" : `${ideationMins} min`} to prepare`}
          </p>
          <CircularTimer seconds={ideationTime} total={Math.round(ideationMins * 60)} color={accent} dark={dark} />
        </div>
        {!ideationStarted
          ? <button style={{ ...primaryBtn(true), marginTop: 20 }} onClick={startIdeation}>Start Ideating →</button>
          : ideationTime === 0
            ? <button style={{ ...primaryBtn(true), marginTop: 20 }} onClick={startSpeaking}>Start Speaking →</button>
            : <button style={{ ...ghostBtn, width: "100%", marginTop: 20 }} onClick={() => { clearInterval(timerRef.current); startSpeaking(); }}>Skip → Start Speaking</button>
        }
      </div>
      <Byline dark={dark} />
      {fullscreenBtn}
    </div>
  );

  // ── HOME ──
  return (
    <div style={base}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}
        ideationMins={ideationMins} setIdeationMins={setIdeationMins}
        soundOn={soundOn} setSoundOn={setSoundOn}
        themeIdx={themeIdx} setThemeIdx={setThemeIdx}
        dark={dark} setDark={setDark} />

      <div style={{ ...card, paddingTop: 24 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: streakDays === 0 ? (dark ? "#555" : "#aaa") : accent }}>
              {streakDays === 0
                ? "🥶 No streak yet — start one today"
                : streakDays >= 30 ? `🏆 ${streakDays} day streak — legendary!`
                : streakDays >= 14 ? `🔥 ${streakDays} day streak — on fire!`
                : streakDays >= 7 ? `⚡ ${streakDays} day streak — amazing!`
                : streakDays >= 3 ? `🔥 ${streakDays} day streak — keep it up!`
                : `🔥 ${streakDays} day${streakDays !== 1 ? "s" : ""} streak${practicedToday ? " · ✓ today" : " — don't break it!"}`
              }
            </div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: textPrimary, margin: "2px 0 0", letterSpacing: "-0.5px" }}>🎙️ Practice Public Speaking</h1>
            <p style={{ fontSize: 12, color: textSub, margin: 0 }}>Spin. Prepare. Speak.</p>
          </div>
          <button onClick={() => setSettingsOpen(true)} style={{
            background: dark ? "#2a2a2a" : "#f5f5f5", border: "none", borderRadius: 12, width: 40, height: 40,
            cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 8, WebkitTapHighlightColor: "transparent",
          }}>⚙️</button>
        </div>

        {/* Duration selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 24 }}>
          {DURATIONS.map(d => (
            <button key={d.label} onClick={() => setSelectedDuration(d)} style={{
              border: selectedDuration.label === d.label ? `2.5px solid ${accent}` : `2px solid ${dark ? "#333" : "#ececec"}`,
              background: selectedDuration.label === d.label ? accent + "18" : dark ? "#222" : "#fafafa",
              borderRadius: 12, padding: isMobile ? "10px 2px" : "10px 4px", cursor: "pointer", transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: selectedDuration.label === d.label ? accent : dark ? "#888" : "#555" }}>{d.label}</div>
              <div style={{ fontSize: 9, color: textSub, marginTop: 2 }}>{d.desc}</div>
            </button>
          ))}
        </div>

        {/* Spin wheel */}
        <div onClick={handleSpin} style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative", cursor: "pointer" }}>
  <SpinWheel spinning={spinning} onSpinEnd={handleSpinEnd} accent={accent} onWheelTick={handleWheelTick} size={wheelSize} dark={dark} />
</div>

        <button style={{ ...primaryBtn(true), opacity: spinning ? 0.6 : 1 }} onClick={handleSpin} disabled={spinning || loadingTopic}>
          {spinning ? "Spinning…" : "Find Topic →"}
        </button>
      </div>

      <Byline dark={dark} />
      {fullscreenBtn}

      {/* Floating auth button top right */}
      {!authLoading && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200 }}>
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(o => !o)} style={{
                width: 40, height: 40, borderRadius: 10, border: "none", padding: 0,
                cursor: "pointer", overflow: "hidden", display: "block",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                WebkitTapHighlightColor: "transparent",
              }}>
                <img src={user.photoURL} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="profile" />
              </button>
              {profileOpen && (
                <div style={{
                  position: "absolute", top: 48, right: 0,
                  background: dark ? "#1a1a1a" : "#fff",
                  border: `1px solid ${dark ? "#333" : "#eee"}`,
                  borderRadius: 14, padding: "8px", minWidth: 180,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}>
                  <div style={{ padding: "8px 12px 10px", borderBottom: `1px solid ${dark ? "#2a2a2a" : "#f0f0f0"}`, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#f0f0f0" : "#1a1a1a", marginBottom: 2 }}>{user.displayName}</div>
                    <div style={{ fontSize: 11, color: dark ? "#666" : "#aaa" }}>{user.email}</div>
                  </div>
                  <button onClick={() => { setProfileOpen(false); handleSignOut(); }} style={{
                    width: "100%", padding: "9px 12px", background: "transparent", border: "none",
                    borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: "#E05A5A", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                    WebkitTapHighlightColor: "transparent",
                  }}>
                    ↩ Sign out
                  </button>
                </div>
              )}
              {profileOpen && <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: -1 }} />}
            </div>
          ) : (
            <button onClick={signInWithGoogle} style={{
              background: dark ? "#2a2a2a" : "#fff",
              border: `1px solid ${dark ? "#444" : "#e0e0e0"}`,
              borderRadius: 10, padding: "0 14px", height: 40,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: dark ? "#ccc" : "#444",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              WebkitTapHighlightColor: "transparent",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 11v2h4.5c-.2 1.1-.9 2-1.9 2.6v2.2h3c1.8-1.7 2.8-4.1 2.8-6.8 0-.6-.1-1.2-.2-1.8H12v1.8z" fill="#4285F4"/>
                <path d="M12 21c2.7 0 5-0.9 6.6-2.4l-3-2.2c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-6-4.4H3v2.3C4.5 19.1 8 21 12 21z" fill="#34A853"/>
                <path d="M6 12.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V6.8H3C2.4 8 2 9.5 2 11s.4 3 1 4.2L6 12.9z" fill="#FBBC05"/>
                <path d="M12 5.7c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.7 14.7 2 12 2 8 2 4.5 3.9 3 6.8l3 2.3c.9-2.5 3.2-4.4 6-4.4z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </div>
  );
}


