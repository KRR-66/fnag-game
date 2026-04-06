import { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";

/* ═══ UTILS ═══ */
const R = a => a[Math.floor(Math.random() * a.length)];
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const HS = 55;
const HL = ["12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM"];
const MM = { normal: 5, nightmare: 12, infinite: 50, custom: 1 };

/* ═══ ROOMS ═══ */
const ROOMS = {
  stage:{n:"Trading Floor",e:"🏦"},storage:{n:"Cold Storage",e:"📦"},backstage:{n:"The Vault",e:"🔐"},
  break_room:{n:"Break Room",e:"☕"},dining:{n:"Bull Pen",e:"🍕"},archive:{n:"The Archive",e:"📁"},
  server_room:{n:"Server Room",e:"💻"},kitchen:{n:"Kitchen",e:"🔪",cd:"L"},
  east_hall:{n:"Long Corridor",e:"🚪",cd:"R"},west_hall:{n:"Short Corridor",e:"🚪",cd:"L"},
  maintenance:{n:"Maintenance",e:"🔧"},vent:{n:"Pipeline",e:"🕳️",cd:"V"}
};
const CI = Object.keys(ROOMS);

const RV = {
  stage:{bg:"linear-gradient(180deg,#12081e 0%,#1a0a2e 40%,#0a0418 100%)",dec:["🎭","🔦","🎬","🔦","🎭"],atm:["Stage lights flicker erratically.","The curtain is moving on its own.","Empty chairs face the stage.","Faint music echoes from nowhere."]},
  storage:{bg:"linear-gradient(180deg,#081218 0%,#0a1a24 40%,#040a10 100%)",dec:["📦","📦","🧊","📦","❄️"],atm:["Frost covers everything.","Something shifted behind the boxes.","Temperature is dropping fast.","Ice crystals forming on lens."]},
  backstage:{bg:"linear-gradient(180deg,#14100a 0%,#1a1408 40%,#0a0806 100%)",dec:["🔐","🥇","🥇","🥇","🔐"],atm:["The vault door is slightly ajar.","Gold glints in the darkness.","Heavy breathing echoes.","The lock has been forced open."]},
  break_room:{bg:"linear-gradient(180deg,#0e0a14 0%,#140e1e 40%,#080610 100%)",dec:["☕","📺","🛋️","📰","☕"],atm:["TV playing nothing but static.","The coffee is still warm.","Someone was just here.","Cushions have been moved."]},
  dining:{bg:"linear-gradient(180deg,#140e08 0%,#1e1408 40%,#0a0804 100%)",dec:["🪑","🍕","🍽️","🍕","🪑"],atm:["Chairs toppled over.","Deep scratches on the table.","A plate just shattered.","The food is freshly placed."]},
  archive:{bg:"linear-gradient(180deg,#0a0a14 0%,#0e0e20 40%,#06060a 100%)",dec:["📁","📁","📋","📁","📁"],atm:["Files scattered everywhere.","Something is searching.","A drawer slams shut.","Papers flutter by themselves."]},
  server_room:{bg:"linear-gradient(180deg,#080a14 0%,#0a0e22 40%,#04060a 100%)",dec:["🖥️","💻","🖥️","💻","🖥️"],atm:["Servers getting louder.","Red warning light flashing.","ABNORMAL ACTIVITY DETECTED.","Data streams corrupted."]},
  kitchen:{bg:"linear-gradient(180deg,#14080a 0%,#200a0e 40%,#0a0406 100%)",dec:["🔪","🍳","🥘","🔪","🍶"],atm:["A knife is missing.","The burner is still on.","Water drips rhythmically.","Leads to LEFT DOOR →"]},
  east_hall:{bg:"linear-gradient(180deg,#0a0810 0%,#0e0a18 40%,#060408 100%)",dec:["💡","░░░","░░░","░░░","💡"],atm:["The hall stretches forever.","Lights flickering rapidly.","Footsteps echoing.","Leads to RIGHT DOOR →"]},
  west_hall:{bg:"linear-gradient(180deg,#0a0810 0%,#0e0a18 40%,#060408 100%)",dec:["💡","░░░","░░░","░░░","💡"],atm:["Nowhere to hide here.","The light just died.","Moving shadows.","Leads to LEFT DOOR →"]},
  maintenance:{bg:"linear-gradient(180deg,#0a0e0a 0%,#0e140e 40%,#04080a 100%)",dec:["🔧","🔩","⚙️","🔩","🔧"],atm:["Pipes groaning loudly.","Steam hissing.","A wrench clatters.","Grate leads below."]},
  vent:{bg:"linear-gradient(180deg,#0a080a 0%,#120e12 40%,#060406 100%)",dec:["🕳️","═══","═══","═══","🕳️"],atm:["Wind howling through.","Metal scraping.","Something crawling.","Leads to VENT →"]}
};

/* ═══ ANIMATRONICS ═══ */
const AD = [
  {id:"goldie",n:"GOLDIE",e:"🥇",s:"stage",dr:"L",p:["stage","storage","dining","kitchen","west_hall"],ni:1,d:"Slow. Freezes when watched. SILENT.",silent:true},
  {id:"bull",n:"THE BULL",e:"📈",s:"stage",dr:"R",p:["stage","break_room","server_room","east_hall"],ni:1,d:"Fast charger. Loud."},
  {id:"broker",n:"BROKER",e:"💰",s:"storage",dr:"L",p:["storage","dining","kitchen","west_hall"],ni:1,d:"Steady left route. SILENT.",silent:true},
  {id:"bear",n:"THE BEAR",e:"📉",s:"backstage",dr:null,p:null,ni:2,d:"Random side. Loud."},
  {id:"ticker",n:"TICKER",e:"📊",s:"vent",dr:"V",p:["vent"],ni:1,d:"Strikes from Pipeline. Wind the bell."},
  {id:"fed",n:"THE FED",e:"🏦",s:"backstage",dr:"R",p:["backstage","archive","server_room","east_hall"],ni:2,d:"Slow, tiny window. SILENT.",silent:true},
  {id:"margin",n:"MARGIN",e:"💀",s:"stage",dr:null,p:null,ni:3,d:"Lightning fast. Any door. Loud."},
  {id:"phantom",n:"PHANTOM",e:"🕯️",s:null,dr:null,p:null,ni:2,d:"Camera trap. Look away.",sp:"phantom"},
  {id:"auditor",n:"AUDITOR",e:"👁️",s:null,dr:null,p:null,ni:4,d:"Invisible. Light flash scares it.",sp:"auditor"}
];
const BP = {L:["backstage","archive","dining","kitchen","west_hall"],R:["backstage","archive","server_room","east_hall"]};
const MRP = {L:["stage","storage","kitchen","west_hall"],R:["stage","break_room","east_hall"]};

const DF = n => {
  const d = Math.min(n, 50);
  return {
    gs:Math.max(5,24-d*.7), bs:Math.max(4,20-d*.6), bks:Math.max(5,22-d*.6),
    brs:Math.max(5,26-d*.7), fs:Math.max(6,30-d*.8), fw:Math.max(1.2,3.5-d*.12),
    ms:Math.max(6,22-d*.35), aw:Math.max(2,5-d*.18),
    bd:0.025+d*.0008, cd:0.07+d*.002, td:0.10+d*.005,
    er:Math.max(12,36-d), hc:Math.min(.25,d*.015),
    pr:Math.max(12,40-d*1.5), ar:Math.max(20,35-d), awn:Math.max(6,10-d*.25)
  };
};

/* ═══ TEXT DATA ═══ */
const SHOP = [{id:"batt",n:"Battery+",d:"+20 max",mx:3,cost:[15,30,50],icon:"🔋"},{id:"door",n:"Door Eff.",d:"-12% drain",mx:3,cost:[20,40,65],icon:"🚪"},{id:"music",n:"Music Box+",d:"-10% drain",mx:3,cost:[15,30,50],icon:"🔔"},{id:"cam",n:"Camera Eff.",d:"-15% drain",mx:3,cost:[20,40,65],icon:"📹"},{id:"light",n:"Flashlight+",d:"+0.5s dur",mx:3,cost:[15,25,40],icon:"💡"}];
const ACH = [{id:"n1",n:"First Night",d:"Clear N1",i:"⭐"},{id:"n5",n:"Veteran",d:"Clear N5",i:"🏆"},{id:"nocam",n:"Blind Guard",d:"No cameras",i:"🙈"},{id:"nolight",n:"Dark Guard",d:"No lights",i:"🔦"},{id:"batthi",n:"Miser",d:"50%+ battery",i:"🔋"},{id:"blk10",n:"Bouncer",d:"10+ blocks",i:"🚪"},{id:"shadow",n:"Shadow OK",d:"Survive shadow",i:"👤"},{id:"nmr",n:"Nightmare King",d:"Beat Nightmare",i:"👑"},{id:"inf",n:"Immortal",d:"Beat Infinite",i:"♾️"},{id:"cst100",n:"Custom King",d:"Custom 100+",i:"🎮"},{id:"mute",n:"Deaf Guard",d:"Clear muted",i:"🔇"},{id:"dl3",n:"Deathless",d:"3 no death",i:"💎"}];
const PHONE = ["Welcome to Gold's! Check cameras, close doors, wind the music box.","Night 2. The Bear picks random sides. Phantom on cameras — look away fast.","Night 3. MARGIN CALL. Fastest thing here. Skips rooms.","Night 4. The Auditor. Invisible. Listen for the drone. Flash lights.","Night 5... Watch for shadows.","You're on your own."];
const MEV = [{n:"FLASH CRASH",e:"📉",t:"forceDoor",dur:5},{n:"CIRCUIT BREAKER",e:"⚡",t:"camDown",dur:8},{n:"RATE HIKE",e:"📊",t:"dblDrain",dur:10},{n:"STIMULUS",e:"💵",t:"freeBatt",dur:0},{n:"BEAR MARKET",e:"🐻",t:"musicDrain",dur:10},{n:"LIQUIDITY CRISIS",e:"🏦",t:"allOpen",dur:3}];
const CREEPY = ["I can hear you.","Don't look behind you.","12 rooms. 9 of us.","Nobody survives."];
const DMSG = ["The animatronics got you.","Should've checked cameras.","The market closed permanently."];
const TGL = ["HELP ME","GAME OVER","R\u0338U\u0338N\u0338","MARGIN CALL"];
const WDS = ["ANIMATRONIC","NIGHTMARE","JUMPSCARE","SURVIVAL","SECURITY","MIDNIGHT","PHANTOM","GENERATOR","FIBONACCI","LIQUIDITY"];
const SC = {goldie:[{t:"emoji",e:"🥇",msg:"GOLDEN",c:"#ffd700",sc:5}],bull:[{t:"emoji",e:"📈",msg:"BULL RUN",c:"#0f0",sc:5}],bear:[{t:"emoji",e:"📉",msg:"CRASH",c:"#f00",sc:5}],ticker:[{t:"glitch",msg:"T\u0336I\u0335C\u0330K\u0337",c:"#f0f"}],broker:[{t:"emoji",e:"💰",msg:"SOLD",c:"#ffd700",sc:5}],fed:[{t:"emoji",e:"🏦",msg:"RATE HIKE",c:"#38f",sc:5}],margin:[{t:"face",eyes:"#f00",msg:"LIQUIDATED",teeth:true}],phantom:[{t:"glitch",msg:"W\u0330A\u0335S\u0336 \u0337I\u0335 \u0330R\u0336E\u0335A\u0337L\u0330",c:"#a0f"}],auditor:[{t:"face",eyes:"#fff",msg:"AUDITED",teeth:true}],shadow:[{t:"face",eyes:"#000",msg:"",teeth:false}],x:[{t:"emoji",e:"💀",msg:"DEAD",c:"#f00",sc:5},{t:"face",eyes:"#8aff3a",msg:"BACK",teeth:true}]};

/* ═══ SOUNDS ═══ */
const mk = (t, f, v, d) => { try { const s = new Tone.Synth({oscillator:{type:t},envelope:{attack:.001,decay:d,sustain:0,release:.1}}).toDestination(); s.volume.value = v; s.triggerAttackRelease(f, d); setTimeout(() => s.dispose(), d * 1e3 + 500); } catch {} };
const sG = () => { try { const s = new Tone.Synth({oscillator:{type:"square"},envelope:{attack:.001,decay:.02,sustain:0,release:.01}}).toDestination(); s.volume.value = -2; [440,80,1200,60].forEach((f, i) => setTimeout(() => { try { s.triggerAttackRelease(f, .015); } catch {} }, i * 25)); setTimeout(() => s.dispose(), 1e3); } catch {} };
const sB = () => { try { const n = new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:.001,decay:.4,sustain:0,release:.1}}).toDestination(); n.volume.value = 2; n.triggerAttackRelease(.4); setTimeout(() => n.dispose(), 1e3); } catch {} };
const sSt = () => { try { const n = new Tone.NoiseSynth({noise:{type:"brown"},envelope:{attack:.01,decay:.3,sustain:0,release:.1}}).toDestination(); n.volume.value = -12; n.triggerAttackRelease(.3); setTimeout(() => n.dispose(), 800); } catch {} };
const sH = () => { try { const s = new Tone.MembraneSynth({pitchDecay:.05,octaves:4,envelope:{attack:.01,decay:.15,sustain:0,release:.1}}).toDestination(); s.volume.value = -10; s.triggerAttackRelease("C1", .08); setTimeout(() => s.dispose(), 1e3); } catch {} };
const sSl = () => { try { const s = new Tone.MembraneSynth({pitchDecay:.03,octaves:4,envelope:{attack:.001,decay:.25,sustain:0,release:.15}}).toDestination(); s.volume.value = -4; s.triggerAttackRelease("G1", .15); setTimeout(() => s.dispose(), 800); } catch {} };
const sO = () => mk("triangle","C3",-12,.12);
const sE = () => { mk("square","A4",-15,.15); setTimeout(() => mk("square","F3",-15,.3), 200); };
const sV = () => { ["C4","E4","G4","C5"].forEach((n, i) => setTimeout(() => mk("triangle", n, -6, .3), i * 150)); };
const sBr = () => { try { const n = new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:.3,decay:1.2,sustain:0,release:.5}}).toDestination(); n.volume.value = -8; n.triggerAttackRelease(1.2); setTimeout(() => n.dispose(), 3e3); } catch {} };
const sAud = () => { try { const s1 = new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:.8,decay:1.5,sustain:0,release:1}}).toDestination(); s1.volume.value = -6; s1.triggerAttackRelease("Eb2", 2); const s2 = new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:1,decay:1.5,sustain:0,release:1}}).toDestination(); s2.volume.value = -8; s2.triggerAttackRelease("A2", 2); setTimeout(() => { try { s1.dispose(); s2.dispose(); } catch {} }, 4e3); } catch {} };
const sBl = () => { mk("triangle","E5",-10,.15); setTimeout(() => mk("triangle","C5",-12,.12), 120); };
const sBang = () => { mk("sine","E1",-2,.15); setTimeout(() => mk("sine","C1",-4,.12), 150); try { const n = new Tone.NoiseSynth({noise:{type:"brown"},envelope:{attack:.001,decay:.2,sustain:0,release:.1}}).toDestination(); n.volume.value = -4; n.triggerAttackRelease(.2); setTimeout(() => n.dispose(), 600); } catch {} };
const sKnock = () => { mk("sine","A1",-6,.06); setTimeout(() => mk("sine","E1",-8,.04), 80); };
const sMap = () => { mk("triangle","E4",-10,.08); setTimeout(() => mk("triangle","C4",-12,.06), 70); };
const sCamSw = () => { try { const n = new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:.001,decay:.15,sustain:0,release:.05}}).toDestination(); n.volume.value = -6; n.triggerAttackRelease(.12); setTimeout(() => n.dispose(), 500); } catch {} };
const pS = f => (f && f.t === "glitch") ? sG : sB;

