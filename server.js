const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

const HTML = `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>War Room — Incident Command</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* ── THEME TOKENS ── */
[data-theme="dark"]{
  --bg:       #0d0f14;
  --bg2:      #13161f;
  --bg3:      #1a1e2a;
  --border:   #252836;
  --border2:  #2e3347;
  --text:     #e8edf5;
  --text2:    #9aa3b8;
  --text3:    #545d74;
  --surface:  #13161f;
  --surface2: #1a1e2a;
  --card:     #1e2230;
  --shadow:   rgba(0,0,0,.4);
}
[data-theme="light"]{
  --bg:       #f4f5f8;
  --bg2:      #ffffff;
  --bg3:      #f0f1f5;
  --border:   #e2e5ee;
  --border2:  #cdd1de;
  --text:     #0d1117;
  --text2:    #4a5168;
  --text3:    #9aa3b8;
  --surface:  #ffffff;
  --surface2: #f7f8fc;
  --card:     #ffffff;
  --shadow:   rgba(0,0,0,.08);
}

/* ── GLOBAL ── */
:root{
  --red:      #e53935;
  --red-dim:  rgba(229,57,53,.15);
  --red-bdr:  rgba(229,57,53,.4);
  --amber:    #f59f00;
  --amb-dim:  rgba(245,159,0,.12);
  --amb-bdr:  rgba(245,159,0,.4);
  --green:    #2ecc71;
  --grn-dim:  rgba(46,204,113,.1);
  --grn-bdr:  rgba(46,204,113,.35);
  --blue:     #3b82f6;
  --blu-dim:  rgba(59,130,246,.12);
  --blu-bdr:  rgba(59,130,246,.35);
  --display:  'Space Grotesk',sans-serif;
  --mono:     'JetBrains Mono',monospace;
}

html,body{height:100%;overflow:hidden}
body{
  background:var(--bg);color:var(--text);
  font-family:var(--mono);font-size:12px;
  display:flex;flex-direction:column;
  transition:background .25s,color .25s;
}

/* ── HEADER ── */
.hdr{
  height:54px;display:flex;align-items:stretch;flex-shrink:0;
  background:var(--surface);border-bottom:1px solid var(--border);
  box-shadow:0 1px 0 var(--border),0 4px 16px var(--shadow);
  position:relative;z-index:100;
}

.hdr-left{
  display:flex;align-items:center;gap:14px;
  padding:0 22px;border-right:1px solid var(--border);
  flex-shrink:0;
}
.inc-badge{
  display:flex;align-items:center;gap:8px;
  background:var(--red);border-radius:5px;
  padding:5px 12px;
}
.inc-badge span{font-family:var(--display);font-size:11px;font-weight:700;letter-spacing:2px;color:#fff}
.pulse{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.9);animation:blink 1s ease-in-out infinite;flex-shrink:0}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}

.hdr-title{
  flex:1;display:flex;flex-direction:column;justify-content:center;
  padding:0 22px;gap:2px;
}
.hdr-title h1{font-family:var(--display);font-size:15px;font-weight:700;color:var(--text);letter-spacing:.2px}
.hdr-title p{font-size:10px;color:var(--text2);letter-spacing:.5px}

.hdr-stats{display:flex;align-items:stretch}
.hs{
  display:flex;flex-direction:column;justify-content:center;
  padding:0 20px;border-left:1px solid var(--border);gap:3px;
  min-width:110px;
}
.hs-l{font-size:8px;letter-spacing:2px;color:var(--text3);text-transform:uppercase;font-weight:600}
.hs-v{font-size:13px;font-weight:700;color:var(--text);font-family:var(--mono)}
.hs-v.red{color:var(--red)}.hs-v.amber{color:var(--amber)}.hs-v.green{color:var(--green)}

.hdr-actions{display:flex;align-items:center;padding:0 18px;border-left:1px solid var(--border);gap:8px;flex-shrink:0}

/* TOGGLE BUTTON */
.theme-btn{
  width:44px;height:26px;border-radius:13px;
  border:1.5px solid var(--border2);
  background:var(--bg3);cursor:pointer;
  position:relative;transition:all .25s;
  display:flex;align-items:center;padding:3px;
  flex-shrink:0;
}
.theme-btn-knob{
  width:18px;height:18px;border-radius:50%;
  background:var(--text2);transition:all .25s;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;flex-shrink:0;
}
[data-theme="dark"] .theme-btn-knob{transform:translateX(18px)}
[data-theme="light"] .theme-btn-knob{transform:translateX(0px)}

.sev-badge{
  padding:4px 10px;border-radius:4px;
  font-size:10px;font-weight:700;letter-spacing:1px;
  background:var(--red-dim);color:var(--red);border:1px solid var(--red-bdr);
  font-family:var(--display);
}

/* ── TICKER ── */
.ticker{
  height:28px;background:var(--surface2);
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;overflow:hidden;flex-shrink:0;
}
.tkr-tag{
  font-size:8px;letter-spacing:2.5px;color:var(--red);font-weight:700;
  padding:0 16px;border-right:1px solid var(--red-bdr);
  height:100%;display:flex;align-items:center;flex-shrink:0;
  background:var(--red-dim);
}
.tkr-wrap{flex:1;overflow:hidden;position:relative}
.tkr-wrap::before,.tkr-wrap::after{
  content:'';position:absolute;top:0;bottom:0;width:40px;z-index:2;pointer-events:none;
}
.tkr-wrap::before{left:0;background:linear-gradient(90deg,var(--surface2),transparent)}
.tkr-wrap::after{right:0;background:linear-gradient(270deg,var(--surface2),transparent)}
.tkr-scroll{display:flex;gap:48px;padding:0 24px;animation:scroll 38s linear infinite;white-space:nowrap}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.te{font-size:10.5px;color:var(--text2);display:flex;align-items:center;gap:7px}
.te b{color:var(--text);font-weight:600}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.dr{background:var(--red)}.da{background:var(--amber)}.dg{background:var(--green)}

/* ── LAYOUT ── */
.layout{
  flex:1;display:grid;
  grid-template-columns:300px 1fr 288px;
  grid-template-rows:1fr 196px;
  overflow:hidden;gap:1px;background:var(--border);
}
.panel{background:var(--surface);display:flex;flex-direction:column;overflow:hidden;transition:background .25s}

/* ── PANEL HEADER ── */
.ph{
  height:38px;padding:0 16px;
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;background:var(--surface2);border-bottom:1px solid var(--border);
  transition:background .25s;
}
.ph-name{font-size:8.5px;letter-spacing:2px;text-transform:uppercase;color:var(--text3);font-weight:700}
.pill{font-size:9px;padding:2px 9px;border-radius:3px;font-weight:700;letter-spacing:.5px}
.pr{background:var(--red-dim);color:var(--red);border:1px solid var(--red-bdr)}
.pa{background:var(--amb-dim);color:var(--amber);border:1px solid var(--amb-bdr)}
.pg{background:var(--grn-dim);color:var(--green);border:1px solid var(--grn-bdr)}
.pb{background:var(--blu-dim);color:var(--blue);border:1px solid var(--blu-bdr)}
.sc{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent}

/* ── TIMELINE ── */
.tl-wrap{padding:16px}
.tl-item{display:grid;grid-template-columns:62px 16px 1fr;gap:0 12px;margin-bottom:18px}
.tl-item:last-child{margin-bottom:0}
.tl-time{font-size:10px;color:var(--amber);font-weight:700;padding-top:2px;text-align:right}
.tl-spine{display:flex;flex-direction:column;align-items:center}
.tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:2px;border:2px solid}
.tl-dot.crit{background:var(--red-dim);border-color:var(--red)}
.tl-dot.warn{background:var(--amb-dim);border-color:var(--amber)}
.tl-dot.info{background:var(--blu-dim);border-color:var(--blue)}
.tl-dot.ok{background:var(--grn-dim);border-color:var(--green)}
.tl-wire{width:1px;flex:1;background:var(--border2);margin-top:6px}
.tl-tag{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:3px}
.tl-tag.crit{color:var(--red)}.tl-tag.warn{color:var(--amber)}.tl-tag.info{color:var(--blue)}.tl-tag.ok{color:var(--green)}
.tl-txt{font-size:11px;line-height:1.6;color:var(--text2)}
.tl-txt b{color:var(--text);font-weight:600}

/* ── METRICS ── */
.metrics{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--border);border-bottom:1px solid var(--border);flex-shrink:0;
}
.metric{
  background:var(--surface2);padding:14px 16px;position:relative;overflow:hidden;
  transition:background .25s;
}
.metric::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.metric.crit::before{background:var(--red)}
.metric.warn::before{background:var(--amber)}
.metric.ok::before{background:var(--green)}
.metric-glow{position:absolute;top:3px;left:0;right:0;bottom:0;opacity:.06;pointer-events:none;transition:opacity .25s}
.metric.crit .metric-glow{background:var(--red)}
.metric.warn .metric-glow{background:var(--amber)}
.metric.ok .metric-glow{background:var(--green)}
.m-name{font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:7px;font-weight:700}
.m-val{font-family:var(--display);font-size:26px;font-weight:700;line-height:1;margin-bottom:4px}
.m-val.crit{color:var(--red)}.m-val.warn{color:var(--amber)}.m-val.ok{color:var(--green)}
.m-unit{font-family:var(--mono);font-size:11px;color:var(--text3);font-weight:400}
.m-delta{font-size:10px;font-weight:700}
.m-delta.up{color:var(--red)}.m-delta.down{color:var(--green)}

/* ── LOGS ── */
.log-body{padding:0}
.log-row{
  display:grid;grid-template-columns:62px 50px 1fr;
  gap:0 10px;padding:5px 16px;
  border-bottom:1px solid var(--border);
  font-size:10.5px;line-height:1.5;
  transition:background .1s;
}
.log-row:hover{background:var(--surface2)}
.log-row.err{border-left:2px solid var(--red);background:var(--red-dim)}
.log-row.wrn{border-left:2px solid var(--amber);background:var(--amb-dim)}
.log-row.ok-row{border-left:2px solid var(--green)}
.log-t{color:var(--text3)}.log-lv{font-weight:700}
.log-lv.ERROR{color:var(--red)}.log-lv.WARN{color:var(--amber)}.log-lv.INFO{color:var(--blue)}.log-lv.OK{color:var(--green)}
.log-msg{color:var(--text2)}.hl{color:var(--blue);font-weight:600}

/* ── HYPOTHESES ── */
.hyp-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.hyp{border:1px solid var(--border);border-radius:6px;overflow:hidden;transition:box-shadow .2s,border-color .2s}
.hyp:hover{box-shadow:0 4px 20px var(--shadow)}
.hyp.top{border-color:var(--red-bdr);box-shadow:0 2px 12px var(--red-dim)}
.hyp-head{padding:11px 13px;background:var(--surface2);display:flex;align-items:flex-start;gap:10px;border-bottom:1px solid var(--border)}
.hyp-rank{font-size:9px;letter-spacing:1px;color:var(--text3);font-weight:700;flex-shrink:0;padding-top:2px}
.hyp-title{font-size:11.5px;font-weight:600;color:var(--text);flex:1;line-height:1.4;font-family:var(--display)}
.hyp-pct{font-family:var(--display);font-size:20px;font-weight:700;flex-shrink:0}
.hyp-pct.high{color:var(--red)}.hyp-pct.mid{color:var(--amber)}.hyp-pct.low{color:var(--text3)}
.hyp-bar{height:3px;background:var(--border)}
.hyp-fill{height:100%;transition:width 1s cubic-bezier(.4,0,.2,1)}
.hyp-fill.high{background:linear-gradient(90deg,var(--blue),var(--red))}
.hyp-fill.mid{background:linear-gradient(90deg,var(--blue),var(--amber))}
.hyp-fill.low{background:var(--text3)}
.hyp-desc{padding:10px 13px;font-size:10.5px;color:var(--text2);line-height:1.7}
.hyp-desc b{color:var(--text)}

/* ── CHAT ── */
.chat-panel{grid-column:1/-1;flex-direction:row!important}
.chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.chat-msgs{
  flex:1;overflow-y:auto;padding:12px 16px;
  display:flex;flex-direction:column;gap:9px;
  background:var(--bg);scrollbar-width:thin;scrollbar-color:var(--border) transparent;
  transition:background .25s;
}
.msg{display:flex;gap:10px;align-items:flex-start}
.av{width:26px;height:26px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
.av-sys{background:var(--blu-dim);color:var(--blue);border:1px solid var(--blu-bdr)}
.av-usr{background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.msg-author{font-size:8.5px;color:var(--text3);letter-spacing:1px;margin-bottom:2px;font-weight:700}
.msg-text{font-size:11.5px;color:var(--text);line-height:1.55}
.chat-in-row{
  padding:10px 12px;border-top:1px solid var(--border);
  display:flex;gap:8px;flex-shrink:0;background:var(--surface);transition:background .25s;
}
input.cin{
  flex:1;background:var(--surface2);border:1.5px solid var(--border2);
  border-radius:5px;padding:8px 14px;color:var(--text);
  font-family:var(--mono);font-size:11.5px;outline:none;transition:border-color .15s,background .25s;
}
input.cin:focus{border-color:var(--blue);background:var(--card)}
input.cin::placeholder{color:var(--text3)}
button.csend{
  background:var(--red);border:none;border-radius:5px;
  padding:0 18px;color:#fff;font-family:var(--display);
  font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:opacity .15s;
}
button.csend:hover{opacity:.85}

/* AI SIDE */
.ai-side{width:288px;flex-shrink:0;border-left:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface);transition:background .25s}
.ai-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.ai-card{background:var(--blu-dim);border:1px solid var(--blu-bdr);border-radius:6px;padding:12px 13px}
.ai-card-title{font-size:8px;letter-spacing:2px;color:var(--blue);text-transform:uppercase;margin-bottom:8px;font-weight:700}
.ai-card-body{font-size:10.5px;color:var(--text2);line-height:1.75}
.ai-card-body b{color:var(--text)}
.step{display:flex;gap:8px;margin-bottom:5px;align-items:flex-start}
.step-n{color:var(--amber);font-weight:700;font-size:11px;flex-shrink:0;font-family:var(--display)}
.big-pct{font-family:var(--display);font-size:24px;font-weight:700;color:var(--red)}

/* STATUS BAR */
.statusbar{
  height:24px;background:var(--surface2);border-top:1px solid var(--border);
  display:flex;align-items:center;padding:0 18px;gap:20px;flex-shrink:0;
  transition:background .25s;
}
.sb-item{font-size:9px;color:var(--text3);display:flex;align-items:center;gap:5px}
.sb-dot{width:5px;height:5px;border-radius:50%}
.sb-dot.g{background:var(--green);animation:blink 2s infinite}
.sb-dot.r{background:var(--red);animation:blink 1s infinite}
</style>
</head>
<body>

<!-- HEADER -->
<header class="hdr">
  <div class="hdr-left">
    <div class="inc-badge"><div class="pulse"></div><span>INCIDENT</span></div>
    <div class="sev-badge">SEV-1</div>
  </div>
  <div class="hdr-title">
    <h1>War Room — Incident Command Center</h1>
    <p id="iname">API Latency Spike — Production — cms-prod-arkema</p>
  </div>
  <div class="hdr-stats">
    <div class="hs"><div class="hs-l">Statut</div><div class="hs-v red">● ACTIF</div></div>
    <div class="hs"><div class="hs-l">Durée</div><div class="hs-v amber" id="dur">00:00:00</div></div>
    <div class="hs"><div class="hs-l">Heure</div><div class="hs-v" id="clk">--:--:--</div></div>
    <div class="hs"><div class="hs-l">Env</div><div class="hs-v green">PRODUCTION</div></div>
  </div>
  <div class="hdr-actions">
    <button class="theme-btn" onclick="toggleTheme()" title="Changer le thème">
      <div class="theme-btn-knob" id="theme-knob">🌙</div>
    </button>
  </div>
</header>

<!-- TICKER -->
<div class="ticker">
  <div class="tkr-tag">LIVE</div>
  <div class="tkr-wrap">
    <div class="tkr-scroll">
      <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema — 247 erreurs / 60 s</span>
      <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — seuil 2 000 ms dépassé — /api/checkout</span>
      <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78 / 100</span>
      <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1 — 4 min avant alerte</span>
      <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03 — seuil 85 % approché</span>
      <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b> — tous PoP opérationnels</span>
      <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema — 247 erreurs / 60 s</span>
      <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — seuil 2 000 ms dépassé — /api/checkout</span>
      <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78 / 100</span>
      <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1 — 4 min avant alerte</span>
      <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03 — seuil 85 % approché</span>
      <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b> — tous PoP opérationnels</span>
    </div>
  </div>
</div>

<!-- GRID -->
<div class="layout">

  <!-- TIMELINE -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Timeline</div><div class="pill pr">5 events</div></div>
    <div class="sc"><div class="tl-wrap" id="tl"></div></div>
  </div>

  <!-- CENTER -->
  <div class="panel">
    <div class="metrics" id="metrics"></div>
    <div class="ph"><div class="ph-name">Log stream — haproxy / cms-prod</div><div class="pill pa" id="lbadge">0 logs</div></div>
    <div class="sc"><div class="log-body" id="logs"></div></div>
  </div>

  <!-- HYPOTHESES -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Hypothèses classées par IA</div><div class="pill pa">3 ranked</div></div>
    <div class="sc"><div class="hyp-body" id="hyps"></div></div>
  </div>

  <!-- CHAT + AI -->
  <div class="panel chat-panel">
    <div class="chat-main">
      <div class="ph"><div class="ph-name">Chat d'équipe — temps réel</div><div class="pill pg" id="ws-pill">● connecté</div></div>
      <div class="chat-msgs" id="chat"></div>
      <div class="chat-in-row">
        <input class="cin" id="cin" placeholder="Message à l'équipe… (Entrée pour envoyer)" />
        <button class="csend" onclick="sendMsg()">ENVOYER</button>
      </div>
    </div>
    <div class="ai-side">
      <div class="ph"><div class="ph-name">Analyse IA</div><div class="pill pb">auto</div></div>
      <div class="ai-body">
        <div class="ai-card">
          <div class="ai-card-title">Résumé incident</div>
          <div class="ai-card-body">Pic de <b>504 errors</b> sur haproxy à <b>14:32:01</b>. Corrélation forte avec deploy <b>#847</b> — 4 min avant l'alerte. Latence p99 à <b>2 847 ms</b>.</div>
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
          <div class="ai-card-body">Régression <b>checkout-service v2.4.1</b><br><span class="big-pct">87%</span> de probabilité</div>
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
  <div class="sb-item" style="margin-left:auto;font-family:var(--mono)" id="sbclk"></div>
</div>

<script>
// ── THEME TOGGLE
function toggleTheme(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  document.getElementById('theme-knob').textContent=isDark?'☀️':'🌙';
}

// ── TIMELINE
const tlData=[
  {t:'14:32:01',cls:'crit',tag:'ALERT', txt:'Monitor Datadog — <b>p99 > 2 000 ms</b> sur /api/checkout — 247 erreurs 504'},
  {t:'14:31:44',cls:'crit',tag:'ERROR', txt:'<b>247 erreurs 504</b> en 60 s — haproxy cms-prod-arkema — équipe alertée'},
  {t:'14:28:14',cls:'warn',tag:'DEPLOY',txt:'Deploy <b>#847</b> par thomas.b — checkout-service v2.4.1 — non testé pré-prod'},
  {t:'14:25:00',cls:'info',tag:'TRAFIC',txt:'Trafic normal — <b>1 200 req/min</b> — pic déjeuner habituel'},
  {t:'14:20:33',cls:'ok',  tag:'HEALTH',txt:'Tous health checks <b>OK</b> — DB, cache, CDN opérationnels'}
];
const tlEl=document.getElementById('tl');
tlData.forEach((e,i)=>{
  const wire=i<tlData.length-1?'<div class="tl-wire"></div>':'';
  tlEl.innerHTML+=\`<div class="tl-item">
    <div class="tl-time">\${e.t}</div>
    <div class="tl-spine"><div class="tl-dot \${e.cls}"></div>\${wire}</div>
    <div><div class="tl-tag \${e.cls}">\${e.tag}</div><div class="tl-txt">\${e.txt}</div></div>
  </div>\`;
});

// ── METRICS
const mData=[
  {n:'P99 Latency',    v:'2 847',u:'ms',    d:'↑ +1 200 ms',dd:'up',  c:'crit'},
  {n:'Error Rate',     v:'18.4', u:'%',     d:'↑ +17.2 %',  dd:'up',  c:'crit'},
  {n:'Throughput',     v:'843',  u:'req/s', d:'↓ −357',      dd:'down',c:'warn'},
  {n:'DB Connections', v:'78',   u:'/ 100', d:'↑ +12',       dd:'up',  c:'warn'},
  {n:'Memory',         v:'84',   u:'%',     d:'↑ +8 %',      dd:'up',  c:'warn'},
  {n:'CPU',            v:'31',   u:'%',     d:'↑ +2 %',      dd:'up',  c:'ok'}
];
const mEl=document.getElementById('metrics');
mData.forEach(m=>{
  mEl.innerHTML+=\`<div class="metric \${m.c}">
    <div class="metric-glow"></div>
    <div class="m-name">\${m.n}</div>
    <div class="m-val \${m.c}">\${m.v} <span class="m-unit">\${m.u}</span></div>
    <div class="m-delta \${m.dd}">\${m.d}</div>
  </div>\`;
});

// ── HYPOTHESES
const hData=[
  {r:'#1',cls:'top',t:'Régression — Deploy #847',p:'87',pc:'high',d:'Deploy <b>4 min avant</b> l\'alerte. Corrélation temporelle très forte. checkout-service v2.4.1 non validé en pré-prod.'},
  {r:'#2',cls:'',   t:'Saturation connection pool DB',p:'65',pc:'mid', d:'orders_db à <b>78 / 100</b> connexions. Requêtes lentes détectées. Facteur aggravant probable.'},
  {r:'#3',cls:'',   t:'Pic de trafic anormal',p:'23',pc:'low', d:'Trafic légèrement au-dessus de la moyenne déjeuner — dans les <b>normes historiques</b>.'}
];
const hEl=document.getElementById('hyps');
hData.forEach(h=>{
  hEl.innerHTML+=\`<div class="hyp \${h.cls}">
    <div class="hyp-head">
      <div class="hyp-rank">\${h.r}</div>
      <div class="hyp-title">\${h.t}</div>
      <div class="hyp-pct \${h.pc}">\${h.p}%</div>
    </div>
    <div class="hyp-bar"><div class="hyp-fill \${h.pc}" style="width:0%"></div></div>
    <div class="hyp-desc">\${h.d}</div>
  </div>\`;
});
// Animate bars after render
setTimeout(()=>{
  document.querySelectorAll('.hyp-fill').forEach((el,i)=>{
    el.style.width=hData[i].p+'%';
  });
},100);

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
  {t:'14:20:33',l:'OK',   cls:'ok-row',m:'health-check: tous services OK — DB, cache, CDN opérationnels'}
];
const lEl=document.getElementById('logs');
const lBadge=document.getElementById('lbadge');
let lc=0;
function addLog(t,l,cls,m){
  const row=document.createElement('div');
  row.className='log-row '+cls;
  row.innerHTML='<span class="log-t">'+t+'</span><span class="log-lv '+l+'">'+l+'</span><span class="log-msg">'+m+'</span>';
  lEl.appendChild(row);
  lBadge.textContent=(++lc)+' logs';
  lEl.parentElement.scrollTop=lEl.parentElement.scrollHeight;
}
logData.forEach((x,i)=>setTimeout(()=>addLog(x.t,x.l,x.cls,x.m),100+i*110));

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

// ── WEBSOCKET CHAT
const ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
const chatEl=document.getElementById('chat');
const me='User'+Math.floor(Math.random()*90+10);

function addMsg(a,t,sys){
  const init=sys?'AI':a.slice(0,2).toUpperCase();
  const div=document.createElement('div');
  div.className='msg';
  div.innerHTML='<div class="av '+(sys?'av-sys':'av-usr')+'">'+init+'</div><div><div class="msg-author">'+a+'</div><div class="msg-text">'+t+'</div></div>';
  chatEl.appendChild(div);
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
  document.getElementById('sbclk').textContent=t;
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
  ws.send(JSON.stringify({ author: 'Système', text: 'Bienvenue dans la War Room. Connecté en temps réel.' }));
  ws.on('message', data => {
    wss.clients.forEach(c => { if(c.readyState===WebSocket.OPEN) c.send(data.toString()); });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('War Room sur le port ' + PORT));
