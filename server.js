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
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1117;
  --surface:#1a1d27;
  --surface2:#222536;
  --border:#2e3347;
  --text:#f0f2f8;
  --sub:#8b92a8;
  --mono:'IBM Plex Mono',monospace;
  --sans:'IBM Plex Sans',sans-serif;
  --red:#f03e3e;
  --red-bg:rgba(240,62,62,0.12);
  --red-border:rgba(240,62,62,0.35);
  --amber:#f59f00;
  --amber-bg:rgba(245,159,0,0.12);
  --amber-border:rgba(245,159,0,0.35);
  --green:#2fcc5f;
  --green-bg:rgba(47,204,95,0.1);
  --green-border:rgba(47,204,95,0.3);
  --blue:#4dabf7;
  --blue-bg:rgba(77,171,247,0.1);
  --blue-border:rgba(77,171,247,0.3);
}
html,body{height:100%;overflow:hidden;font-family:var(--sans)}
body{background:var(--bg);color:var(--text);display:flex;flex-direction:column}

/* ── HEADER ── */
.hdr{height:52px;display:flex;align-items:stretch;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface)}
.hdr-badge{display:flex;align-items:center;gap:9px;padding:0 22px;border-right:1px solid var(--red-border);background:var(--red-bg);flex-shrink:0}
.pulse{width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0;animation:blink 1s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.hdr-badge strong{font-size:11px;letter-spacing:2.5px;color:var(--red);font-family:var(--mono)}
.hdr-title{flex:1;display:flex;align-items:center;gap:10px;padding:0 22px;font-size:15px;font-weight:700;color:var(--text)}
.hdr-title span{color:var(--sub);font-weight:400;font-size:13px}
.hdr-stats{display:flex}
.hstat{display:flex;flex-direction:column;justify-content:center;padding:0 20px;border-left:1px solid var(--border);gap:3px;min-width:90px}
.hstat-l{font-size:9px;letter-spacing:1.5px;color:var(--sub);text-transform:uppercase;font-family:var(--mono)}
.hstat-v{font-size:13px;font-weight:700;font-family:var(--mono)}
.v-red{color:var(--red)} .v-amber{color:var(--amber)} .v-green{color:var(--green)} .v-blue{color:var(--blue)}

/* ── TICKER ── */
.ticker{height:28px;background:#0a0c12;border-bottom:1px solid var(--border);display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.tkr-tag{font-size:9px;letter-spacing:2px;color:var(--red);padding:0 14px;border-right:1px solid var(--red-border);height:100%;display:flex;align-items:center;flex-shrink:0;background:var(--red-bg);font-family:var(--mono)}
.tkr-scroll{display:flex;gap:56px;padding:0 28px;animation:scroll 32s linear infinite;white-space:nowrap}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.te{font-size:11px;color:var(--sub);display:flex;align-items:center;gap:8px;font-family:var(--mono)}
.te b{color:var(--text)}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.dr{background:var(--red)} .da{background:var(--amber)} .dg{background:var(--green)}

/* ── LAYOUT ── */
.layout{flex:1;display:grid;grid-template-columns:310px 1fr 290px;grid-template-rows:1fr 190px;overflow:hidden;gap:1px;background:var(--border)}

/* ── PANEL ── */
.panel{background:var(--bg);display:flex;flex-direction:column;overflow:hidden}
.ph{height:38px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--surface);border-bottom:1px solid var(--border)}
.ph-name{font-size:10px;letter-spacing:2px;color:var(--sub);text-transform:uppercase;font-family:var(--mono)}
.badge{font-size:9px;padding:3px 10px;border-radius:3px;font-weight:600;font-family:var(--mono);letter-spacing:.5px}
.br{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border)}
.ba{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-border)}
.bg{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}
.bb{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-border)}
.scroll{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent}

