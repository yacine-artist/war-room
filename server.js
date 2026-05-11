const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>War Room — Incident Command</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:       #f0f2f5;
  --surface:  #ffffff;
  --surface2: #f7f8fa;
  --ink:      #0d1117;
  --ink2:     #3d4557;
  --ink3:     #8892a4;
  --border:   #dde1ea;
  --border2:  #c8cdd8;
  --red:      #d92b2b;
  --red-l:    #fff0f0;
  --red-m:    #ffd5d5;
  --amber:    #c47d00;
  --amber-l:  #fff8e6;
  --amber-m:  #ffe4a0;
  --green:    #1a7f4b;
  --green-l:  #edfbf2;
  --green-m:  #b6f0d0;
  --blue:     #1354c8;
  --blue-l:   #eef3ff;
  --blue-m:   #b8ccff;
  --display:  'Syne', sans-serif;
  --mono:     'JetBrains Mono', monospace;
}

html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--ink);font-family:var(--mono);display:flex;flex-direction:column;font-size:12px}

/* ══ HEADER ══ */
.hdr{
  height:56px;display:flex;align-items:stretch;
  background:var(--ink);flex-shrink:0;
  box-shadow:0 2px 16px rgba(0,0,0,.25);
  position:relative;z-index:10;
}

.hdr-badge{
  display:flex;align-items:center;gap:10px;
  padding:0 24px;border-right:1px solid rgba(255,255,255,.1);
  background:var(--red);flex-shrink:0;
}
.hdr-badge strong{font-family:var(--display);font-size:12px;letter-spacing:3px;color:#fff;font-weight:800}
.pulse{width:8px;height:8px;border-radius:50%;background:#fff;animation:pulse 1s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}

.hdr-title{
  flex:1;display:flex;align-items:center;padding:0 28px;gap:12px;
}
.hdr-title h1{font-family:var(--display);font-size:17px;font-weight:800;color:#fff;letter-spacing:.5px}
.hdr-title span{color:rgba(255,255,255,.45);font-size:12px;font-family:var(--mono)}

.hdr-stats{display:flex;align-items:stretch}
.hs{
  display:flex;flex-direction:column;justify-content:center;
  padding:0 22px;border-left:1px solid rgba(255,255,255,.08);gap:3px;
  min-width:100px;
}
.hs-l{font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.4);text-transform:uppercase;font-family:var(--mono)}
.hs-v{font-size:13px;font-weight:700;color:#fff;font-family:var(--mono)}
.hs-v.red{color:#ff6b6b}
.hs-v.amber{color:#ffd43b}
.hs-v.green{color:#69db7c}

/* ══ TICKER ══ */
.ticker{
  height:30px;background:var(--ink);border-bottom:3px solid var(--red);
  display:flex;align-items:center;overflow:hidden;flex-shrink:0;
}
.tkr-tag{
  font-size:9px;letter-spacing:2.5px;color:var(--red);
  padding:0 16px;border-right:1px solid rgba(255,255,255,.1);
  height:100%;display:flex;align-items:center;flex-shrink:0;
  background:rgba(217,43,43,.15);font-weight:700;
}
.tkr-scroll{display:flex;gap:56px;padding:0 28px;animation:scroll 35s linear infinite;white-space:nowrap}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.te{font-size:11px;color:rgba(255,255,255,.55);display:flex;align-items:center;gap:8px}
.te b{color:#fff}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dr{background:var(--red)} .da{background:#ffd43b} .dg{background:#69db7c}

/* ══ LAYOUT ══ */
.layout{
  flex:1;display:grid;
  grid-template-columns:320px 1fr 300px;
  grid-template-rows:1fr 200px;
  overflow:hidden;gap:1px;background:var(--border);
}

/* ══ PANEL ══ */
.panel{background:var(--surface);display:flex;flex-direction:column;overflow:hidden}

.ph{
  height:40px;padding:0 18px;
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;background:var(--surface);
  border-bottom:1px solid var(--border);
}
.ph-name{
  font-size:9px;letter-spacing:2.5px;text-transform:uppercase;
  color:var(--ink3);font-weight:700;
}
.badge{font-size:9px;padding:3px 10px;border-radius:3px;font-weight:700;letter-spacing:.5px;font-family:var(--mono)}
.br{background:var(--red-l);color:var(--red);border:1px solid var(--red-m)}
.ba{background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-m)}
.bg{background:var(--green-l);color:var(--green);border:1px solid var(--green-m)}
.bb{background:var(--blue-l);color:var(--blue);border:1px solid var(--blue-m)}

.scroll-area{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent}

/* ══ TIMELINE ══ */
.tl-body{padding:16px 18px}
.tl-item{display:grid;grid-template-columns:64px 18px 1fr;gap:0 12px;margin-bottom:20px}
.tl-item:last-child{margin-bottom:0}

.tl-time{
  font-size:10px;color:var(--amber);font-weight:700;
  padding-top:1px;text-align:right;letter-spacing:.3px;
}
.tl-spine{display:flex;flex-direction:column;align-items:center}
.tl-dot{
  width:10px;height:10px;border-radius:50%;flex-shrink:0;
  margin-top:2px;border:2px solid;
}
.tl-dot.crit{background:var(--red-l);border-color:var(--red)}
.tl-dot.warn{background:var(--amber-l);border-color:var(--amber)}
.tl-dot.info{background:var(--blue-l);border-color:var(--blue)}
.tl-dot.ok{background:var(--green-l);border-color:var(--green)}
.tl-wire{width:1px;flex:1;background:var(--border2);margin-top:6px}

.tl-tag{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:3px}
.tl-tag.crit{color:var(--red)} .tl-tag.warn{color:var(--amber)} .tl-tag.info{color:var(--blue)} .tl-tag.ok{color:var(--green)}
.tl-txt{font-size:11px;line-height:1.6;color:var(--ink2)}
.tl-txt b{color:var(--ink);font-weight:700}

/* ══ METRICS ══ */
.metrics{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--border);border-bottom:1px solid var(--border);
  flex-shrink:0;
}
.metric{
  background:var(--surface);padding:16px 18px;
  position:relative;overflow:hidden;
}
.metric::after{
  content:'';position:absolute;
  top:0;left:0;right:0;height:3px;
}
.metric.crit::after{background:var(--red)}
.metric.warn::after{background:var(--amber)}
.metric.ok::after{background:var(--green)}

.m-bg{
  position:absolute;inset:0;
  opacity:.04;pointer-events:none;
}
.metric.crit .m-bg{background:var(--red)}
.metric.warn .m-bg{background:var(--amber)}
.metric.ok .m-bg{background:var(--green)}

.m-name{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px;font-weight:700}
.m-val{font-family:var(--display);font-size:28px;font-weight:800;line-height:1;margin-bottom:4px}
.m-val.crit{color:var(--red)} .m-val.warn{color:var(--amber)} .m-val.ok{color:var(--green)}
.m-unit{font-family:var(--mono);font-size:12px;color:var(--ink3);font-weight:400;margin-left:3px}
.m-delta{font-size:10px;font-family:var(--mono);font-weight:700}
.m-delta.up{color:var(--red)} .m-delta.down{color:var(--green)}

/* ══ LOGS ══ */
.log-body{padding:0}
.log-row{
  display:grid;grid-template-columns:64px 52px 1fr;
  gap:0 10px;padding:5px 18px;
  border-bottom:1px solid rgba(0,0,0,.04);
  font-size:10.5px;line-height:1.5;
  transition:background .1s;
}
.log-row:hover{background:var(--surface2)}
.log-row.err{background:rgba(217,43,43,.04)}
.log-row.wrn{background:rgba(196,125,0,.04)}

.log-t{color:var(--ink3);font-weight:500}
.log-lv{font-weight:700}
.log-lv.ERROR{color:var(--red)} .log-lv.WARN{color:var(--amber)} .log-lv.INFO{color:var(--blue)} .log-lv.OK{color:var(--green)}
.log-msg{color:var(--ink2)}
.hl{color:var(--blue);font-weight:600}

/* ══ HYPOTHESES ══ */
.hyp-body{padding:14px 18px;display:flex;flex-direction:column;gap:12px}
.hyp{
  border:1px solid var(--border);border-radius:6px;overflow:hidden;
  transition:box-shadow .2s;
}
.hyp:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
.hyp.top{border-color:var(--red-m);box-shadow:0 2px 8px rgba(217,43,43,.12)}

.hyp-head{padding:12px 14px;background:var(--surface2);display:flex;align-items:flex-start;gap:10px}
.hyp-rank{
  font-size:9px;letter-spacing:1px;color:var(--ink3);
  font-weight:700;flex-shrink:0;padding-top:2px;
}
.hyp-title{font-size:12px;font-weight:700;color:var(--ink);flex:1;line-height:1.4}
.hyp-pct{font-family:var(--display);font-size:22px;font-weight:800;flex-shrink:0}
.hyp-pct.high{color:var(--red)} .hyp-pct.mid{color:var(--amber)} .hyp-pct.low{color:var(--ink3)}

.hyp-bar{height:3px;background:var(--border)}
.hyp-fill{height:100%;transition:width 1s cubic-bezier(.4,0,.2,1)}
.hyp-fill.high{background:linear-gradient(90deg,var(--blue),var(--red))}
.hyp-fill.mid{background:linear-gradient(90deg,var(--blue),var(--amber))}
.hyp-fill.low{background:var(--ink3)}

.hyp-desc{padding:10px 14px;font-size:10.5px;color:var(--ink2);line-height:1.7;border-top:1px solid var(--border)}
.hyp-desc b{color:var(--ink)}

/* ══ CHAT ══ */
.chat-panel{grid-column:1/-1;flex-direction:row!important}
.chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border)}

.chat-msgs{
  flex:1;overflow-y:auto;padding:14px 18px;
  display:flex;flex-direction:column;gap:10px;
  scrollbar-width:thin;scrollbar-color:var(--border) transparent;
  background:var(--surface2);
}
.msg{display:flex;gap:10px;align-items:flex-start}
.av{
  width:28px;height:28px;border-radius:6px;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;flex-shrink:0;font-family:var(--mono);
}
.av-sys{background:var(--blue-l);color:var(--blue);border:1px solid var(--blue-m)}
.av-usr{background:var(--surface);color:var(--ink2);border:1px solid var(--border)}
.msg-author{font-size:9px;color:var(--ink3);letter-spacing:1px;margin-bottom:2px;font-weight:700}
.msg-text{font-size:11.5px;color:var(--ink);line-height:1.5}

.chat-input-row{
  padding:10px 14px;border-top:1px solid var(--border);
  display:flex;gap:8px;flex-shrink:0;background:var(--surface);
}
input.cin{
  flex:1;background:var(--surface2);
  border:1.5px solid var(--border2);border-radius:5px;
  padding:8px 14px;color:var(--ink);font-family:var(--mono);font-size:11.5px;outline:none;
  transition:border-color .15s;
}
input.cin:focus{border-color:var(--blue);background:#fff}
input.cin::placeholder{color:var(--ink3)}
button.csend{
  background:var(--red);border:none;border-radius:5px;
  padding:0 20px;color:#fff;font-family:var(--mono);
  font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1px;
  transition:opacity .15s;
}
button.csend:hover{opacity:.85}

/* ══ AI SIDE ══ */
.ai-side{width:300px;flex-shrink:0;display:flex;flex-direction:column;background:var(--surface)}
.ai-body{
  flex:1;overflow-y:auto;padding:14px;
  display:flex;flex-direction:column;gap:10px;
  scrollbar-width:thin;scrollbar-color:var(--border) transparent;
}
.ai-card{
  background:var(--blue-l);border:1px solid var(--blue-m);
  border-radius:6px;padding:12px 14px;
}
.ai-card-title{
  font-size:8px;letter-spacing:2px;color:var(--blue);
  text-transform:uppercase;margin-bottom:8px;font-weight:700;
}
.ai-card-body{font-size:11px;color:var(--ink2);line-height:1.75}
.ai-card-body b{color:var(--ink)}
.step{display:flex;gap:8px;margin-bottom:4px}
.step-n{color:var(--amber);font-weight:700;font-size:11px;flex-shrink:0}

/* ══ STATUS BAR ══ */
.statusbar{
  height:22px;background:var(--ink);display:flex;align-items:center;
  padding:0 18px;gap:20px;flex-shrink:0;
}
.sb-item{font-size:9px;color:rgba(255,255,255,.4);display:flex;align-items:center;gap:5px;letter-spacing:.5px}
.sb-dot{width:5px;height:5px;border-radius:50%}
.sb-dot.g{background:#69db7c;animation:pulse 2s infinite}
.sb-dot.r{background:var(--red);animation:pulse 1s infinite}
</style>
</head>
<body>

<!-- HEADER -->
<header class="hdr">
  <div class="hdr-badge"><div class="pulse"></div><strong>INCIDENT</strong></div>
  <div class="hdr-title">
    <h1>War Room — Incident Command</h1>
    <span id="iname">API Latency Spike — Production</span>
  </div>
  <div class="hdr-stats">
    <div class="hs"><div class="hs-l">Statut</div><div class="hs-v red">● ACTIF</div></div>
    <div class="hs"><div class="hs-l">Durée incident</div><div class="hs-v amber" id="dur">00:00:00</div></div>
    <div class="hs"><div class="hs-l">Heure locale</div><div class="hs-v" id="clk">--:--:--</div></div>
    <div class="hs"><div class="hs-l">Sévérité</div><div class="hs-v red">SEV-1</div></div>
    <div class="hs"><div class="hs-l">Environnement</div><div class="hs-v green">PRODUCTION</div></div>
  </div>
</header>

<!-- TICKER -->
<div class="ticker">
  <div class="tkr-tag">LIVE</div>
  <div class="tkr-scroll">
    <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema — 247 erreurs/60s</span>
    <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — seuil 2 000 ms dépassé — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78 / 100</span>
    <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1 — 4 min avant alerte</span>
    <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03 — seuil 85 % approché</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b> — tous PoP opérationnels</span>
    <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema — 247 erreurs/60s</span>
    <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — seuil 2 000 ms dépassé — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78 / 100</span>
    <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1 — 4 min avant alerte</span>
    <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03 — seuil 85 % approché</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b> — tous PoP opérationnels</span>
  </div>
</div>

<!-- MAIN GRID -->
<div class="layout">

  <!-- COL 1 — TIMELINE -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Timeline</div><div class="badge br">5 events</div></div>
    <div class="scroll-area"><div class="tl-body" id="tl"></div></div>
  </div>

  <!-- COL 2 — METRICS + LOGS -->
  <div class="panel">
    <div class="metrics" id="metrics"></div>
    <div class="ph"><div class="ph-name">Log stream — haproxy / cms-prod</div><div class="badge ba" id="lbadge">0 logs</div></div>
    <div class="scroll-area"><div class="log-body" id="logs"></div></div>
  </div>

  <!-- COL 3 — HYPOTHESES -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Hypothèses classées</div><div class="badge ba">3 ranked</div></div>
    <div class="scroll-area"><div class="hyp-body" id="hyps"></div></div>
  </div>

  <!-- BOTTOM — CHAT + AI -->
  <div class="panel chat-panel">
    <div class="chat-main">
      <div class="ph"><div class="ph-name">Chat d'équipe — temps réel</div><div class="badge bg" id="ws-pill">● connecté</div></div>
      <div class="chat-msgs" id="chat"></div>
      <div class="chat-input-row">
        <input class="cin" id="cin" placeholder="Message à l'équipe… (Entrée pour envoyer)" />
        <button class="csend" onclick="sendMsg()">ENVOYER</button>
      </div>
    </div>
    <div class="ai-side">
      <div class="ph"><div class="ph-name">Analyse IA</div><div class="badge bb">auto</div></div>
      <div class="ai-body">
        <div class="ai-card">
          <div class="ai-card-title">Résumé incident</div>
          <div class="ai-card-body">Pic de <b>504 errors</b> sur haproxy à <b>14:32:01</b>. Corrélation forte avec deploy <b>#847</b> effectué 4 min avant. Latence p99 à <b>2 847 ms</b> (seuil : 2 000 ms).</div>
        </div>
        <div class="ai-card">
          <div class="ai-card-title">Actions recommandées</div>
          <div class="ai-card-body">
            <div class="step"><span class="step-n">1.</span><span>Rollback deploy <b>#847</b> en urgence</span></div>
            <div class="step"><span class="step-n">2.</span><span>Vérifier connection pool <b>orders_db</b></span></div>
            <div class="step"><span class="step-n">3.</span><span>Monitorer p99 latency post-rollback</span></div>
          </div>
        </div>
        <div class="ai-card">
          <div class="ai-card-title">Cause probable</div>
          <div class="ai-card-body">Régression <b>checkout-service v2.4.1</b><br>Probabilité estimée : <b style="color:#d92b2b;font-size:18px">87 %</b></div>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- STATUS BAR -->
<div class="statusbar">
  <div class="sb-item"><span class="sb-dot g"></span>WebSocket actif</div>
  <div class="sb-item"><span class="sb-dot r"></span>Incident en cours</div>
  <div class="sb-item">War Room v3.0 — Yacine Nabil — JC Arkema</div>
  <div class="sb-item" style="margin-left:auto" id="sb-clock"></div>
</div>

<script>
// ── TIMELINE
const tlData=[
  {t:'14:32:01',cls:'crit',tag:'ALERT', txt:'Monitor Datadog déclenché — <b>p99 > 2 000 ms</b> sur /api/checkout — 247 erreurs'},
  {t:'14:31:44',cls:'crit',tag:'ERROR', txt:'<b>247 erreurs 504</b> en 60 s — haproxy cms-prod-arkema — équipe notifiée'},
  {t:'14:28:14',cls:'warn',tag:'DEPLOY',txt:'Deploy <b>#847</b> mergé par thomas.b — checkout-service v2.4.1 — non testé pré-prod'},
  {t:'14:25:00',cls:'info',tag:'TRAFIC',txt:'Trafic normal — <b>1 200 req/min</b> sur /api/checkout — pic déjeuner habituel'},
  {t:'14:20:33',cls:'ok',  tag:'HEALTH',txt:'Tous health checks <b>OK</b> — DB, cache, CDN opérationnels — aucun anomalie'}
];
const tlEl=document.getElementById('tl');
tlData.forEach((e,i)=>{
  tlEl.innerHTML+=\`<div class="tl-item">
    <div class="tl-time">\${e.t}</div>
    <div class="tl-spine"><div class="tl-dot \${e.cls}"></div>\${i<tlData.length-1?'<div class="tl-wire"></div>':''}</div>
    <div><div class="tl-tag \${e.cls}">\${e.tag}</div><div class="tl-txt">\${e.txt}</div></div>
  </div>\`;
});

// ── METRICS
const mData=[
  {n:'P99 Latency',    v:'2 847',u:'ms',    d:'↑ +1 200 ms',dd:'up',  c:'crit'},
  {n:'Error Rate',     v:'18.4', u:'%',     d:'↑ +17.2 %',  dd:'up',  c:'crit'},
  {n:'Throughput',     v:'843',  u:'req/s', d:'↓ −357 req/s',dd:'down',c:'warn'},
  {n:'DB Connections', v:'78',   u:'/ 100', d:'↑ +12',       dd:'up',  c:'warn'},
  {n:'Memory',         v:'84',   u:'%',     d:'↑ +8 %',      dd:'up',  c:'warn'},
  {n:'CPU',            v:'31',   u:'%',     d:'↑ +2 %',      dd:'up',  c:'ok'}
];
const mEl=document.getElementById('metrics');
mData.forEach(m=>{
  mEl.innerHTML+=\`<div class="metric \${m.c}"><div class="m-bg"></div>
    <div class="m-name">\${m.n}</div>
    <div class="m-val \${m.c}">\${m.v}<span class="m-unit">\${m.u}</span></div>
    <div class="m-delta \${m.dd}">\${m.d}</div>
  </div>\`;
});

// ── HYPOTHESES
const hData=[
  {r:'#1',cls:'top',t:'Régression introduite par Deploy #847',       p:'87',pc:'high',d:'Deploy effectué <b>4 min avant</b> l\'alerte. Corrélation temporelle très forte. checkout-service v2.4.1 non validé en pré-prod. Rollback recommandé immédiatement.'},
  {r:'#2',cls:'',   t:'Saturation du connection pool base de données',p:'65',pc:'mid', d:'orders_db à <b>78 / 100</b> connexions actives. Requêtes lentes détectées sur orders_db. Facteur aggravant probable — à surveiller après rollback.'},
  {r:'#3',cls:'',   t:'Pic de trafic externe anormal',                p:'23',pc:'low', d:'Trafic légèrement au-dessus de la moyenne déjeuner, mais dans les <b>normes historiques</b>. Peu probable comme cause principale.'}
];
const hEl=document.getElementById('hyps');
hData.forEach(h=>{
  hEl.innerHTML+=\`<div class="hyp \${h.cls}">
    <div class="hyp-head">
      <div class="hyp-rank">\${h.r}</div>
      <div class="hyp-title">\${h.t}</div>
      <div class="hyp-pct \${h.pc}">\${h.p}%</div>
    </div>
    <div class="hyp-bar"><div class="hyp-fill \${h.pc}" style="width:\${h.p}%"></div></div>
    <div class="hyp-desc">\${h.d}</div>
  </div>\`;
});

// ── LOGS
const logData=[
  {t:'14:32:08',l:'ERROR',cls:'err',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 847 ms'},
  {t:'14:32:07',l:'ERROR',cls:'err',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 3 102 ms'},
  {t:'14:32:06',l:'WARN', cls:'wrn',m:'checkout-service: DB query slow — <span class="hl">orders_db</span> — 1 847 ms (seuil 500 ms)'},
  {t:'14:32:05',l:'ERROR',cls:'err',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 991 ms'},
  {t:'14:32:04',l:'WARN', cls:'wrn',m:'checkout-service: connection pool à <span class="hl">78 %</span> de capacité'},
  {t:'14:32:01',l:'ERROR',cls:'err',m:'datadog-agent: monitor <span class="hl">p99_latency</span> dépassé — 2 847 ms > 2 000 ms'},
  {t:'14:31:58',l:'WARN', cls:'wrn',m:'app-server-03: mémoire <span class="hl">84 %</span> — proche seuil critique'},
  {t:'14:31:44',l:'ERROR',cls:'err',m:'haproxy: <span class="hl">247</span> erreurs 504 en 60 s — équipe notifiée'},
  {t:'14:28:14',l:'INFO', cls:'',   m:'deploy-agent: checkout-service <span class="hl">v2.4.1</span> déployé par thomas.b — #847'},
  {t:'14:25:00',l:'INFO', cls:'',   m:'traffic-monitor: débit <span class="hl">1 200 req/min</span> — plage normale'},
  {t:'14:20:33',l:'OK',   cls:'',   m:'health-check: tous services OK — DB, cache, CDN opérationnels'}
];
const lEl=document.getElementById('logs');
const lBadge=document.getElementById('lbadge');
let lc=0;
function addLog(t,l,cls,m){
  lEl.innerHTML+=\`<div class="log-row \${cls}">
    <span class="log-t">\${t}</span>
    <span class="log-lv \${l}">\${l}</span>
    <span class="log-msg">\${m}</span>
  </div>\`;
  lBadge.textContent=(++lc)+' logs';
  lEl.parentElement.scrollTop=lEl.parentElement.scrollHeight;
}
logData.forEach((x,i)=>setTimeout(()=>addLog(x.t,x.l,x.cls,x.m),i*130));

const liveLogs=[
  {l:'ERROR',cls:'err',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 3 247 ms'},
  {l:'WARN', cls:'wrn',m:'checkout-service: DB query slow — <span class="hl">2 100 ms</span>'},
  {l:'ERROR',cls:'err',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 2 891 ms'},
  {l:'WARN', cls:'wrn',m:'memory: app-server-03 à <span class="hl">86 %</span>'}
];
let li=0;
setInterval(()=>{
  const n=new Date(),t=[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  const f=liveLogs[li++%liveLogs.length];
  addLog(t,f.l,f.cls,f.m);
},5000);

// ── CHAT
const ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
const chatEl=document.getElementById('chat');
const me='User'+Math.floor(Math.random()*90+10);

function addMsg(a,t,sys){
  const init=sys?'AI':a.slice(0,2).toUpperCase();
  chatEl.innerHTML+=\`<div class="msg">
    <div class="av \${sys?'av-sys':'av-usr'}">\${init}</div>
    <div><div class="msg-author">\${a}</div><div class="msg-text">\${t}</div></div>
  </div>\`;
  chatEl.scrollTop=chatEl.scrollHeight;
}

ws.onopen=()=>addMsg('Système','War Room activée — WebSocket connecté — En attente de l\'équipe…',true);
ws.onmessage=e=>{const d=JSON.parse(e.data);addMsg(d.author,d.text,d.author==='Système')};

function sendMsg(){
  const i=document.getElementById('cin');
  if(!i.value.trim())return;
  ws.send(JSON.stringify({author:me,text:i.value.trim()}));
  i.value='';
}
document.getElementById('cin').addEventListener('keypress',e=>{if(e.key==='Enter')sendMsg()});

// ── CLOCK
const t0=Date.now();
setInterval(()=>{
  const n=new Date();
  const t=[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  document.getElementById('clk').textContent=t;
  document.getElementById('sb-clock').textContent=t;
  const s=Math.floor((Date.now()-t0)/1000);
  document.getElementById('dur').textContent=[Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(x=>String(x).padStart(2,'0')).join(':');
},1000);
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(HTML));

app.post('/webhook', (req, res) => {
  console.log('Webhook reçu:', JSON.stringify(req.body, null, 2));
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connecté');
  ws.send(JSON.stringify({ author: 'Système', text: 'Bienvenue dans la War Room. Connecté en temps réel.' }));
  ws.on('message', data => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(data.toString());
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('War Room démarrée sur le port ' + PORT));