/* ═══ STORAGE (localStorage for standalone) ═══ */
const ST = {
  async g(k) { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : null; } catch { return null; } },
  async s(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

/* ═══ COLORS ═══ */
const G = {bg:"#06060e",bg2:"#0a0a16",card:"#0c0c1a",gold:"#e8b829",purple:"#a855f7",red:"#ef4444",green:"#22c55e",dim:"#2a2a44",sub:"#4a4a6a",txt:"#9898b8",brt:"#d8d8f0"};

/* ═══ CLOSE CAM HELPER ═══ */
const closeCamStyle = {padding:"10px 24px",borderRadius:10,background:"#a855f715",border:"1.5px solid #a855f730",cursor:"pointer",fontSize:13,fontWeight:900,color:"#a855f7",letterSpacing:2,userSelect:"none"};

/* ═══ APP ═══ */
export default function App() {
  const [scr, setScr] = useState("menu");
  const [mode, setMode] = useState("normal");
  const [night, setNight] = useState(1);
  const [hour, setHour] = useState(0);
  const [prog, setProg] = useState(0);
  const [batt, setBatt] = useState(100);
  const [pOut, setPOut] = useState(false);
  const [muted, setMuted] = useState(false);
  const [best, setBest] = useState({});
  const [dL, setDL] = useState(false);
  const [dR, setDR] = useState(false);
  const [dV, setDV] = useState(false);
  const [lL, setLL] = useState(false);
  const [lR, setLR] = useState(false);
  const [lCdL, setLCdL] = useState(false);
  const [lCdR, setLCdR] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [sel, setSel] = useState(null);
  const [camJ, setCamJ] = useState(false);
  const [anims, setAnims] = useState([]);
  const [mb, setMb] = useState(100);
  const [atD, setAtD] = useState({L:null,R:null,V:null});
  const [phCam, setPhCam] = useState(null);
  const [phT, setPhT] = useState(0);
  const [auD, setAuD] = useState(null);
  const [auT, setAuT] = useState(0);
  const [scare, setScare] = useState(null);
  const [gli, setGli] = useState(false);
  const [shk, setShk] = useState(false);
  const [inv, setInv] = useState(false);
  const [tGl, setTGl] = useState(false);
  const [crash, setCrash] = useState(null);
  const [toast, setToast] = useState(null);
  const [math, setMath] = useState(null);
  const [chal, setChal] = useState(null);
  const [hal, setHal] = useState({});
  const [bko, setBko] = useState(false);
  const [kills, setKills] = useState(0);
  const [wins, setWins] = useState(0);
  const [tab, setTab] = useState("play");
  const [coins, setCoins] = useState(0);
  const [upg, setUpg] = useState({batt:0,door:0,music:0,cam:0,light:0});
  const [stats, setStats] = useState({won:0,died:0,blocks:0,cams:0,by:{}});
  const [achv, setAchv] = useState([]);
  const [cLvl, setCLvl] = useState(() => { const o = {}; AD.forEach(a => { o[a.id] = 10; }); return o; });
  const [mEvt, setMEvt] = useState(null);
  const [phoneShow, setPhoneShow] = useState(false);
  const [nSum, setNSum] = useState(null);
  const [corr, setCorr] = useState(0);
  const [shadowOn, setShadowOn] = useState(false);
  const [windCd, setWindCd] = useState(false);
  const [windTimer, setWindTimer] = useState(0);
  const [showTut, setShowTut] = useState(false);
  const [camTrans, setCamTrans] = useState(false);

  const nR = useRef(1); const pR = useRef(0); const hR = useRef(0); const poR = useRef(false);
  const drf = useRef({L:false,R:false,V:false}); const scR = useRef(false); const bsR = useRef(false);
  const mR = useRef("normal"); const woR = useRef(false); const siR = useRef(false); const crR = useRef(false);
  const bgR = useRef(null); const anR = useRef([]); const mbR = useRef(100);
  const adR = useRef({L:null,R:null,V:null}); const evR = useRef(0); const caR = useRef(false);
  const baR = useRef(100); const slR = useRef(null); const phRef = useRef(0);
  const auR = useRef({d:null,t:0}); const mEvtR = useRef(null);
  const nBlk = useRef(0); const nCam = useRef(0); const nUCam = useRef(false); const nULt = useRef(false);
  const dlRef = useRef(0); const corrR = useRef(0);
  const evCd = useRef(0);
  const lLR = useRef(false); const lRR = useRef(false);
  const camTrR = useRef(false);

  useEffect(() => { nR.current = night; }, [night]);
  useEffect(() => { drf.current = {L:dL,R:dR,V:dV}; }, [dL, dR, dV]);
  useEffect(() => { mR.current = mode; }, [mode]);
  useEffect(() => { bsR.current = !!(math || chal); }, [math, chal]);
  useEffect(() => { caR.current = camOn; }, [camOn]);
  useEffect(() => { slR.current = sel; }, [sel]);
  useEffect(() => { mEvtR.current = mEvt; }, [mEvt]);
  useEffect(() => { lLR.current = lL; }, [lL]);
  useEffect(() => { lRR.current = lR; }, [lR]);

  const fire = useCallback((m, t = "info", d) => { setToast({m, t, id: Date.now()}); setTimeout(() => setToast(null), d || 3e3); }, []);
  const sv = useCallback(async (c, u, s, a, b) => { await ST.s("fnag7", {coins: c ?? coins, upg: u ?? upg, stats: s ?? stats, achv: a ?? achv, best: b ?? best, kills, wins}); }, [coins, upg, stats, achv, best, kills, wins]);

  const evCdSet = useCallback(() => { evCd.current = 10; evR.current = Math.max(evR.current, 6); }, []);
  const wasBusy = useRef(false);
  useEffect(() => { const busy = !!(math || chal); if (wasBusy.current && !busy) evCdSet(); wasBusy.current = busy; }, [math, chal, evCdSet]);
  const closeCam = useCallback((e) => { if (e) e.stopPropagation(); sSt(); setCamOn(false); setSel(null); }, []);

  useEffect(() => { (async () => { const s = await ST.g("fnag7"); if (s) { if (s.coins != null) setCoins(s.coins); if (s.upg) setUpg(s.upg); if (s.stats) setStats(s.stats); if (s.achv) setAchv(s.achv); if (s.best) setBest(s.best); if (s.kills) setKills(s.kills); if (s.wins) setWins(s.wins); } })(); }, []);
  useEffect(() => { try { Tone.getDestination().mute = muted; } catch {} }, [muted]);

  useEffect(() => {
    if (scr === "game" && !muted) {
      if (!bgR.current) {
        try {
          let alive = true;
          const del = new Tone.FeedbackDelay({delayTime:"8n",feedback:.4,wet:.5}).toDestination();
          const flt = new Tone.Filter({type:"lowpass",frequency:700,Q:1}).connect(del);
          const mel = new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:.005,decay:2.5,sustain:0,release:3}}).connect(flt);
          mel.volume.value = -18;
          const notes = ["C3","Eb3","Gb3","G3","Bb2","B2"];
          let mi = 0;
          const lp = () => { if (!alive) return; try { mel.triggerAttackRelease(notes[mi % notes.length], 1); } catch {} mi++; setTimeout(lp, 2500 + Math.random() * 4e3); };
          setTimeout(lp, 500);
          bgR.current = {mel, del, flt, kill: () => { alive = false; }};
        } catch {}
      }
    } else if (bgR.current) {
      try { bgR.current.kill(); bgR.current.mel.dispose(); bgR.current.del.dispose(); bgR.current.flt.dispose(); } catch {}
      bgR.current = null;
    }
    return () => { if (bgR.current) { try { bgR.current.kill(); bgR.current.mel.dispose(); bgR.current.del.dispose(); bgR.current.flt.dispose(); } catch {} bgR.current = null; } };
  }, [scr, muted]);

  const getUpg = () => ({maxBatt: 100 + upg.batt * 20, doorMul: 1 - upg.door * .12, musicMul: 1 - upg.music * .1, camMul: 1 - upg.cam * .15, lightDur: 1.2e3 + upg.light * 500});

  const initA = (n) => AD.filter(a => !a.sp).map(a => {
    let active = n >= a.ni;
    if (mode === "custom") active = cLvl[a.id] > 0;
    const df = DF(n);
    const spd = mode === "custom" ? Math.max(2, 22 - cLvl[a.id]) : {goldie:df.gs,bull:df.bs,broker:df.bks,bear:df.brs,fed:df.fs,margin:df.ms,ticker:15}[a.id] || 15;
    return {...a, room: a.s, cooldown: Math.round(spd + Math.random() * 5), moveSpd: spd, active, atDoor: 0, _path: a.p ? [...a.p] : null};
  });

  const doScare = useCallback((face, killer) => {
    if (scR.current) return;
    scR.current = true;
    const f = face || R(SC.x);
    setScare({...f, killer});
    pS(f)();
    setTimeout(() => { setScare(null); scR.current = false; }, 2200 + nR.current * 150);
  }, []);

  const die = useCallback((kid) => {
    doScare(R(SC[kid] || SC.x), kid);
    const ns = {...stats, died: stats.died + 1, by: {...stats.by, [kid]: (stats.by[kid] || 0) + 1}};
    setStats(ns); setKills(p => p + 1); dlRef.current = 0;
    sv(null, null, ns); setTimeout(() => setScr("dead"), 2400);
  }, [doScare, stats, sv]);

  const completeNight = useCallback(() => {
    const mx = MM[mR.current] || 50;
    const n = nR.current;
    sV(); siR.current = true;
    const bl = nBlk.current; const bt = Math.round(baR.current);
    let earned = 10 + Math.floor(n / 2) * 5;
    if (bl >= 5) earned += 5; if (bl >= 10) earned += 10;
    const ns = {...stats, won: stats.won + 1, blocks: stats.blocks + bl, cams: stats.cams + nCam.current};
    setStats(ns);
    const nc = coins + earned; setCoins(nc); dlRef.current++;
    const ua = [];
    if (ns.won >= 1) ua.push("n1"); if (n >= 5) ua.push("n5");
    if (!nUCam.current) ua.push("nocam"); if (!nULt.current) ua.push("nolight");
    if (bt >= 50) ua.push("batthi"); if (bl >= 10) ua.push("blk10");
    if (muted) ua.push("mute"); if (dlRef.current >= 3) ua.push("dl3");
    if (mR.current === "nightmare" && n >= 12) ua.push("nmr");
    if (mR.current === "infinite" && n >= 50) ua.push("inf");
    if (mR.current === "custom") { const tot = Object.values(cLvl).reduce((a, b) => a + b, 0); if (tot >= 100) ua.push("cst100"); }
    const newA = [...achv]; ua.forEach(id => { if (!newA.includes(id)) newA.push(id); }); setAchv(newA);
    const nb = {...best}; if (!nb[mR.current] || n > nb[mR.current]) nb[mR.current] = n; setBest(nb);
    sv(nc, null, ns, newA, nb);
    if (n >= mx) { woR.current = true; setWins(p => p + 1); }
    setNSum({night: n, batt: bt, blocks: bl, cams: nCam.current, earned, achvNew: ua.filter(id => !achv.includes(id)), won: n >= mx});
    setScr("nightsum");
  }, [stats, coins, achv, best, sv, muted, cLvl]);

  const startNight = useCallback((n) => {
    const u = getUpg(); const a = initA(n);
    anR.current = a; setAnims(a);
    baR.current = u.maxBatt; setBatt(u.maxBatt);
    setPOut(false); poR.current = false;
    setHour(0); hR.current = 0; setProg(0); pR.current = 0;
    setDL(false); setDR(false); setDV(false);
    setMb(100); mbR.current = 100;
    setAtD({L:null,R:null,V:null}); adR.current = {L:null,R:null,V:null};
    setMath(null); setChal(null); setCamJ(false); setHal({}); setBko(false);
    setPhCam(null); phRef.current = 0; setAuD(null); auR.current = {d:null,t:0};
    evR.current = 8; scR.current = false; crR.current = false;
    setCamOn(false); setSel(null); setMEvt(null);
    corrR.current = 0; setCorr(0);
    nBlk.current = 0; nCam.current = 0; nUCam.current = false; nULt.current = false;
    setShadowOn(false); setWindCd(false); setWindTimer(0);
    lLR.current = false; lRR.current = false; setLCdL(false); setLCdR(false);
    if (n <= PHONE.length) { setPhoneShow(true); setTimeout(() => setPhoneShow(false), 8e3); }
  }, [upg, mode, cLvl]);

  const startGame = async (m, n) => {
    try { await Tone.start(); } catch {}
    sB(); setMode(m); mR.current = m;
    const sn = n || 1; setNight(sn); nR.current = sn;
    woR.current = false; siR.current = false; dlRef.current = 0;
    startNight(sn); setScr("game");
    fire("\u2620\uFE0F Night " + sn, "error", 4e3);
  };

  const switchRoom = useCallback((newRoom) => {
    if (camTrR.current || newRoom === sel || camJ) return;
    camTrR.current = true;
    setCamTrans(true); sCamSw();
    setTimeout(() => { setSel(newRoom); nCam.current++; nUCam.current = true; setCamTrans(false); camTrR.current = false; }, 220);
  }, [sel, camJ]);

  const curIdx = sel ? CI.indexOf(sel) : -1;
  const prevRoom = useCallback(() => { if (curIdx >= 0) switchRoom(CI[(curIdx - 1 + CI.length) % CI.length]); }, [curIdx, switchRoom]);
  const nextRoom = useCallback(() => { if (curIdx >= 0) switchRoom(CI[(curIdx + 1) % CI.length]); }, [curIdx, switchRoom]);

  const tDoor = (s) => {
    if (poR.current) { fire("\u26A1 No power!", "error", 1500); return; }
    if (s === "L") setDL(p => { p ? sO() : sSl(); return !p; });
    if (s === "R") setDR(p => { p ? sO() : sSl(); return !p; });
    if (s === "V") setDV(p => { p ? sO() : sSl(); return !p; });
  };

  const flash = (s) => {
    if (poR.current) return;
    if (s === "L" && lCdL) return;
    if (s === "R" && lCdR) return;
    baR.current = Math.max(0, baR.current - .8); setBatt(baR.current);
    nULt.current = true;
    const u = getUpg();
    if (s === "L") { setLL(true); setLCdL(true); setTimeout(() => setLL(false), u.lightDur); setTimeout(() => setLCdL(false), 3500); }
    if (s === "R") { setLR(true); setLCdR(true); setTimeout(() => setLR(false), u.lightDur); setTimeout(() => setLCdR(false), 3500); }
  };

  const wind = () => {
    if (poR.current || windCd) return;
    mbR.current = cl(mbR.current + 3, 0, 100); setMb(mbR.current);
    baR.current = Math.max(0, baR.current - .3); setBatt(baR.current);
    sBl(); setWindCd(true); setWindTimer(3);
    const wi = setInterval(() => { setWindTimer(p => { if (p <= 1) { clearInterval(wi); setWindCd(false); return 0; } return p - 1; }); }, 1e3);
  };

  const buyUpg = (id) => {
    const it = SHOP.find(s => s.id === id); if (!it) return;
    const lv = upg[id] || 0; if (lv >= it.mx) return;
    const cost = it.cost[lv]; if (coins < cost) return;
    const nu = {...upg, [id]: lv + 1}; const nc = coins - cost;
    setUpg(nu); setCoins(nc); sv(nc, nu); fire(it.icon + " Upgraded!", "success");
  };

  const spawnEvt = useCallback(() => {
    const n = nR.current; const d = Math.floor(n / 2); const cr = Math.random();
    if (cr < .12) {
      const ops = ["+","-","\u00D7"]; const op = R(ops);
      let a, b, ans;
      if (op === "+") { a = 10+d*5+Math.floor(Math.random()*(50+d*15)); b = 10+d*5+Math.floor(Math.random()*(50+d*15)); ans = a+b; }
      else if (op === "-") { a = 30+d*10+Math.floor(Math.random()*(50+d*20)); b = Math.floor(Math.random()*a); ans = a-b; }
      else { a = 2+Math.floor(Math.random()*(12+d*2)); b = 2+Math.floor(Math.random()*(12+d*2)); ans = a*b; }
      setMath({a, b, op, ans, input: "", timer: Math.max(4, 9-d)});
    } else if (cr < .24) { setChal({type:"wind",progress:0,target:18+n*3,timer:Math.max(4,7-Math.floor(n/3))}); }
    else if (cr < .36) { setChal({type:"click",count:0,target:12+Math.floor(Math.random()*6)+Math.floor(n/2),timer:Math.max(3,6-Math.floor(n/3))}); }
    else if (cr < .48) { const w = R(WDS); setChal({type:"type",word:w,input:"",timer:Math.max(3,Math.ceil(w.length*.55)+2-Math.floor(n/4))}); }
    else if (cr < .58) { const c2 = Math.floor(Math.random()*4); const wC = ["#f00","#0f0","#38f","#fa0"].sort(() => Math.random()-.5); setChal({type:"wire",wires:[0,1,2,3].map(i => ({c:wC[i],correct:i===c2})),hint:["1st","2nd","3rd","4th"][c2],timer:Math.max(3,5-Math.floor(n/3))}); }
    else if (cr < .66) { setChal({type:"freeze",timer:Math.min(4, 3+Math.min(Math.floor(n/4),1)),failed:false}); }
    else if (cr < .76) { const len = 2+Math.min(Math.floor(n/3),3); setChal({type:"memory",seq:Array.from({length:len},() => Math.floor(Math.random()*4)),show:0,phase:"watch",input:[],timer:Math.max(6,12-Math.floor(n/3))}); }
    else if (cr < .88) { setCamJ(true); setChal({type:"reboot",clicks:0,target:8+Math.floor(n/2),timer:Math.max(4,8-Math.floor(n/3))}); }
    else { setBko(true); setTimeout(() => setBko(false), Math.min(4e3, 2e3 + n * 200)); }
  }, []);

  useEffect(() => {
    if (scr !== "game") return;
    const i = setInterval(() => {
      setMath(p => { if (!p) return null; if (p.timer <= 1) { doScare({t:"emoji",e:"\uD83D\uDCCF",msg:"SLOW",c:"#0f0",sc:5}); baR.current = Math.max(0, baR.current - 18); setBatt(baR.current); return null; } return {...p, timer: p.timer - 1}; });
      let ct = null;
      setChal(p => {
        if (!p) return null;
        if (p.type === "memory" && p.phase === "watch") { if (p.show < p.seq.length) return {...p, show: p.show + 1}; return {...p, phase: "input"}; }
        if (p.type === "freeze" && p.timer <= 1 && !p.failed) { fire("\uD83E\uDD76 +3%", "success"); baR.current = Math.min(getUpg().maxBatt, baR.current + 3); setBatt(baR.current); return null; }
        if (p.timer <= 1) { ct = p.type; return null; }
        return {...p, timer: p.timer - 1};
      });
      if (ct) { const ms = {wind:"\uD83C\uDFB5",click:"\u23F1\uFE0F",type:"\u2328\uFE0F",wire:"\uD83D\uDCA5",freeze:"\uD83E\uDEE0",memory:"\uD83E\uDDE0",reboot:"\uD83D\uDCE1"}; doScare({t:"emoji",e:ms[ct]||"\uD83D\uDC80",msg:"FAIL",c:"#f0f",sc:5}); baR.current = Math.max(0, baR.current - 12); setBatt(baR.current); if (ct === "reboot") setCamJ(false); evCd.current = 8; }
    }, 1e3);
    return () => clearInterval(i);
  }, [scr, fire, doScare]);

  useEffect(() => {
    if (scr !== "game") return;
    const i = setInterval(() => {
      if (woR.current || siR.current) return;
      const n = nR.current; const df = DF(n); const u = getUpg();
      pR.current += 100 / HS;
      if (pR.current >= 100) { pR.current = 0; hR.current++; setHour(hR.current); if (hR.current >= 6) { completeNight(); setProg(100); return; } }
      setProg(pR.current);
      corrR.current = cl(corrR.current + .15 + n * .05, 0, 100); setCorr(corrR.current);
      const mEvtA = mEvtR.current;
      const drM = (mEvtA && mEvtA.t === "dblDrain") ? 2 : 1;
      const dd = ((drf.current.L ? 0.35 : 0) + (drf.current.R ? 0.35 : 0) + (drf.current.V ? 0.28 : 0)) * u.doorMul + (caR.current ? df.cd * u.camMul : 0);
      baR.current -= (df.bd + dd) * drM;
      if (baR.current <= 0 && !poR.current) { baR.current = 0; poR.current = true; setPOut(true); setDL(false); setDR(false); setDV(false); setCamOn(false); fire("\u26A1 POWER OUT", "error"); }
      setBatt(Math.max(0, baR.current));
      const mMul = (mEvtA && mEvtA.t === "musicDrain") ? 2 : 1;
      if (!poR.current) { mbR.current -= df.td * u.musicMul * mMul; setMb(Math.max(0, mbR.current)); }
      if (!mEvtA && !bsR.current && Math.random() < .008 + n * .002 && hR.current >= 1) {
        const ev = R(MEV);
        if (ev.t === "freeBatt") { baR.current = cl(baR.current + 15, 0, u.maxBatt); setBatt(baR.current); fire("\uD83D\uDCB5 +15%", "success"); }
        else if (ev.t === "forceDoor") { const s = R(["L","R"]); if (s === "L") setDL(false); else setDR(false); setMEvt({...ev, timer: ev.dur, side: s}); fire("\uD83D\uDCC9 CRASH!", "error", 4e3); }
        else if (ev.t === "allOpen") { setDL(false); setDR(false); setDV(false); setMEvt({...ev, timer: ev.dur}); fire("\uD83C\uDFE6 ALL OPEN!", "error", 4e3); }
        else if (ev.t === "camDown") { setCamJ(true); setCamOn(false); setMEvt({...ev, timer: ev.dur}); fire("\u26A1 BREAKER!", "error"); }
        else { setMEvt({...ev, timer: ev.dur}); fire(ev.e + " " + ev.n + "!", "error", 4e3); }
      }
      if (mEvtA && mEvtA.timer > 0) { const ne = {...mEvtA, timer: mEvtA.timer - 1}; if (ne.timer <= 0) { if (ne.t === "camDown") setCamJ(false); setMEvt(null); } else setMEvt(ne); }
      const aN = [...anR.current]; let dU = {...adR.current};
      aN.forEach(a => {
        if (!a.active || a.room === "attacking") return;
        if (a.atDoor > 0) {
          a.atDoor -= 1;
          const side = a.dr || (a._side || "L");
          if (!a.silent && a.atDoor > 0 && a.atDoor % 2 === 0) sKnock();
          if (a.atDoor <= 0) {
            sBang();
            const bl = (side === "L" && drf.current.L) || (side === "R" && drf.current.R) || (side === "V" && drf.current.V);
            if (bl) { a.room = a.s || "stage"; a.cooldown = Math.round(a.moveSpd * 1.5); a.atDoor = 0; dU[side] = null; nBlk.current++; fire("\uD83D\uDEAA Blocked!", "success", 1500); }
            else { a.room = "attacking"; die(a.id); return; }
          }
          return;
        }
        a.cooldown--;
        if (a.cooldown > 0) return;
        if (a.id === "goldie" && caR.current && slR.current === a.room) { a.cooldown = 2; return; }
        if (Math.random() > .55 + n * .03) { a.cooldown = Math.round(a.moveSpd * .5); return; }
        if (a.id === "bear" || a.id === "margin") {
          const paths = a.id === "bear" ? BP : MRP;
          if (!a._cp) { const s = Math.random() > .5 ? "L" : "R"; a._cp = paths[s]; a._side = s; a._pi = 0; }
          if (a._pi < a._cp.length - 2) { a._pi++; a.room = a._cp[a._pi]; a.cooldown = Math.round(a.moveSpd + Math.random() * 2); mk("sine","G1",-20,.06); }
          else if (a._pi < a._cp.length - 1) { a._pi++; a.room = a._cp[a._pi]; const aw = df.aw; a.atDoor = aw; dU[a._side] = a.id; if (!a.silent) sBr(); mk("sine","G1",-20,.06); }
          else { const aw = df.aw; a.atDoor = aw; dU[a._side] = a.id; if (!a.silent) sBr(); }
        } else if (a.id === "ticker") {
          if (a.room !== "vent" && a.atDoor <= 0) { a.room = "vent"; a.cooldown = 10; return; }
          if (a.room === "vent") {
            const sc2 = mbR.current < 20 ? .4 : mbR.current < 40 ? .2 : mbR.current < 60 ? .08 : .02;
            if (Math.random() < sc2) { a.atDoor = df.aw; dU.V = a.id; sBr(); }
            else { a.cooldown = Math.max(3, Math.round(8 * (mbR.current / 100))); }
          }
        } else {
          const path = a._path || a.p; if (!path) return;
          const idx = path.indexOf(a.room);
          if (idx < path.length - 2) { a.room = path[idx + 1]; a.cooldown = Math.round(a.moveSpd + Math.random() * 3); mk("sine","G1",-20,.06); }
          else if (idx < path.length - 1) { a.room = path[idx + 1]; const aw = a.id === "fed" ? df.fw : df.aw; a.atDoor = aw; dU[a.dr] = a.id; if (!a.silent) sBr(); mk("sine","G1",-20,.06); }
          else { a.cooldown = Math.round(a.moveSpd); }
        }
      });
      aN.forEach(a => { if ((a.id === "bear" || a.id === "margin") && a.room === a.s && a._cp) { a._cp = null; a._pi = 0; } });
      anR.current = aN; setAnims([...aN]); adR.current = dU; setAtD({...dU});
      if (n >= 2) { phRef.current--; if (phRef.current <= 0) { phRef.current = Math.round(df.pr + Math.random() * 10); if (caR.current && slR.current && Math.random() < .35) { setPhCam(slR.current); setPhT(3); } } }
      if (n >= 4) {
        const ar = auR.current;
        if (ar.d) {
          ar.t--; auR.current = ar; setAuT(ar.t);
          if (Math.random() < .7) { const hr = ar.d === "L" ? "west_hall" : "east_hall"; setHal(p => ({...p, [hr]: "\uD83D\uDCE1"})); setTimeout(() => setHal(p => { const n2 = {...p}; if (n2[hr] === "\uD83D\uDCE1") delete n2[hr]; return n2; }), 1500); }
          if (ar.t % 2 === 0) sAud();
          const litL2 = lLR.current && ar.d === "L"; const litR2 = lRR.current && ar.d === "R";
          if (litL2 || litR2) { nBlk.current++; fire("\uD83D\uDC41\uFE0F Retreated!", "success", 2e3); auR.current = {d:null,t:0}; setAuD(null); }
          else if (ar.t <= 0) {
            const bl = (ar.d === "L" && drf.current.L) || (ar.d === "R" && drf.current.R);
            if (!bl) { die("auditor"); return; } else { nBlk.current++; fire("\uD83D\uDEAA Blocked!", "success"); }
            auR.current = {d:null,t:0}; setAuD(null);
          }
        } else if (Math.random() < 1 / df.ar) {
          const sd = Math.random() > .5 ? "L" : "R";
          auR.current = {d: sd, t: Math.round(df.awn)}; setAuD(sd); setAuT(Math.round(df.awn)); sAud();
        }
      }
      if (n >= 5 && !shadowOn && Math.random() < .005) {
        setShadowOn(true);
        if (caR.current && slR.current) {
          fire("\uD83D\uDC64 SHADOW!", "error", 2e3);
          setTimeout(() => {
            if (caR.current && slR.current) { doScare({t:"face",eyes:"#000",msg:"",teeth:false}, "shadow"); baR.current = Math.max(0, baR.current - 30); setBatt(baR.current); }
            else { fire("\uD83D\uDC64 Survived! +20\uD83E\uDE99", "success", 3e3); setCoins(p => p + 20); }
            setShadowOn(false);
          }, 1200);
        } else setShadowOn(false);
      }
      if (Math.random() < df.hc) { const rc = R(CI); setHal(p => ({...p, [rc]: R(["\uD83D\uDC7B","\uD83E\uDD47","\uD83D\uDCC8","\uD83D\uDCC9","\uD83D\uDC41\uFE0F"])})); setTimeout(() => setHal(p => { const n2 = {...p}; delete n2[rc]; return n2; }), 3e3); }
      if (!camJ && !bsR.current && Math.random() < .004 + n * .0008) { setCamJ(true); setTimeout(() => setCamJ(false), 1200 + Math.min(n * 80, 2400)); }
      evR.current--;
      if (evCd.current > 0) evCd.current--;
      if (evR.current <= 0 && !bsR.current && evCd.current <= 0) { evR.current = Math.round(df.er + Math.random() * df.er * .4); evCd.current = 0; spawnEvt(); }
      const r = Math.random(); const base = bsR.current ? Math.max(.02, n >= 7 ? n * .01 : n * .006) : Math.max(.08, n >= 7 ? n * .04 : n * .025);
      if (r < base * .12) { setGli(true); sG(); setTimeout(() => setGli(false), 300); }
      else if (r < base * .2) { setTGl(true); setTimeout(() => setTGl(false), 250); }
      else if (r < base * .35) fire(R(CREEPY), "error", 3500);
      else if (r < base * .44) { setShk(true); setTimeout(() => setShk(false), 400 + n * 80); }
      else if (r < base * .48 && n >= 2) { setInv(true); setTimeout(() => setInv(false), 150); }
      else if (r < base * .52 && n >= 2) sH();
      else if (r < base * .56 && n >= 3 && !crR.current && !bsR.current) { crR.current = true; sE(); setCrash({pct:0,msg:R(["FATAL: camera_corrupted","kernel panic: DOOR_FAIL","ERR: battery_anomaly"])}); const ci = setInterval(() => setCrash(p => { if (!p || p.pct >= 100) { clearInterval(ci); crR.current = false; return null; } return {...p, pct: p.pct + Math.floor(Math.random() * 18) + 5}; }), 350); setTimeout(() => { clearInterval(ci); setCrash(null); crR.current = false; }, 4500); }
    }, 1e3);
    return () => clearInterval(i);
  }, [scr, completeNight, die, spawnEvt, fire, doScare, sv]);

  useEffect(() => {
    if (!phCam || scr !== "game") return;
    const i = setInterval(() => {
      setPhT(p => { if (p <= 1) { if (caR.current && slR.current === phCam) { doScare(R(SC.phantom), "phantom"); baR.current = Math.max(0, baR.current - 15); setBatt(baR.current); } setPhCam(null); return 0; } return p - 1; });
    }, 1e3);
    return () => clearInterval(i);
  }, [phCam, scr, doScare]);

  const aInR = rm => anims.filter(a => a.active && a.room === rm);
  const bc = batt > 50 ? G.green : batt > 20 ? "#f59e0b" : G.red;
  const dDng = s => atD[s] != null || auD === s;
  const corrStyle = corr > 20 ? {filter: `hue-rotate(${Math.min(corr * .3, 25)}deg) saturate(${1 + corr * .005})`} : {};

  const CDoor = ({side, label, icon, closed, color}) => {
    const locked = (mEvt && mEvt.t === "forceDoor" && mEvt.side === side) || (mEvt && mEvt.t === "allOpen");
    const threat = dDng(side);
    const litNow = (side === "L" && lL) || (side === "R" && lR);
    const cdNow = (side === "L" && lCdL) || (side === "R" && lCdR);
    return (
      <div style={{background:`linear-gradient(180deg,${G.card},${G.bg2})`,borderRadius:12,border:`2px solid ${closed ? color+"80" : "#ffffff08"}`,overflow:"hidden",position:"relative",boxShadow:closed ? `0 0 12px ${color}15` : "none"}}>
        <div onClick={() => { if (locked) { fire("\uD83D\uDCC9 Locked!", "error"); return; } tDoor(side); }} style={{padding:"10px 4px 6px",textAlign:"center",cursor:poR.current ? "not-allowed" : "pointer",opacity:poR.current && !closed ? .3 : 1,position:"relative",zIndex:1}}>
          <div style={{fontSize:26,marginBottom:1,filter:closed ? `drop-shadow(0 0 8px ${color})` : "none"}}>{closed ? "\uD83D\uDD12" : icon}</div>
          <div style={{fontSize:10,fontWeight:800,color:closed ? color : poR.current ? "#333" : G.txt,letterSpacing:2}}>{closed ? "SHUT" : poR.current ? "DEAD" : label}</div>
        </div>
        {side !== "V" && (
          <div onClick={() => flash(side)} style={{borderTop:`1px solid ${G.dim}20`,padding:"6px",textAlign:"center",cursor:cdNow ? "not-allowed" : "pointer",background:litNow ? "#ffffff08" : "#ffffff02",position:"relative",zIndex:1,opacity:cdNow ? .3 : 1}}>
            {litNow ? (
              <div style={{fontSize:22,filter:"drop-shadow(0 0 10px #fff)",animation:"cPulse .3s infinite"}}>{threat ? (anims.find(a => a.id === atD[side])?.e || (auD === side ? "\uD83D\uDC41\uFE0F" : "\u2705")) : "\u2705"}</div>
            ) : (
              <div style={{fontSize:11,color:cdNow ? G.dim : "#f59e0b",fontWeight:700}}>{cdNow ? "\u23F3" : "\uD83D\uDCA1 LIGHT"}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const Bar = ({value, max, color, icon, children, compact}) => (
    <div style={{display:"flex",alignItems:"center",gap:compact ? 4 : 6,flex:1}}>
      <span style={{fontSize:compact ? 11 : 13,filter:value < 30 ? `drop-shadow(0 0 4px ${color})` : "none"}}>{icon}</span>
      <div style={{flex:1,height:compact ? 16 : 20,background:G.bg,borderRadius:8,overflow:"hidden",position:"relative",border:`1px solid ${color}15`}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${color}30,${color})`,width:Math.max(0, value / max * 100) + "%",transition:"width .5s",borderRadius:8}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact ? 9 : 11,fontWeight:800,color:"#fff",textShadow:"0 1px 3px #000"}}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:G.bg,color:G.txt,fontFamily:"'Courier New',monospace",fontSize:16,position:"relative",animation:shk ? "cShake .06s infinite" : "none",overflow:"hidden",...corrStyle}}>
      <style>{`@keyframes cShake{0%,100%{transform:translate(0)}25%{transform:translate(-4px,3px)}50%{transform:translate(3px,-4px)}75%{transform:translate(-3px,4px)}}@keyframes cFlicker{0%,100%{opacity:1}42%{opacity:.1}44%{opacity:.3}45%{opacity:1}}@keyframes cZoom{0%{transform:scale(3);opacity:0}15%{transform:scale(1);opacity:1}}@keyframes cPulse{0%,100%{opacity:.7}50%{opacity:1}}@keyframes bloodDrip{0%{transform:translateY(-80px)}100%{transform:translateY(105vh)}}@keyframes titleGlow{0%,100%{text-shadow:0 0 10px #ffd70040}50%{text-shadow:0 0 30px #ffd70080}}@keyframes camPulse{0%,100%{box-shadow:0 0 0 0 #a855f700}50%{box-shadow:0 0 0 4px #a855f730}}@keyframes scanMove{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}@keyframes staticNoise{0%{background-position:0 0}100%{background-position:100% 100%}}@keyframes camSlide{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ffffff15;border-radius:4px}`}</style>

      {scare && <div style={{position:"fixed",inset:0,zIndex:9999,background:"radial-gradient(circle at 50% 40%,#1a0000,#000)",animation:"cShake .04s infinite"}}><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"cZoom .25s ease-out forwards"}}>{scare.t === "emoji" && <><div style={{fontSize:(scare.sc||4)*42,lineHeight:1,filter:`drop-shadow(0 0 40px ${scare.c})`,marginBottom:12}}>{scare.e}</div><div style={{fontSize:38+night*7,fontWeight:900,color:scare.c,textShadow:`0 0 30px ${scare.c}`,letterSpacing:6}}>{scare.msg}</div></>}{scare.t === "glitch" && <div style={{fontSize:55+night*10,fontWeight:900,color:scare.c,textShadow:`0 0 20px ${scare.c},4px 0 #f008,-4px 0 #0f08`,letterSpacing:8}}>{scare.msg}</div>}{scare.t === "face" && <><div style={{display:"flex",gap:50,marginBottom:15}}>{[0,1].map(i => (<div key={i} style={{width:55+night*8,height:33+night*5,borderRadius:"50%",background:`radial-gradient(ellipse,#fff 15%,${scare.eyes} 40%,transparent 75%)`,boxShadow:`0 0 ${35+night*12}px ${scare.eyes}`}}/>))}</div>{scare.eyes !== "#000" && <div style={{display:"flex",gap:2,marginBottom:15}}>{[...Array(10)].map((_, i) => (<div key={i} style={{width:0,height:0,borderLeft:(5+night)+"px solid transparent",borderRight:(5+night)+"px solid transparent",borderTop:(16+night*3)+"px solid "+scare.eyes}}/>))}</div>}{scare.msg && <div style={{fontSize:40+night*10,fontWeight:900,color:scare.eyes,textShadow:`0 0 30px ${scare.eyes}`}}>{scare.msg}</div>}</>}</div></div>}
      {crash && <div style={{position:"fixed",inset:0,zIndex:8e3,background:"#0000aa",color:"#fff",padding:"40px",display:"flex",flexDirection:"column",justifyContent:"center"}}><div style={{fontSize:28,marginBottom:20}}>:( FATAL ERROR</div><div style={{fontSize:15,lineHeight:2}}>{crash.msg}<br/>{Math.min(crash.pct,99)}%</div></div>}
      {gli && <div style={{position:"fixed",inset:0,zIndex:500,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,0,0,.04) 2px,rgba(255,0,0,.04) 4px)"}}/>}
      {inv && <div style={{position:"fixed",inset:0,zIndex:95,pointerEvents:"none",background:"#fff",mixBlendMode:"difference",opacity:.85}}/>}
      {bko && <div style={{position:"fixed",inset:0,zIndex:700,background:"#000",pointerEvents:"none",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:40}}><div style={{fontSize:11,color:"#ffffff08",letterSpacing:4,animation:"cPulse 2s infinite"}}>controls still active</div></div>}
      {scr === "game" && <><div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:94,boxShadow:`inset 0 0 ${80+night*14+corr*.6}px rgba(${60+corr*.5},0,0,${Math.min(.4,.06+night*.02+corr*.002)})`}}/><div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:93,opacity:.04,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.02) 2px,rgba(255,255,255,.02) 4px)"}}/>{night >= 5 && [...Array(Math.min(10,Math.floor((night-5)*1.2)))].map((_, i) => (<div key={"b"+i} style={{position:"fixed",top:0,left:(5+i*9)+"%",width:1.5,height:25+(i%5)*12,background:"linear-gradient(180deg,transparent,#5a0000 20%,#8b0000 60%,#ff000088 90%,transparent)",zIndex:92,pointerEvents:"none",animation:`bloodDrip ${10+(i%4)*3}s linear infinite`,animationDelay:`-${i*2}s`,opacity:.35}}/>))}</>}
      {toast && <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:200,background:G.card+"f0",backdropFilter:"blur(8px)",border:"1px solid "+(toast.t === "success" ? G.green+"40" : toast.t === "error" ? G.red+"40" : G.purple+"40"),color:toast.t === "success" ? G.green : toast.t === "error" ? G.red : G.purple,borderRadius:12,padding:"12px 28px",fontSize:15,fontWeight:600,maxWidth:"90vw",textAlign:"center"}}>{toast.m}</div>}
      {chal && chal.type === "freeze" && !chal.failed && <><div style={{position:"fixed",inset:0,zIndex:598,pointerEvents:"none",background:"rgba(0,60,140,.25)",border:"4px solid rgba(0,200,255,.15)",boxSizing:"border-box"}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:600,pointerEvents:"none",textAlign:"center"}}><div style={{fontSize:48,marginBottom:8}}>{"\uD83E\uDD76"}</div><div style={{fontSize:22,color:"rgba(0,200,255,.6)",fontWeight:900,letterSpacing:8,textShadow:"0 0 20px rgba(0,200,255,.3)"}}>FREEZE</div><div style={{fontSize:14,color:"rgba(0,200,255,.35)",marginTop:6}}>DON'T TAP ANYTHING</div><div style={{fontSize:32,color:"rgba(0,200,255,.5)",fontWeight:900,marginTop:8}}>{chal.timer}s</div></div><div onClick={() => { doScare({t:"emoji",e:"\uD83E\uDEE0",msg:"MOVED",c:"#0ff",sc:5}); baR.current = Math.max(0, baR.current - 15); setBatt(baR.current); setChal(null); }} style={{position:"fixed",inset:0,zIndex:601,cursor:"default"}}/></>}
      {phoneShow && scr === "game" && <div onClick={() => setPhoneShow(false)} style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:100,background:G.card+"f0",backdropFilter:"blur(10px)",border:`1px solid ${G.gold}30`,borderRadius:10,padding:"10px 14px",maxWidth:380,width:"90%",cursor:"pointer"}}><div style={{fontSize:11,color:G.gold,letterSpacing:3,marginBottom:4}}>{"\uD83D\uDCDE"} PHONE GUY</div><div style={{fontSize:12,color:G.brt,lineHeight:1.5}}>{PHONE[Math.min(night-1,PHONE.length-1)]}</div><div style={{fontSize:9,color:G.sub,marginTop:4}}>tap to dismiss</div></div>}

      {scr === "menu" && <div style={{maxWidth:520,margin:"0 auto",padding:"20px 16px",minHeight:"100vh"}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:20}}>
          <div style={{fontSize:14,color:G.red+"60",letterSpacing:12}}>FIVE NIGHTS AT</div>
          <div style={{fontSize:48,fontWeight:900,color:G.gold,letterSpacing:8,animation:"titleGlow 3s ease-in-out infinite"}}>GOLD'S</div>
          <div style={{fontSize:12,color:G.red+"40",letterSpacing:5,marginTop:6}}>12 ROOMS {"\u00B7"} 9 ANIMATRONICS</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,padding:"6px 18px",background:G.gold+"10",borderRadius:20,border:`1px solid ${G.gold}20`}}><span style={{fontSize:16}}>{"\uD83E\uDE99"}</span><span style={{fontSize:18,fontWeight:900,color:G.gold}}>{coins}</span></div>
        </div>
        <div style={{display:"flex",gap:2,marginBottom:16,background:G.bg2,borderRadius:12,padding:3,border:`1px solid ${G.dim}30`}}>{[["play","\u25B6 PLAY"],["shop","\uD83D\uDED2 SHOP"],["guide","\uD83C\uDFAD GUIDE"],["custom","\uD83C\uDFAE CUSTOM"],["stats","\uD83D\uDCCA STATS"]].map(([k, l]) => (<div key={k} onClick={() => setTab(k)} style={{flex:1,textAlign:"center",padding:"11px 0",fontSize:11,fontWeight:tab === k ? 800 : 500,color:tab === k ? G.gold : G.sub,background:tab === k ? G.gold+"10" : "transparent",borderRadius:10,cursor:"pointer",letterSpacing:1}}>{l}</div>))}</div>

        {tab === "play" && <>
          <div style={{display:"flex",gap:8,marginBottom:14}}>{[["normal","NORMAL",5,G.green],["nightmare","NIGHTMARE",12,G.red],["infinite","INFINITE",50,G.purple]].map(([k, l, mx, c]) => (<div key={k} onClick={() => { setMode(k); mR.current = k; setNight(1); }} style={{flex:1,padding:"14px 6px",background:mode === k ? c+"12" : c+"06",border:`2px solid ${mode === k ? c+"60" : c+"20"}`,borderRadius:12,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:17,fontWeight:900,color:mode === k ? c : c+"70",letterSpacing:2}}>{l}</div><div style={{fontSize:10,color:c+"50"}}>{mx}N</div>{best[k] && <div style={{fontSize:9,color:G.gold}}>Best:N{best[k]}</div>}</div>))}</div>
          <div style={{marginBottom:14}}><div style={{fontSize:10,color:G.sub,letterSpacing:3,marginBottom:8,textAlign:"center"}}>SELECT NIGHT</div><div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>{Array.from({length: MM[mode] || 5}, (_, i) => i + 1).map(n => { const c = mode === "normal" ? G.green : mode === "nightmare" ? G.red : G.purple; return (<div key={n} onClick={() => { setNight(n); nR.current = n; }} style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:night === n ? 16 : 12,fontWeight:700,cursor:"pointer",background:night === n ? c+"20" : G.bg2,color:night === n ? c : n >= 7 ? G.red+"60" : G.sub,border:`2px solid ${night === n ? c+"60" : G.dim+"30"}`}}>{n}</div>); })}</div></div>
          <div onClick={() => startGame(mode, night)} style={{padding:"16px 0",borderRadius:14,textAlign:"center",cursor:"pointer",background:`linear-gradient(135deg,${mode === "normal" ? G.green : mode === "nightmare" ? G.red : G.purple},${(mode === "normal" ? G.green : mode === "nightmare" ? G.red : G.purple)+"80"})`,color:"#000",fontSize:20,fontWeight:900,letterSpacing:4}}>START NIGHT {night}</div>
        </>}

        {tab === "shop" && <div>{SHOP.map(it => { const lv = upg[it.id] || 0; const maxed = lv >= it.mx; const cost = maxed ? 0 : it.cost[lv]; const canBuy = coins >= cost && !maxed; return (<div key={it.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:`linear-gradient(135deg,${G.card},${G.bg2})`,borderRadius:12,marginBottom:8,border:`1px solid ${maxed ? G.green+"20" : G.dim+"20"}`}}><div style={{fontSize:30}}>{it.icon}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:maxed ? G.green : G.brt}}>{it.n}</div><div style={{fontSize:11,color:G.sub}}>{it.d}</div><div style={{display:"flex",gap:4,marginTop:6}}>{Array.from({length:it.mx}).map((_, i) => (<div key={i} style={{width:24,height:5,borderRadius:3,background:i < lv ? G.gold : G.dim+"30"}}/>))}</div></div><div onClick={() => canBuy && buyUpg(it.id)} style={{padding:"10px 18px",borderRadius:10,fontSize:14,fontWeight:700,cursor:canBuy ? "pointer" : "not-allowed",background:maxed ? G.green+"15" : canBuy ? G.gold+"15" : G.dim+"10",color:maxed ? G.green : canBuy ? G.gold : G.sub,border:`1px solid ${maxed ? G.green+"30" : canBuy ? G.gold+"30" : G.dim+"20"}`}}>{maxed ? "MAX" : "\uD83E\uDE99" + cost}</div></div>); })}</div>}

        {tab === "guide" && <div>
          <div style={{fontSize:10,color:G.sub,letterSpacing:3,marginBottom:10,textAlign:"center"}}>KNOW YOUR ENEMY</div>
          {AD.map(a => {
            const sideColor = a.dr === "L" ? "#f97316" : a.dr === "R" ? "#3b82f6" : a.dr === "V" ? "#a855f7" : "#ef4444";
            const sideLabel = a.dr === "L" ? "LEFT" : a.dr === "R" ? "RIGHT" : a.dr === "V" ? "VENT" : a.id === "bear" || a.id === "margin" ? "RANDOM" : a.sp === "phantom" ? "CAMERA" : a.sp === "auditor" ? "INVISIBLE" : "?";
            return (<div key={a.id} style={{padding:"12px 14px",background:`linear-gradient(135deg,${G.card},${G.bg2})`,borderRadius:12,marginBottom:8,border:`1px solid ${sideColor}15`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{fontSize:32,filter:`drop-shadow(0 0 8px ${sideColor}40)`}}>{a.e}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15,fontWeight:900,color:G.brt,letterSpacing:2}}>{a.n}</span><span style={{fontSize:9,fontWeight:800,color:sideColor,background:sideColor+"15",padding:"2px 8px",borderRadius:4,letterSpacing:1}}>{sideLabel}</span></div>
                  <div style={{fontSize:10,color:G.sub,marginTop:2}}>Active from Night {a.ni}</div>
                </div>
                {a.silent && <div style={{fontSize:9,fontWeight:800,color:G.red,background:G.red+"12",padding:"3px 8px",borderRadius:4,letterSpacing:1}}>SILENT</div>}
              </div>
              <div style={{fontSize:12,color:G.txt,lineHeight:1.6,marginBottom:6}}>{a.d}</div>
              {a.p && <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><span style={{fontSize:9,color:G.sub,fontWeight:700}}>PATH:</span>{a.p.map((r,i) => (<span key={i} style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:sideColor+"90",background:sideColor+"08",padding:"2px 6px",borderRadius:4}}>{ROOMS[r]?.n || r}</span>{i < a.p.length - 1 && <span style={{fontSize:8,color:G.dim}}>{"\u2192"}</span>}</span>))}</div>}
              {a.id === "bear" && <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",marginTop:4}}><span style={{fontSize:9,color:G.sub,fontWeight:700}}>PATHS:</span><span style={{fontSize:9,color:"#f97316",background:"#f9731608",padding:"2px 6px",borderRadius:4}}>L: Vault{"\u2192"}Archive{"\u2192"}Bull Pen{"\u2192"}Kitchen{"\u2192"}Short Corr.</span><span style={{fontSize:9,color:"#3b82f6",background:"#3b82f608",padding:"2px 6px",borderRadius:4}}>R: Vault{"\u2192"}Archive{"\u2192"}Server{"\u2192"}Long Corr.</span></div>}
              {a.id === "margin" && <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",marginTop:4}}><span style={{fontSize:9,color:G.sub,fontWeight:700}}>PATHS:</span><span style={{fontSize:9,color:"#f97316",background:"#f9731608",padding:"2px 6px",borderRadius:4}}>L: Floor{"\u2192"}Storage{"\u2192"}Kitchen{"\u2192"}Short Corr.</span><span style={{fontSize:9,color:"#3b82f6",background:"#3b82f608",padding:"2px 6px",borderRadius:4}}>R: Floor{"\u2192"}Break Room{"\u2192"}Long Corr.</span></div>}
            </div>);
          })}
        </div>}

        {tab === "custom" && <div>
          <div style={{fontSize:11,color:G.sub,letterSpacing:3,marginBottom:12,textAlign:"center"}}>AGGRESSION 0-20</div>
          {AD.map(a => { const v = cLvl[a.id] || 0; return (<div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:G.card,borderRadius:10,marginBottom:6,border:`1px solid ${a.sp ? G.purple+"20" : G.dim+"15"}`}}><span style={{fontSize:22}}>{a.e}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:a.sp ? G.purple : G.brt}}>{a.n}</div></div><div onClick={() => setCLvl(p => ({...p,[a.id]:Math.max(0,v-1)}))} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",background:G.red+"10",color:G.red,fontWeight:900}}>{"\u2212"}</div><div style={{width:36,textAlign:"center",fontSize:17,fontWeight:900,color:v >= 15 ? G.red : v >= 10 ? "#f59e0b" : G.brt}}>{v}</div><div onClick={() => setCLvl(p => ({...p,[a.id]:Math.min(20,v+1)}))} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",background:G.green+"10",color:G.green,fontWeight:900}}>+</div></div>); })}
          <div style={{textAlign:"center",margin:"12px 0"}}><span style={{fontSize:16,color:G.gold,fontWeight:800}}>Total: {Object.values(cLvl).reduce((a, b) => a + b, 0)}</span></div>
          <div onClick={() => startGame("custom", 1)} style={{padding:"14px",borderRadius:12,textAlign:"center",cursor:"pointer",background:`linear-gradient(135deg,${G.purple},${G.purple}80)`,color:"#000",fontSize:18,fontWeight:900,letterSpacing:3}}>START CUSTOM</div>
        </div>}

        {tab === "stats" && <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>{[["Survived",stats.won,G.green],["Deaths",stats.died,G.red],["Blocks",stats.blocks,G.gold],["Cams",stats.cams,G.purple]].map(([l, v, c]) => (<div key={l} style={{padding:14,background:`linear-gradient(135deg,${G.card},${G.bg2})`,borderRadius:12,textAlign:"center",border:`1px solid ${c}15`}}><div style={{fontSize:26,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:10,color:G.sub,letterSpacing:2}}>{l}</div></div>))}</div>
          <div style={{fontSize:10,color:G.sub,letterSpacing:3,marginBottom:10}}>ACHIEVEMENTS ({achv.length}/{ACH.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{ACH.map(a => { const has = achv.includes(a.id); return (<div key={a.id} style={{padding:"10px 12px",background:has ? G.gold+"08" : G.card,borderRadius:10,border:`1px solid ${has ? G.gold+"25" : G.dim+"15"}`,opacity:has ? 1 : .4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:20}}>{has ? a.i : "\uD83D\uDD12"}</span><div><div style={{fontSize:12,fontWeight:700,color:has ? G.gold : G.sub}}>{a.n}</div><div style={{fontSize:9,color:G.sub}}>{a.d}</div></div></div></div>); })}</div>
        </div>}

        <div style={{marginTop:20,textAlign:"center",display:"flex",justifyContent:"center",gap:16}}>
          <span onClick={() => setShowTut(true)} style={{fontSize:14,color:G.gold,cursor:"pointer"}}>{"\u2753"} HELP</span>
          <span onClick={() => setMuted(!muted)} style={{fontSize:14,color:G.sub,cursor:"pointer"}}>{muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</span>
        </div>
      </div>}

      {showTut && <div style={{position:"fixed",inset:0,zIndex:300,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={() => setShowTut(false)}>
        <div onClick={e => e.stopPropagation()} style={{background:G.bg,border:`1px solid ${G.gold}30`,borderRadius:16,padding:"20px 24px",maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:22,fontWeight:900,color:G.gold,letterSpacing:4}}>HOW TO PLAY</div></div>
          {[["\uD83D\uDCF9","CAMERAS","Toggle cameras ON. Tap rooms to switch. \u25C0\u25B6 arrows or bottom bar to cycle rooms."],["\uD83D\uDEAA","DOORS","3 doors: LEFT, RIGHT, VENT. Close to block. Drains battery while closed."],["\uD83D\uDCA1","LIGHTS","Flash to check door. 3.5s cooldown. Reveals what's outside. Only way to see Auditor."],["\uD83D\uDC42","AUDIO CUES","LOUD animatronics (Bull, Bear, Ticker, Margin) KNOCK at your door. SILENT ones (Goldie, Broker, Fed) give no warning."],["\uD83D\uDD14","MUSIC BOX","Drains over time. Wind it (+3%, 3s cooldown). Low box = Ticker attacks from Pipeline."],["\u26A1","BATTERY","Everything costs power. Zero = doors open, cameras off, defenseless."],["\uD83C\uDFAD","ATTACKS","Animatronics arrive \u2192 wait \u2192 STRIKE. Close the door before the strike!"],["\uD83D\uDC41\uFE0F","SPECIALS","PHANTOM \uD83D\uDD6F\uFE0F \u2014 look away. AUDITOR \uD83D\uDC41\uFE0F \u2014 flash light. SHADOW \uD83D\uDC64 \u2014 switch cameras."]].map(([icon, title, desc], i) => (<div key={i} style={{marginBottom:10,padding:"10px 12px",background:G.card,borderRadius:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:18}}>{icon}</span><span style={{fontSize:14,fontWeight:800,color:G.gold,letterSpacing:2}}>{title}</span></div><div style={{fontSize:12,color:G.txt,lineHeight:1.6}}>{desc}</div></div>))}
          <div onClick={() => setShowTut(false)} style={{textAlign:"center",marginTop:10}}><span style={{padding:"10px 28px",background:G.gold+"15",borderRadius:10,fontSize:14,fontWeight:800,color:G.gold,cursor:"pointer",border:`1px solid ${G.gold}30`}}>GOT IT</span></div>
        </div>
      </div>}

      {scr === "game" && <div style={{maxWidth:640,margin:"0 auto",position:"relative",zIndex:10,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{padding:"8px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:G.red,animation:"cFlicker 1.5s infinite"}}/><span style={{fontSize:16,fontWeight:900,color:tGl ? G.red : G.gold,letterSpacing:3}}>{tGl ? R(TGL) : "FNAG"}</span><span style={{fontSize:10,color:G.red,background:G.red+"12",padding:"2px 8px",borderRadius:5,fontWeight:800}}>N{night}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div onClick={() => setMuted(!muted)} style={{fontSize:13,cursor:"pointer",opacity:.4}}>{muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</div><span style={{fontSize:20,fontWeight:900,color:G.gold,textShadow:`0 0 12px ${G.gold}40`}}>{HL[hour]}</span></div>
        </div>
        <div style={{height:3,background:G.dim+"20",borderRadius:3,margin:"0 16px 4px",overflow:"hidden",flexShrink:0}}><div style={{height:"100%",background:`linear-gradient(90deg,${G.red},${G.gold})`,width:((hour*100/6)+(prog/6))+"%",transition:"width 1s linear",borderRadius:3}}/></div>
        <div style={{display:"flex",gap:6,padding:"0 16px 4px",flexShrink:0}}>
          <Bar value={batt} max={getUpg().maxBatt} color={bc} icon={"\u26A1"} compact>{pOut ? "DEAD" : Math.round(batt)}</Bar>
          <Bar value={mb} max={100} color={mb < 30 ? G.red : G.purple} icon={"\uD83D\uDD14"} compact>{Math.round(mb)}%</Bar>
          <div onClick={wind} style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:800,cursor:pOut || windCd ? "not-allowed" : "pointer",background:windCd ? "#ffffff06" : mb < 30 ? G.red+"12" : G.purple+"10",color:windCd ? G.dim : mb < 30 ? G.red : G.purple,border:`1px solid ${windCd ? G.dim+"20" : mb < 30 ? G.red+"30" : G.purple+"25"}`,alignSelf:"center",minWidth:42,textAlign:"center",opacity:windCd ? .4 : 1}}>{windCd ? windTimer + "s" : "WIND"}</div>
        </div>
        {mEvt && <div style={{padding:"4px 16px",flexShrink:0}}><div style={{padding:"4px 12px",background:G.red+"08",borderRadius:6,display:"flex",justifyContent:"space-between",border:`1px solid ${G.red}20`}}><span style={{fontSize:11,fontWeight:700,color:G.red}}>{mEvt.e} {mEvt.n}</span><span style={{fontSize:10,color:G.sub}}>{mEvt.timer}s</span></div></div>}

        {camOn ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 16px",overflow:"hidden"}}>
            <div style={{flex:1,borderRadius:14,overflow:"hidden",border:`2px solid ${G.purple}25`,position:"relative",minHeight:200,marginBottom:6}}>
              <div style={{position:"absolute",inset:0,zIndex:5,pointerEvents:"none",opacity:.06,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.08) 2px,rgba(255,255,255,.08) 4px)"}}/>
              <div style={{position:"absolute",inset:0,zIndex:6,pointerEvents:"none",overflow:"hidden"}}><div style={{width:"100%",height:"200%",background:"linear-gradient(180deg,transparent 40%,rgba(168,85,247,.04) 50%,transparent 60%)",animation:"scanMove 4s linear infinite"}}/></div>
              {camTrans && <div style={{position:"absolute",inset:0,zIndex:20,background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:"100%",height:"100%",opacity:.4,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",backgroundSize:"150px",animation:"staticNoise .1s steps(5) infinite"}}/><div style={{position:"absolute",fontSize:14,color:G.purple+"40",fontWeight:900,letterSpacing:6}}>SWITCHING</div></div>}
              {camJ && !camTrans && <div style={{position:"absolute",inset:0,zIndex:15,background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:40,marginBottom:8,animation:"cFlicker 1s infinite"}}>{"\uD83D\uDCE1"}</div><div style={{fontSize:16,color:G.red+"60",fontWeight:900,letterSpacing:4}}>SIGNAL LOST</div></div>}

              {sel && !camJ && !camTrans && (() => {
                const rv = RV[sel]; const rm = ROOMS[sel]; const here = aInR(sel); const hF = hal[sel]; const isP = phCam === sel;
                return (
                  <div style={{position:"absolute",inset:0,background:rv ? rv.bg : G.card,display:"flex",flexDirection:"column",animation:"camSlide .25s ease-out"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 0",position:"relative",zIndex:2}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div onClick={(e)=>{e.stopPropagation();setSel(null);sMap();}} style={{padding:"5px 10px",borderRadius:6,background:G.purple+"12",border:`1px solid ${G.purple}30`,cursor:"pointer",fontSize:10,fontWeight:800,color:G.purple,letterSpacing:1}}>{"\u2190"} MAP</div>
                        <div><div style={{fontSize:16,fontWeight:900,color:G.purple,letterSpacing:3}}>{rm.n}</div><div style={{fontSize:9,color:G.purple+"50",letterSpacing:2,marginTop:2}}>CAM {String(CI.indexOf(sel)+1).padStart(2,"0")}</div></div>
                      </div>
                      <div style={{fontSize:10,color:G.red+"50",animation:"cFlicker 2s infinite"}}>{"\u25CF"} REC</div>
                    </div>
                    <div onClick={prevRoom} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",zIndex:10,padding:"20px 8px",cursor:"pointer",fontSize:20,color:G.purple+"60",background:"linear-gradient(90deg,#00000040,transparent)"}}>{"\u25C0"}</div>
                    <div onClick={nextRoom} style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",zIndex:10,padding:"20px 8px",cursor:"pointer",fontSize:20,color:G.purple+"60",background:"linear-gradient(270deg,#00000040,transparent)"}}>{"\u25B6"}</div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",zIndex:2,padding:"8px 20px"}}>
                      <div style={{display:"flex",justifyContent:"space-around",width:"100%",fontSize:28,opacity:.15,marginBottom:8}}>{(rv ? rv.dec : []).map((e, i) => (<span key={i}>{e}</span>))}</div>
                      {here.length > 0 && <div style={{width:"100%",marginBottom:8}}>
                        {here.some(a => a.atDoor > 0) && <div style={{textAlign:"center",padding:"6px 0",background:G.red+"10",borderRadius:8,marginBottom:8,border:`1px solid ${G.red}20`}}><div style={{fontSize:11,fontWeight:900,color:G.red,letterSpacing:2}}>{"\u26A0"} STRIKES IN</div><div style={{fontSize:32,fontWeight:900,color:G.red,fontFamily:"monospace"}}>{Math.ceil(Math.min(...here.filter(a => a.atDoor > 0).map(a => a.atDoor)))}s</div></div>}
                        <div style={{display:"flex",justifyContent:"center",gap:28,padding:"12px 0",background:"#00000030",borderRadius:12}}>{here.map(a => (<div key={a.id} style={{textAlign:"center"}}><div style={{fontSize:52,filter:`drop-shadow(0 0 ${a.atDoor > 0 ? 30 : 18}px ${G.red})`,animation:a.atDoor > 0 ? "cShake .12s infinite" : "cPulse 1.5s infinite"}}>{a.e}</div><div style={{fontSize:11,fontWeight:800,color:G.red,marginTop:4}}>{a.n}</div></div>))}</div>
                      </div>}
                      {isP && <div style={{textAlign:"center",padding:12,background:"#a855f708",borderRadius:10,marginBottom:6,width:"100%"}}><div style={{fontSize:44,animation:"cFlicker .5s infinite"}}>{"\uD83D\uDD6F\uFE0F"}</div><div style={{fontSize:13,color:G.purple,fontWeight:800,marginTop:4}}>PHANTOM {"\u2014"} LOOK AWAY! ({phT}s)</div></div>}
                      {shadowOn && <div style={{textAlign:"center",padding:12,background:"#00000050",borderRadius:10,marginBottom:6,width:"100%"}}><div style={{fontSize:44,animation:"cFlicker .3s infinite"}}>{"\uD83D\uDC64"}</div><div style={{fontSize:13,color:G.sub,marginTop:4}}>SHADOW {"\u2014"} SWITCH NOW!</div></div>}
                      {hF && !here.length && <div style={{fontSize:32,opacity:.2,animation:"cFlicker 1.5s infinite"}}>{hF}</div>}
                      {!here.length && !isP && !shadowOn && !hF && <div style={{fontSize:12,color:G.green+"40",letterSpacing:4}}>{"\u2713"} CLEAR</div>}
                    </div>
                    <div style={{padding:"0 16px 4px",position:"relative",zIndex:2}}><div style={{fontSize:10,color:"#ffffff10",fontStyle:"italic",textAlign:"center"}}>{rv ? rv.atm[night % rv.atm.length] : ""}</div></div>
                    <div style={{display:"flex",gap:6,padding:"0 12px 10px",position:"relative",zIndex:2}}>
                      <div onClick={prevRoom} style={{flex:1,padding:"9px 0",borderRadius:8,textAlign:"center",cursor:"pointer",background:"#ffffff06",border:"1px solid #ffffff0a",fontSize:11,fontWeight:800,color:G.purple+"80",letterSpacing:1}}>{"\u25C0"} PREV</div>
                      <div onClick={(e)=>{e.stopPropagation();setSel(null);sMap();}} style={{flex:1.3,padding:"9px 0",borderRadius:8,textAlign:"center",cursor:"pointer",background:G.purple+"12",border:`1px solid ${G.purple}30`,fontSize:11,fontWeight:900,color:G.purple,letterSpacing:2}}>{"\u229E"} MAP</div>
                      <div onClick={nextRoom} style={{flex:1,padding:"9px 0",borderRadius:8,textAlign:"center",cursor:"pointer",background:"#ffffff06",border:"1px solid #ffffff0a",fontSize:11,fontWeight:800,color:G.purple+"80",letterSpacing:1}}>NEXT {"\u25B6"}</div>
                    </div>
                  </div>
                );
              })()}

              {!sel && !camTrans && <div style={{position:"absolute",inset:0,zIndex:12,background:"linear-gradient(180deg,#06060e,#080816)",display:"flex",flexDirection:"column",padding:"10px 10px"}}>
                <div style={{position:"absolute",inset:0,opacity:.025,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 39px,#a855f7 39px,#a855f7 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#a855f7 39px,#a855f7 40px)",backgroundSize:"40px 40px",pointerEvents:"none",borderRadius:14}}/>
                <div style={{textAlign:"center",fontSize:11,color:G.purple,letterSpacing:5,fontWeight:800,marginBottom:8,position:"relative",zIndex:1,textShadow:"0 0 12px #a855f730"}}>FACILITY MAP</div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:3,justifyContent:"center"}}>
                  {[["r",[{id:"stage",w:2}]],["c",[1,1,1]],["r",[{id:"storage"},{id:"backstage"},{id:"break_room"}]],["c",[1,1,1]],["r",[{id:"dining"},{id:"archive"},{id:"server_room"}]],["c",[1,0,1]],["r",[{id:"kitchen"},{},{}]],["c",[1,0,1]],["r",[{id:"west_hall"},{id:"_off"},{id:"east_hall"}]],["c",[0,1,0]],["r",[{},{id:"maintenance"},{}]],["c",[0,1,0]],["r",[{},{id:"vent"},{}]]].map(([t,d],i)=>t==="c"?(<div key={i} style={{display:"flex",gap:5,justifyContent:"center"}}>{d.map((on,j)=><div key={j} style={{flex:1,maxWidth:145,display:"flex",justifyContent:"center"}}>{on?<div style={{width:1.5,height:14,background:"linear-gradient(180deg,#a855f725,#a855f708)",borderRadius:1}}/>:null}</div>)}</div>):(<div key={i} style={{display:"flex",gap:5,justifyContent:"center"}}>{d.map((c,ci)=>{if(!c||!c.id)return <div key={ci} style={{flex:1,maxWidth:145,height:52}}/>;if(c.id==="_off")return <div key={ci} style={{flex:1,maxWidth:145,height:52,borderRadius:8,background:"linear-gradient(180deg,#1a1408,#12100a)",border:`1.5px solid ${G.gold}15`,boxShadow:`0 0 15px ${G.gold}08, inset 0 1px 0 ${G.gold}10`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontWeight:900,color:G.gold,letterSpacing:3,textShadow:`0 0 8px ${G.gold}40`}}>{"\uD83D\uDCCD"} YOU</span></div>;const rm=ROOMS[c.id];if(!rm)return <div key={ci} style={{flex:1,maxWidth:145,height:52}}/>;return (<div key={ci} onClick={()=>switchRoom(c.id)} style={{flex:c.w||1,maxWidth:c.w?290:145,height:52,borderRadius:8,background:"linear-gradient(180deg,#0e0e1e,#0a0a18)",border:"1px solid #ffffff0a",boxShadow:"inset 0 1px 0 #ffffff06, 0 2px 8px #00000040",display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"0 12px",transition:"all .2s"}}><div style={{fontSize:18,opacity:.7}}>{rm.e}</div><div style={{flex:1,overflow:"hidden"}}><div style={{fontSize:10,fontWeight:700,color:G.txt,whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden"}}>{rm.n}</div><div style={{fontSize:7,color:G.sub,marginTop:1}}>CAM {String(CI.indexOf(c.id)+1).padStart(2,"0")}</div></div></div>);})}</div>))}
                </div>
                <div style={{display:"flex",gap:8,marginTop:8,justifyContent:"center",alignItems:"center",position:"relative",zIndex:1}}>
                  <span style={{fontSize:10,color:G.sub+"80"}}>tap room to view feed</span>
                  <div onClick={closeCam} style={closeCamStyle}>{"\u2715"} CLOSE</div>
                </div>
              </div>}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,flexShrink:0,marginBottom:4}}>
              <CDoor side="L" label="LEFT" icon={"\uD83D\uDEAA"} closed={dL} color={G.red}/>
              <CDoor side="V" label="VENT" icon={"\uD83D\uDD73\uFE0F"} closed={dV} color="#f97316"/>
              <CDoor side="R" label="RIGHT" icon={"\uD83D\uDEAA"} closed={dR} color={G.red}/>
            </div>
            <div onClick={closeCam} style={{flexShrink:0,padding:"12px 0",borderRadius:10,textAlign:"center",cursor:"pointer",background:G.purple+"10",border:`1.5px solid ${G.purple}25`,fontSize:14,fontWeight:900,color:G.purple,letterSpacing:3,marginBottom:8,position:"relative",zIndex:50}}>{"\u2715"} CLOSE CAMERAS</div>
          </div>
        ) : (
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 16px"}}>
            <div style={{flex:1,borderRadius:14,overflow:"hidden",border:`1px solid ${G.gold}15`,position:"relative",minHeight:160,marginBottom:6,background:"linear-gradient(180deg,#08081a 0%,#0a0818 40%,#06060e 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={() => { sSt(); setCamOn(true); nUCam.current = true; }}>
              <div style={{position:"absolute",inset:0,opacity:.03,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 6px)",pointerEvents:"none"}}/>
              <div style={{fontSize:14,fontWeight:900,color:G.gold+"60",letterSpacing:6,marginBottom:6}}>YOUR OFFICE</div>
              <div style={{fontSize:11,color:G.sub}}>Night {night} {"\u00B7"} {HL[hour]}</div>
              <div style={{fontSize:10,color:G.purple+"40",marginTop:4,letterSpacing:2}}>tap to open cameras</div>
              <div style={{display:"flex",gap:20,marginTop:16}}>
                {[["L","LEFT",dL],["V","VENT",dV],["R","RIGHT",dR]].map(([s,l,closed]) => (
                  <div key={s} style={{textAlign:"center"}}><div style={{fontSize:9,color:closed ? G.green+"60" : G.sub,fontWeight:700,letterSpacing:2}}>{l}</div><div style={{fontSize:20,marginTop:2}}>{closed ? "\uD83D\uDD12" : "\uD83D\uDEAA"}</div></div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,flexShrink:0,marginBottom:6}}>
              <CDoor side="L" label="LEFT" icon={"\uD83D\uDEAA"} closed={dL} color={G.red}/>
              <CDoor side="V" label="VENT" icon={"\uD83D\uDD73\uFE0F"} closed={dV} color="#f97316"/>
              <CDoor side="R" label="RIGHT" icon={"\uD83D\uDEAA"} closed={dR} color={G.red}/>
            </div>
            <div onClick={() => { sSt(); setCamOn(true); nUCam.current = true; }} style={{flexShrink:0,padding:"12px 0",borderRadius:10,textAlign:"center",cursor:"pointer",background:G.bg2,border:`2px solid ${G.purple}20`,fontSize:14,fontWeight:900,color:G.purple+"80",letterSpacing:3,marginBottom:6}}>{"\uD83D\uDCF9"} OPEN CAMERAS</div>
          </div>
        )}

        {math && <div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:80,padding:16,background:G.bg+"f0",backdropFilter:"blur(8px)",border:`2px solid ${G.green}40`,borderRadius:14,textAlign:"center",width:"90%",maxWidth:380}}><div style={{fontSize:32,fontWeight:900,color:G.green,marginBottom:8}}>{math.a} {math.op} {math.b} = ?</div><input value={math.input} onChange={e => setMath(p => p ? {...p, input: e.target.value.replace(/[^0-9\-]/g, "")} : null)} onKeyDown={e => { if (e.key === "Enter" && math && math.input.length > 0) { if (parseInt(math.input) === math.ans) { fire("\u2713 +5%", "success"); baR.current = Math.min(getUpg().maxBatt, baR.current + 5); setBatt(baR.current); setMath(null); } else { setMath(null); doScare({t:"emoji",e:"\uD83D\uDCCF",msg:"WRONG",c:"#0f0",sc:5}); baR.current = Math.max(0, baR.current - 18); setBatt(baR.current); } } }} style={{background:"#001a08",border:`1px solid ${G.green}30`,borderRadius:8,padding:"8px 12px",fontSize:24,fontWeight:700,color:G.green,width:110,textAlign:"center",outline:"none"}} autoFocus inputMode="numeric"/><div style={{marginTop:4,fontSize:18,fontWeight:800,color:math.timer <= 3 ? G.red : G.green+"60"}}>{math.timer}s</div></div>}
        {chal && chal.type !== "freeze" && <div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:80,padding:14,textAlign:"center",borderRadius:14,background:G.bg+"f0",backdropFilter:"blur(8px)",border:`2px solid ${{wind:G.purple,click:G.red,type:"#f59e0b",wire:G.green,memory:"#ec4899",reboot:"#3b82f6"}[chal.type] || "#fff"}40`,width:"90%",maxWidth:380}}>
          {chal.type === "wind" && <><div style={{width:"100%",height:12,background:G.bg,borderRadius:6,overflow:"hidden",marginBottom:6}}><div style={{width:Math.min(100,chal.progress/(chal.target||20)*100)+"%",height:"100%",background:`linear-gradient(90deg,${G.purple}60,${G.purple})`,borderRadius:6}}/></div><div onClick={() => setChal(p => { if (!p) return null; if (p.progress+1 >= p.target) { fire("\uD83C\uDFB5 +5%","success"); baR.current = Math.min(getUpg().maxBatt,baR.current+5); setBatt(baR.current); return null; } return {...p,progress:p.progress+1}; })} style={{padding:"10px 24px",background:G.purple,color:"#fff",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",userSelect:"none",display:"inline-block"}}>{"\uD83C\uDFB5"} WIND</div></>}
          {chal.type === "click" && <><div style={{fontSize:32,fontWeight:900,color:chal.count >= chal.target ? G.green : G.red,marginBottom:4}}>{chal.count}/{chal.target}</div><div onClick={() => setChal(p => { if (!p) return null; if (p.count+1 >= p.target) { fire("\u26A1 +5%","success"); baR.current = Math.min(getUpg().maxBatt,baR.current+5); setBatt(baR.current); return null; } return {...p,count:p.count+1}; })} style={{padding:"10px 28px",background:G.red,color:"#fff",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",userSelect:"none",display:"inline-block"}}>{"\u26A1"} CLICK</div></>}
          {chal.type === "type" && <><div style={{fontSize:20,fontWeight:900,color:"#f59e0b",marginBottom:8,letterSpacing:3}}>{chal.word}</div><input value={chal.input} onChange={e => { const v = e.target.value.toUpperCase(); setChal(p => { if (!p) return null; if (v === p.word) { fire("\u2328\uFE0F +6%","success"); baR.current = Math.min(getUpg().maxBatt,baR.current+6); setBatt(baR.current); return null; } return {...p,input:v}; }); }} style={{background:G.bg,border:"1px solid #f59e0b30",borderRadius:8,padding:"8px 12px",fontSize:14,fontWeight:700,color:"#f59e0b",width:"90%",textAlign:"center",outline:"none",textTransform:"uppercase"}} autoFocus/></>}
          {chal.type === "wire" && <><div style={{fontSize:12,color:"#fff8",marginBottom:6,fontWeight:700}}>Cut the <span style={{color:G.green,textDecoration:"underline"}}>{chal.hint}</span> wire</div><div style={{display:"flex",gap:10,justifyContent:"center",padding:"6px 0"}}>{chal.wires.map((w, i) => (<div key={i} onClick={() => { if (w.correct) { fire("\uD83D\uDCA3 +6%","success"); baR.current = Math.min(getUpg().maxBatt,baR.current+6); setBatt(baR.current); setChal(null); } else { doScare({t:"emoji",e:"\uD83D\uDCA5",msg:"BOOM",c:"#f40",sc:5}); baR.current = Math.max(0,baR.current-18); setBatt(baR.current); setChal(null); } }} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><div style={{width:8,height:60,background:`linear-gradient(180deg,${w.c},${w.c}cc)`,borderRadius:16,border:`2px solid ${w.c}`,boxShadow:`0 0 10px ${w.c}60`}}/><div style={{fontSize:8,color:"#fff6",fontWeight:700}}>{["1st","2nd","3rd","4th"][i]}</div></div>))}</div></>}
          {chal.type === "memory" && <><div style={{fontSize:10,color:"#ec4899",letterSpacing:3,fontWeight:700,marginBottom:4}}>{chal.phase === "watch" ? "WATCH" : "REPEAT"}</div><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,maxWidth:120,margin:"0 auto 6px"}}>{["#ef4444","#22c55e","#3b82f6","#f59e0b"].map((c, i) => { const lit = chal.phase === "watch" && chal.show > 0 && chal.seq[chal.show-1] === i; return (<div key={i} onClick={() => { if (chal.phase !== "input") return; setChal(p => { if (!p || p.phase !== "input") return p; const ni = [...p.input, i]; if (ni[ni.length-1] !== p.seq[ni.length-1]) { doScare({t:"emoji",e:"\uD83E\uDDE0",msg:"WRONG",c:"#ec4899",sc:5}); baR.current = Math.max(0,baR.current-15); setBatt(baR.current); return null; } if (ni.length >= p.seq.length) { fire("\uD83E\uDDE0 +6%","success"); baR.current = Math.min(getUpg().maxBatt,baR.current+6); setBatt(baR.current); return null; } return {...p,input:ni}; }); }} style={{width:52,height:52,borderRadius:10,background:lit ? c : c+"25",border:`2px solid ${lit ? c : c+"40"}`,cursor:chal.phase === "input" ? "pointer" : "default",boxShadow:lit ? `0 0 16px ${c}60` : "none",transition:"all .1s"}}/>); })}</div></>}
          {chal.type === "reboot" && <><div style={{fontSize:32,fontWeight:900,color:"#3b82f6",marginBottom:4}}>{chal.clicks}/{chal.target}</div><div onClick={() => setChal(p => { if (!p) return null; if (p.clicks+1 >= p.target) { fire("\uD83D\uDCE1 Online!","success"); setCamJ(false); return null; } return {...p,clicks:p.clicks+1}; })} style={{padding:"10px 28px",background:"#3b82f6",color:"#fff",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",userSelect:"none",display:"inline-block"}}>{"\uD83D\uDCE1"} REBOOT</div></>}
          <div style={{marginTop:4,fontSize:18,fontWeight:800,color:chal.timer <= 2 ? G.red : G.sub}}>{chal.timer}s</div>
        </div>}
        <div style={{textAlign:"center",padding:"4px 0 10px",flexShrink:0}}><span onClick={() => { setScr("menu"); fire("Escaped...", "info"); }} style={{fontSize:10,color:G.dim,cursor:"pointer",letterSpacing:3}}>QUIT</span></div>
      </div>}

      {scr === "nightsum" && nSum && <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:`radial-gradient(circle,${G.green}08,${G.bg})`,padding:20}}>
        <div style={{fontSize:56,fontWeight:900,color:G.gold,textShadow:`0 0 50px ${G.gold}60`,marginBottom:8}}>6 AM</div>
        <div style={{fontSize:20,color:G.gold+"80"}}>Night {nSum.night} Clear {"\u2600\uFE0F"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:24,width:"100%",maxWidth:320}}>{[["Battery",nSum.batt+"%",bc],["Blocks",nSum.blocks,G.gold],["Cams",nSum.cams,G.purple],["Earned","\uD83E\uDE99"+nSum.earned,G.gold]].map(([l, v, c]) => (<div key={l} style={{padding:14,background:G.card,borderRadius:12,textAlign:"center",border:`1px solid ${c}15`}}><div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:10,color:G.sub}}>{l}</div></div>))}</div>
        {nSum.achvNew && nSum.achvNew.length > 0 && <div style={{marginTop:18}}>{nSum.achvNew.map(id => { const a = ACH.find(x => x.id === id); return a ? (<div key={id} style={{padding:"10px 20px",background:G.gold+"08",borderRadius:10,marginBottom:4,border:`1px solid ${G.gold}20`,textAlign:"center"}}><span style={{fontSize:18}}>{a.i}</span> <span style={{fontSize:14,color:G.gold,fontWeight:700}}>{a.n}</span></div>) : null; })}</div>}
        <div style={{marginTop:28}}>
          {nSum.won ? <div onClick={() => { setScr("menu"); setNSum(null); }} style={{padding:"16px 48px",background:`linear-gradient(135deg,${G.gold},${G.gold}80)`,color:"#000",borderRadius:14,fontSize:20,fontWeight:900,cursor:"pointer",letterSpacing:4}}>VICTORY</div> : <div onClick={() => { const nn = nSum.night + 1; setNight(nn); nR.current = nn; startNight(nn); setScr("game"); setNSum(null); }} style={{padding:"16px 48px",background:`linear-gradient(135deg,${G.green},${G.green}80)`,color:"#000",borderRadius:14,fontSize:20,fontWeight:900,cursor:"pointer",letterSpacing:4}}>NIGHT {nSum.night + 1} {"\u2192"}</div>}
        </div>
      </div>}

      {scr === "dead" && <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:`radial-gradient(circle,${G.red}08,${G.bg})`}}>
        <div style={{fontSize:80,fontWeight:900,color:G.red,textShadow:`0 0 60px ${G.red}80`,marginBottom:10,animation:"cPulse 1s infinite"}}>DEAD</div>
        <div style={{fontSize:16,color:G.red+"60",marginBottom:6}}>Night {night} {"\u00B7"} {HL[hour]}</div>
        <div style={{fontSize:14,color:G.sub,marginBottom:28,maxWidth:300,textAlign:"center"}}>{R(DMSG)}</div>
        <div style={{display:"flex",gap:14}}>
          <div onClick={() => { startNight(night); setScr("game"); }} style={{padding:"16px 36px",background:G.red,color:"#000",borderRadius:14,fontSize:18,fontWeight:900,cursor:"pointer",letterSpacing:3}}>RETRY</div>
          <div onClick={() => { setScr("menu"); setNSum(null); }} style={{padding:"16px 36px",border:`1px solid ${G.red}20`,color:G.red+"60",borderRadius:14,fontSize:18,cursor:"pointer",letterSpacing:3}}>MENU</div>
        </div>
      </div>}
    </div>
  );
}