/* ── TIMELINE ── */
.tl-wrap{padding:16px}
.tl-item{display:grid;grid-template-columns:62px 14px 1fr;gap:0 12px;margin-bottom:18px}
.tl-item:last-child{margin-bottom:0}
.tl-time{font-size:10px;color:var(--amber);font-family:var(--mono);padding-top:2px;text-align:right;font-weight:600}
.tl-spine{display:flex;flex-direction:column;align-items:center}
.tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:2px;border:2px solid}
.tl-dot.crit{background:var(--red-bg);border-color:var(--red)}
.tl-dot.warn{background:var(--amber-bg);border-color:var(--amber)}
.tl-dot.info{background:var(--blue-bg);border-color:var(--blue)}
.tl-dot.ok{background:var(--green-bg);border-color:var(--green)}
.tl-line{width:1px;flex:1;background:var(--border);margin-top:6px}
.tl-tag{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;font-family:var(--mono);margin-bottom:3px;font-weight:600}
.tl-tag.crit{color:var(--red)} .tl-tag.warn{color:var(--amber)} .tl-tag.info{color:var(--blue)} .tl-tag.ok{color:var(--green)}
.tl-txt{font-size:12px;line-height:1.55;color:var(--text)}
.tl-txt b{color:var(--amber)}

/* ── METRICS ── */
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-bottom:1px solid var(--border);flex-shrink:0}
.metric{background:var(--surface);padding:14px 16px;position:relative;overflow:hidden}
.metric::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.metric.crit::before{background:var(--red)}
.metric.warn::before{background:var(--amber)}
.metric.ok::before{background:var(--green)}
.m-name{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub);margin-bottom:6px;font-family:var(--mono)}
.m-val{font-size:26px;font-weight:700;line-height:1;margin-bottom:4px}
.m-val.crit{color:var(--red)} .m-val.warn{color:var(--amber)} .m-val.ok{color:var(--green)}
.m-unit{font-size:12px;font-weight:400;color:var(--sub);margin-left:2px}
.m-delta{font-size:11px;font-family:var(--mono)}
.m-delta.up{color:var(--red)} .m-delta.down{color:var(--green)}

/* ── LOGS ── */
.logs-wrap{padding:8px 14px}
.log-row{display:grid;grid-template-columns:62px 52px 1fr;gap:0 10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px;line-height:1.5;font-family:var(--mono)}
.log-t{color:var(--sub)}
.log-lv{font-weight:600}
.log-lv.ERROR{color:var(--red)} .log-lv.WARN{color:var(--amber)} .log-lv.INFO{color:var(--blue)} .log-lv.OK{color:var(--green)}
.log-msg{color:var(--text)}
.hl{color:var(--blue)}

/* ── HYPOTHESES ── */
.hyp-wrap{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.hyp{background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden}
.hyp.top{border-color:var(--red-border)}
.hyp-head{padding:12px 14px;display:flex;align-items:flex-start;gap:10px;background:var(--surface2)}
.hyp-rank{font-size:10px;color:var(--sub);font-family:var(--mono);flex-shrink:0;padding-top:2px;font-weight:600}
.hyp-title{font-size:12px;font-weight:600;color:var(--text);flex:1;line-height:1.4}
.hyp-pct{font-size:22px;font-weight:700;flex-shrink:0;font-family:var(--mono)}
.hyp-pct.high{color:var(--red)} .hyp-pct.mid{color:var(--amber)} .hyp-pct.low{color:var(--sub)}
.hyp-bar{height:3px;background:var(--border)}
.hyp-fill{height:100%;transition:width .8s ease}
.hyp-fill.high{background:linear-gradient(90deg,var(--blue),var(--red))}
.hyp-fill.mid{background:linear-gradient(90deg,var(--blue),var(--amber))}
.hyp-fill.low{background:var(--sub)}
.hyp-desc{padding:10px 14px;font-size:11px;color:var(--sub);line-height:1.65;border-top:1px solid var(--border)}
.hyp-desc b{color:var(--text)}

/* ── CHAT ── */
.chat-panel{grid-column:1/-1;flex-direction:row!important}
.chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.chat-msgs{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.msg{display:flex;gap:10px}
.av{width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;font-family:var(--mono)}
.av-sys{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-border)}
.av-usr{background:var(--surface2);color:var(--sub);border:1px solid var(--border)}
.msg-author{font-size:9px;color:var(--sub);letter-spacing:1px;margin-bottom:2px;font-family:var(--mono)}
.msg-text{font-size:12px;color:var(--text);line-height:1.5}
.chat-input{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;background:var(--surface)}
input.cin{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:8px 14px;color:var(--text);font-family:var(--mono);font-size:12px;outline:none}
input.cin:focus{border-color:var(--blue)}
input.cin::placeholder{color:var(--sub)}
button.csend{background:var(--red);border:none;border-radius:4px;padding:0 20px;color:#fff;font-family:var(--mono);font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1px;height:36px}
button.csend:hover{opacity:.85}
.ai-side{width:290px;flex-shrink:0;border-left:1px solid var(--border);display:flex;flex-direction:column}
.ai-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.ai-card{background:var(--surface2);border:1px solid var(--blue-border);border-radius:6px;padding:12px}
.ai-card-title{font-size:9px;letter-spacing:2px;color:var(--blue);text-transform:uppercase;margin-bottom:8px;font-family:var(--mono)}
.ai-card-body{font-size:11px;color:var(--sub);line-height:1.7}
.ai-card-body b{color:var(--text)}
.ai-card-body .step{display:flex;gap:8px;margin-bottom:4px;align-items:flex-start}
.ai-card-body .step-n{color:var(--amber);font-weight:700;flex-shrink:0;font-family:var(--mono);font-size:11px}
</style>
</head>
<body>

<header class="hdr">
  <div class="hdr-badge"><div class="pulse"></div><strong>INCIDENT</strong></div>
  <div class="hdr-title">War Room — Incident Command <span id="iname">API Latency Spike — Production</span></div>
  <div class="hdr-stats">
    <div class="hstat"><div class="hstat-l">Statut</div><div class="hstat-v v-red">● ACTIF</div></div>
    <div class="hstat"><div class="hstat-l">Durée</div><div class="hstat-v v-amber" id="dur">00:00:00</div></div>
    <div class="hstat"><div class="hstat-l">Heure</div><div class="hstat-v" id="clk">--:--:--</div></div>
    <div class="hstat"><div class="hstat-l">Sévérité</div><div class="hstat-v v-red">SEV-1</div></div>
    <div class="hstat"><div class="hstat-l">Env</div><div class="hstat-v">PRODUCTION</div></div>
  </div>
</header>

<div class="ticker">
  <div class="tkr-tag">LIVE</div>
  <div class="tkr-scroll">
    <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema</span>
    <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78/100</span>
    <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1</span>
    <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b></span>
    <span class="te"><span class="dot dr"></span><b>504 errors</b> — haproxy cms-prod-arkema</span>
    <span class="te"><span class="dot da"></span>p99 latency <b>2 847 ms</b> — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections <b>stables</b> — orders_db 78/100</span>
    <span class="te"><span class="dot dr"></span>Deploy <b>#847</b> — thomas.b — checkout-service v2.4.1</span>
    <span class="te"><span class="dot da"></span>Memory <b>84 %</b> — app-server-03</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare <b>nominal</b></span>
  </div>
</div>

<div class="layout">

  <!-- TIMELINE -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Timeline</div><div class="badge br">5 events</div></div>
    <div class="scroll"><div class="tl-wrap" id="tl"></div></div>
  </div>

  <!-- CENTER -->
  <div class="panel">
    <div class="metrics" id="metrics"></div>
    <div class="ph"><div class="ph-name">Log stream — haproxy / cms-prod</div><div class="badge ba" id="lbadge">0 logs</div></div>
    <div class="scroll"><div class="logs-wrap" id="logs"></div></div>
  </div>

  <!-- HYPOTHESES -->
  <div class="panel">
    <div class="ph"><div class="ph-name">Hypothèses classées</div><div class="badge ba">3 ranked</div></div>
    <div class="scroll"><div class="hyp-wrap" id="hyps"></div></div>
  </div>

  <!-- CHAT -->
  <div class="panel chat-panel">
    <div class="chat-main">
      <div class="ph"><div class="ph-name">Chat d'équipe</div><div class="badge bg" id="ws-badge">● connecté</div></div>
      <div class="chat-msgs" id="chat"></div>
      <div class="chat-input">
        <input class="cin" id="cin" placeholder="Message à l'équipe... (Entrée pour envoyer)" />
        <button class="csend" onclick="sendMsg()">ENVOYER</button>
      </div>
    </div>
    <div class="ai-side">
      <div class="ph"><div class="ph-name">Analyse IA</div><div class="badge bb">auto</div></div>
      <div class="ai-body">
        <div class="ai-card">
          <div class="ai-card-title">Résumé incident</div>
          <div class="ai-card-body">Pic de <b>504 errors</b> sur haproxy à <b>14:32:01</b>. Forte corrélation avec deploy <b>#847</b> effectué 4 min avant l'alerte. Latence p99 à <b>2 847 ms</b> (seuil : 2 000 ms).</div>
        </div>
        <div class="ai-card">
          <div class="ai-card-title">Actions recommandées</div>
          <div class="ai-card-body">
            <div class="step"><span class="step-n">1.</span><span>Rollback deploy <b>#847</b> immédiatement</span></div>
            <div class="step"><span class="step-n">2.</span><span>Vérifier connection pool <b>orders_db</b></span></div>
            <div class="step"><span class="step-n">3.</span><span>Monitorer p99 après rollback</span></div>
          </div>
        </div>
        <div class="ai-card">
          <div class="ai-card-title">Cause probable</div>
          <div class="ai-card-body">Régression <b>checkout-service v2.4.1</b> — probabilité estimée <b>87 %</b></div>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
// ── TIMELINE ──
const tlData = [
  {t:'14:32:01',cls:'crit',tag:'ALERT', txt:'Monitor Datadog déclenché — <b>p99 > 2 000 ms</b> sur /api/checkout'},
  {t:'14:31:44',cls:'crit',tag:'ERROR', txt:'<b>247 erreurs 504</b> en 60 s — haproxy cms-prod-arkema'},
  {t:'14:28:14',cls:'warn',tag:'DEPLOY',txt:'Deploy <b>#847</b> mergé par thomas.b — checkout-service v2.4.1'},
  {t:'14:25:00',cls:'info',tag:'TRAFIC',txt:'Trafic normal — <b>1 200 req/min</b> sur /api/checkout'},
  {t:'14:20:33',cls:'ok',  tag:'HEALTH',txt:'Tous health checks OK — DB, cache, CDN opérationnels'}
];
const tlEl = document.getElementById('tl');
tlData.forEach((e,i) => {
  tlEl.innerHTML += \`<div class="tl-item">
    <div class="tl-time">\${e.t}</div>
    <div class="tl-spine"><div class="tl-dot \${e.cls}"></div>\${i<tlData.length-1?'<div class="tl-line"></div>':''}</div>
    <div><div class="tl-tag \${e.cls}">\${e.tag}</div><div class="tl-txt">\${e.txt}</div></div>
  </div>\`;
});

// ── METRICS ──
const mData = [
  {n:'P99 Latency',   v:'2 847', u:'ms',    d:'↑ +1 200 ms', dd:'up',   c:'crit'},
  {n:'Error Rate',    v:'18.4',  u:'%',     d:'↑ +17.2 %',   dd:'up',   c:'crit'},
  {n:'Throughput',    v:'843',   u:'req/s', d:'↓ −357 req/s', dd:'down', c:'warn'},
  {n:'DB Connections',v:'78',    u:'/ 100', d:'↑ +12',        dd:'up',   c:'warn'},
  {n:'Memory',        v:'84',    u:'%',     d:'↑ +8 %',       dd:'up',   c:'warn'},
  {n:'CPU',           v:'31',    u:'%',     d:'↑ +2 %',       dd:'up',   c:'ok'}
];
const mEl = document.getElementById('metrics');
mData.forEach(m => {
  mEl.innerHTML += \`<div class="metric \${m.c}">
    <div class="m-name">\${m.n}</div>
    <div class="m-val \${m.c}">\${m.v}<span class="m-unit">\${m.u}</span></div>
    <div class="m-delta \${m.dd}">\${m.d}</div>
  </div>\`;
});

// ── HYPOTHESES ──
const hData = [
  {r:'#1',cls:'top', t:'Régression introduite par Deploy #847',        p:'87',pc:'high',d:'Deploy effectué <b>4 min avant</b> l\'alerte. Corrélation temporelle très forte. checkout-service v2.4.1 non validé en pré-prod.'},
  {r:'#2',cls:'',    t:'Saturation du connection pool base de données', p:'65',pc:'mid', d:'orders_db à <b>78/100</b> connexions. Requêtes lentes détectées. Facteur aggravant probable.'},
  {r:'#3',cls:'',    t:'Pic de trafic externe anormal',                 p:'23',pc:'low', d:'Trafic légèrement au-dessus de la moyenne déjeuner, mais dans les <b>normes historiques</b>.'}
];
const hEl = document.getElementById('hyps');
hData.forEach(h => {
  hEl.innerHTML += \`<div class="hyp \${h.cls}">
    <div class="hyp-head">
      <div class="hyp-rank">\${h.r}</div>
      <div class="hyp-title">\${h.t}</div>
      <div class="hyp-pct \${h.pc}">\${h.p}%</div>
    </div>
    <div class="hyp-bar"><div class="hyp-fill \${h.pc}" style="width:\${h.p}%"></div></div>
    <div class="hyp-desc">\${h.d}</div>
  </div>\`;
});

// ── LOGS ──
const logData = [
  {t:'14:32:08',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 847 ms'},
  {t:'14:32:07',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 3 102 ms'},
  {t:'14:32:06',l:'WARN', m:'checkout-service: DB query slow — <span class="hl">orders_db</span> — 1 847 ms (seuil 500 ms)'},
  {t:'14:32:05',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 991 ms'},
  {t:'14:32:04',l:'WARN', m:'checkout-service: connection pool à <span class="hl">78 %</span> de capacité'},
  {t:'14:32:01',l:'ERROR',m:'datadog-agent: monitor <span class="hl">p99_latency</span> dépassé — 2 847 ms > 2 000 ms'},
  {t:'14:31:58',l:'WARN', m:'app-server-03: mémoire <span class="hl">84 %</span> — proche du seuil critique'},
  {t:'14:31:44',l:'ERROR',m:'haproxy: <span class="hl">247</span> erreurs 504 en 60 s — équipe notifiée'},
  {t:'14:28:14',l:'INFO', m:'deploy-agent: checkout-service <span class="hl">v2.4.1</span> déployé par thomas.b — #847'},
  {t:'14:25:00',l:'INFO', m:'traffic-monitor: débit <span class="hl">1 200 req/min</span> — plage normale'},
  {t:'14:20:33',l:'OK',   m:'health-check: tous services OK — DB, cache, CDN opérationnels'}
];
const lEl = document.getElementById('logs');
const lBadge = document.getElementById('lbadge');
let lc = 0;
function addLog(t,l,m) {
  lEl.innerHTML += \`<div class="log-row">
    <span class="log-t">\${t}</span>
    <span class="log-lv \${l}">\${l}</span>
    <span class="log-msg">\${m}</span>
  </div>\`;
  lBadge.textContent = (++lc) + ' logs';
  lEl.parentElement.scrollTop = lEl.parentElement.scrollHeight;
}
logData.forEach((x,i) => setTimeout(() => addLog(x.t,x.l,x.m), i * 120));

const liveLogs = [
  {l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 3 247 ms'},
  {l:'WARN', m:'checkout-service: DB query slow — <span class="hl">2 100 ms</span>'},
  {l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 2 891 ms'},
  {l:'WARN', m:'memory: app-server-03 à <span class="hl">86 %</span>'}
];
let li = 0;
setInterval(() => {
  const n = new Date();
  const t = [n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  const f = liveLogs[li++ % liveLogs.length];
  addLog(t, f.l, f.m);
}, 5000);

// ── CHAT WS ──
const ws = new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
const chatEl = document.getElementById('chat');
const me = 'User' + Math.floor(Math.random()*90+10);

function addMsg(author, text, sys) {
  const init = sys ? 'AI' : author.slice(0,2).toUpperCase();
  chatEl.innerHTML += \`<div class="msg">
    <div class="av \${sys?'av-sys':'av-usr'}">\${init}</div>
    <div><div class="msg-author">\${author}</div><div class="msg-text">\${text}</div></div>
  </div>\`;
  chatEl.scrollTop = chatEl.scrollHeight;
}

ws.onopen = () => addMsg('Système', 'War Room activée — WebSocket connecté. En attente de l\'équipe...', true);
ws.onmessage = e => { const d = JSON.parse(e.data); addMsg(d.author, d.text, d.author === 'Système'); };

function sendMsg() {
  const inp = document.getElementById('cin');
  if (!inp.value.trim()) return;
  ws.send(JSON.stringify({ author: me, text: inp.value.trim() }));
  inp.value = '';
}
document.getElementById('cin').addEventListener('keypress', e => { if(e.key==='Enter') sendMsg(); });

// ── CLOCK + DURATION ──
const t0 = Date.now();
setInterval(() => {
  const n = new Date();
  document.getElementById('clk').textContent =
    [n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  const s = Math.floor((Date.now()-t0)/1000);
  document.getElementById('dur').textContent =
    [Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(x=>String(x).padStart(2,'0')).join(':');
}, 1000);
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
