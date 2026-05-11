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
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:    #0b0d11;
  --bg2:   #10131a;
  --bg3:   #161922;
  --bdr:   rgba(255,255,255,0.07);
  --bdr2:  rgba(255,255,255,0.13);
  --text:  #dde1ea;
  --muted: #4a5168;
  --red:   #f03e3e;
  --amber: #f59f00;
  --green: #37b24d;
  --blue:  #4dabf7;
  --mono:  'IBM Plex Mono', monospace;
  --sans:  'IBM Plex Sans', sans-serif;
}
html,body { height:100%; overflow:hidden; }
body { background:var(--bg); color:var(--text); font-family:var(--mono); display:flex; flex-direction:column; }

/* HEADER */
.hdr { display:flex; align-items:stretch; height:48px; border-bottom:1px solid var(--bdr2); flex-shrink:0; }
.hdr-inc { display:flex; align-items:center; gap:8px; padding:0 20px; border-right:1px solid var(--bdr2); background:rgba(240,62,62,.08); }
.pulse { width:7px; height:7px; border-radius:50%; background:var(--red); animation:blink 1.2s ease-in-out infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
.hdr-inc span { font-size:11px; font-weight:600; letter-spacing:2px; color:var(--red); }
.hdr-ttl { flex:1; display:flex; align-items:center; padding:0 24px; font-family:var(--sans); font-size:14px; font-weight:600; gap:8px; }
.hdr-ttl small { color:var(--muted); font-weight:400; font-size:12px; }
.hdr-meta { display:flex; }
.mi { display:flex; flex-direction:column; justify-content:center; padding:0 18px; border-left:1px solid var(--bdr); gap:2px; }
.mi-l { font-size:9px; letter-spacing:1.5px; color:var(--muted); text-transform:uppercase; }
.mi-v { font-size:12px; font-weight:600; }
.mi-v.red { color:var(--red); } .mi-v.amber { color:var(--amber); }

/* TICKER */
.ticker { height:26px; background:var(--bg2); border-bottom:1px solid var(--bdr); display:flex; align-items:center; overflow:hidden; flex-shrink:0; }
.tkr-tag { font-size:9px; letter-spacing:2px; color:var(--red); padding:0 14px; border-right:1px solid var(--bdr2); height:100%; display:flex; align-items:center; flex-shrink:0; background:rgba(240,62,62,.06); }
.tkr-inner { display:flex; gap:48px; padding:0 24px; animation:scroll 30s linear infinite; white-space:nowrap; }
@keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.te { font-size:11px; color:var(--muted); display:flex; align-items:center; gap:7px; }
.dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.dr { background:var(--red); } .da { background:var(--amber); } .dg { background:var(--green); }

/* LAYOUT */
.grid { display:grid; grid-template-columns:300px 1fr 280px; grid-template-rows:1fr 180px; flex:1; overflow:hidden; gap:1px; background:var(--bdr); }
.panel { background:var(--bg); display:flex; flex-direction:column; overflow:hidden; }
.ph { padding:10px 16px; border-bottom:1px solid var(--bdr); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; background:var(--bg2); }
.pn { font-size:9px; letter-spacing:2px; color:var(--muted); text-transform:uppercase; font-family:var(--sans); }
.pill { font-size:9px; padding:2px 9px; border-radius:3px; letter-spacing:1px; font-weight:600; }
.pr { background:rgba(240,62,62,.12); color:var(--red);   border:1px solid rgba(240,62,62,.25); }
.pa { background:rgba(245,159,0,.1);  color:var(--amber); border:1px solid rgba(245,159,0,.25); }
.pg { background:rgba(55,178,77,.1);  color:var(--green); border:1px solid rgba(55,178,77,.25); }
.pb { background:rgba(77,171,247,.1); color:var(--blue);  border:1px solid rgba(77,171,247,.25); }
.pb2 { flex:1; overflow-y:auto; padding:14px 16px; scrollbar-width:thin; scrollbar-color:var(--bdr2) transparent; }

/* TIMELINE */
.tli { display:grid; grid-template-columns:58px 16px 1fr; gap:0 10px; padding-bottom:16px; }
.tlt { font-size:10px; color:var(--amber); padding-top:1px; text-align:right; }
.tlc { display:flex; flex-direction:column; align-items:center; }
.tld { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.tld.crit { background:var(--red); box-shadow:0 0 5px var(--red); }
.tld.warn { background:var(--amber); } .tld.info { background:var(--blue); } .tld.ok { background:var(--green); }
.tll { width:1px; flex:1; background:var(--bdr2); margin-top:5px; }
.tltype { font-size:8px; letter-spacing:1.5px; color:var(--muted); text-transform:uppercase; margin-bottom:3px; }
.tltext { font-size:11px; line-height:1.55; color:var(--text); }
.tltext b { color:var(--amber); font-weight:600; }

/* METRICS */
.mrow { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--bdr); flex-shrink:0; border-bottom:1px solid var(--bdr); }
.mc { background:var(--bg); padding:14px 16px; position:relative; }
.mc::after { content:''; position:absolute; left:0; bottom:0; right:0; height:2px; }
.mc.crit::after { background:var(--red); } .mc.warn::after { background:var(--amber); } .mc.ok::after { background:var(--green); }
.mn { font-size:9px; letter-spacing:1.5px; color:var(--muted); text-transform:uppercase; margin-bottom:8px; font-family:var(--sans); }
.mv { font-family:var(--sans); font-size:24px; font-weight:600; line-height:1; margin-bottom:4px; }
.mv.crit { color:var(--red); } .mv.warn { color:var(--amber); } .mv.ok { color:var(--green); }
.mu { font-family:var(--mono); font-size:11px; color:var(--muted); font-weight:400; }
.md { font-size:10px; color:var(--muted); margin-top:2px; }
.md.up { color:var(--red); } .md.down { color:var(--green); }

/* LOGS */
.logstream { flex:1; overflow-y:auto; padding:10px 14px; scrollbar-width:thin; scrollbar-color:var(--bdr2) transparent; }
.ll { display:grid; grid-template-columns:60px 48px 1fr; gap:0 10px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,.02); font-size:10px; line-height:1.6; }
.lt { color:var(--muted); }
.llv { font-weight:600; }
.llv.ERROR { color:var(--red); } .llv.WARN { color:var(--amber); } .llv.INFO { color:var(--blue); } .llv.OK { color:var(--green); }
.lm { color:var(--text); } .lm .hl { color:var(--blue); }

/* HYPOTHESES */
.hyp { border:1px solid var(--bdr); border-radius:4px; margin-bottom:10px; overflow:hidden; }
.hyp.top { border-color:rgba(240,62,62,.3); }
.hh { padding:10px 12px; background:var(--bg2); display:flex; align-items:flex-start; gap:10px; }
.hr { font-size:9px; color:var(--muted); flex-shrink:0; padding-top:1px; }
.ht { font-size:11px; font-weight:600; color:var(--text); flex:1; line-height:1.4; font-family:var(--sans); }
.hp { font-family:var(--sans); font-size:18px; font-weight:600; flex-shrink:0; }
.hp.high { color:var(--red); } .hp.mid { color:var(--amber); } .hp.low { color:var(--muted); }
.hbar { height:2px; background:var(--bg3); }
.hfill { height:100%; background:linear-gradient(90deg,var(--blue),var(--red)); }
.hdesc { padding:8px 12px; font-size:10px; color:var(--muted); line-height:1.65; border-top:1px solid var(--bdr); }

/* CHAT */
.chat-panel { grid-column:1/-1; flex-direction:row !important; }
.chat-l { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.chat-msgs { flex:1; overflow-y:auto; padding:10px 16px; display:flex; flex-direction:column; gap:8px; scrollbar-width:thin; scrollbar-color:var(--bdr2) transparent; }
.msg { display:flex; gap:10px; align-items:flex-start; }
.av { width:22px; height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:600; flex-shrink:0; }
.av-s { background:rgba(77,171,247,.1); color:var(--blue); border:1px solid rgba(77,171,247,.2); }
.av-u { background:rgba(255,255,255,.04); color:var(--muted); border:1px solid var(--bdr2); }
.ma { font-size:9px; color:var(--muted); letter-spacing:1px; margin-bottom:2px; }
.mt { font-size:11px; color:var(--text); line-height:1.5; }
.chat-in-row { padding:8px 10px; border-top:1px solid var(--bdr); display:flex; gap:6px; flex-shrink:0; }
input.ci { flex:1; background:var(--bg2); border:1px solid var(--bdr2); border-radius:3px; padding:6px 12px; color:var(--text); font-family:var(--mono); font-size:11px; outline:none; }
input.ci:focus { border-color:var(--blue); }
input.ci::placeholder { color:var(--muted); }
button.sb { background:var(--red); border:none; border-radius:3px; padding:0 16px; color:white; font-family:var(--mono); font-size:11px; font-weight:600; cursor:pointer; letter-spacing:1px; }
button.sb:hover { opacity:.85; }
.chat-r { width:280px; flex-shrink:0; border-left:1px solid var(--bdr); display:flex; flex-direction:column; }
.ai-body { flex:1; overflow-y:auto; padding:12px 14px; scrollbar-width:thin; scrollbar-color:var(--bdr2) transparent; display:flex; flex-direction:column; gap:10px; }
.aib { background:rgba(77,171,247,.04); border:1px solid rgba(77,171,247,.1); border-radius:4px; padding:10px 12px; }
.aib-t { font-size:9px; letter-spacing:1.5px; color:var(--blue); text-transform:uppercase; margin-bottom:6px; font-family:var(--sans); }
.aib-x { font-size:10px; color:var(--muted); line-height:1.7; }
.aib-x b { color:var(--text); font-weight:600; }
</style>
</head>
<body>

<header class="hdr">
  <div class="hdr-inc"><div class="pulse"></div><span>INCIDENT</span></div>
  <div class="hdr-ttl">War Room — Incident Command<small id="iname">API Latency Spike — Production</small></div>
  <div class="hdr-meta">
    <div class="mi"><div class="mi-l">Statut</div><div class="mi-v red">● ACTIF</div></div>
    <div class="mi"><div class="mi-l">Durée</div><div class="mi-v amber" id="dur">00:00:00</div></div>
    <div class="mi"><div class="mi-l">Heure</div><div class="mi-v" id="clk">--:--:--</div></div>
    <div class="mi"><div class="mi-l">Sévérité</div><div class="mi-v red">SEV-1</div></div>
    <div class="mi"><div class="mi-l">Env</div><div class="mi-v">PRODUCTION</div></div>
  </div>
</header>

<div class="ticker">
  <div class="tkr-tag">LIVE</div>
  <div class="tkr-inner">
    <span class="te"><span class="dot dr"></span>504 errors — haproxy cms-prod-arkema</span>
    <span class="te"><span class="dot da"></span>p99 latency 2 847 ms — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections stables — orders_db 78/100</span>
    <span class="te"><span class="dot dr"></span>Deploy #847 — thomas.b — checkout-service v2.4.1</span>
    <span class="te"><span class="dot da"></span>Memory 84 % — app-server-03</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare nominal</span>
    <span class="te"><span class="dot dr"></span>504 errors — haproxy cms-prod-arkema</span>
    <span class="te"><span class="dot da"></span>p99 latency 2 847 ms — /api/checkout</span>
    <span class="te"><span class="dot dg"></span>DB connections stables — orders_db 78/100</span>
    <span class="te"><span class="dot dr"></span>Deploy #847 — thomas.b — checkout-service v2.4.1</span>
    <span class="te"><span class="dot da"></span>Memory 84 % — app-server-03</span>
    <span class="te"><span class="dot dg"></span>CDN Cloudflare nominal</span>
  </div>
</div>

<div class="grid">
  <div class="panel">
    <div class="ph"><div class="pn">Timeline</div><div class="pill pr">5 events</div></div>
    <div class="pb2" id="tl"></div>
  </div>

  <div class="panel">
    <div class="mrow" id="mrow"></div>
    <div class="ph"><div class="pn">Log stream — haproxy / cms-prod</div><div class="pill pa" id="lp">0 logs</div></div>
    <div class="logstream" id="ls"></div>
  </div>

  <div class="panel">
    <div class="ph"><div class="pn">Hypothèses</div><div class="pill pa">3 ranked</div></div>
    <div class="pb2" id="hyps"></div>
  </div>

  <div class="panel chat-panel">
    <div class="chat-l">
      <div class="ph"><div class="pn">Chat d'équipe</div><div class="pill pg">● connecté</div></div>
      <div class="chat-msgs" id="cm"></div>
      <div class="chat-in-row">
        <input class="ci" id="ci" placeholder="Message à l'équipe... (Entrée pour envoyer)" />
        <button class="sb" onclick="send()">ENVOYER</button>
      </div>
    </div>
    <div class="chat-r">
      <div class="ph"><div class="pn">Analyse IA</div><div class="pill pb">auto</div></div>
      <div class="ai-body">
        <div class="aib">
          <div class="aib-t">Résumé</div>
          <div class="aib-x">Pic de <b>504 errors</b> sur haproxy à <b>14:32:01</b>. Corrélation forte avec deploy <b>#847</b> effectué 4 min avant. Latence p99 à <b>2 847 ms</b>.</div>
        </div>
        <div class="aib">
          <div class="aib-t">Actions recommandées</div>
          <div class="aib-x"><b>1.</b> Rollback deploy #847<br><b>2.</b> Vérifier connection pool orders_db<br><b>3.</b> Monitorer p99 post-rollback</div>
        </div>
        <div class="aib">
          <div class="aib-t">Cause probable</div>
          <div class="aib-x">Régression checkout-service <b>v2.4.1</b> — probabilité <b>87 %</b></div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const tlData = [
  {time:'14:32:01',cls:'crit',type:'ALERT', text:'Monitor Datadog — <b>p99 > 2 000 ms</b> sur /api/checkout'},
  {time:'14:31:44',cls:'crit',type:'ERROR', text:'<b>247 erreurs 504</b> en 60 s — haproxy cms-prod-arkema'},
  {time:'14:28:14',cls:'warn',type:'DEPLOY',text:'Deploy <b>#847</b> par thomas.b — checkout-service v2.4.1'},
  {time:'14:25:00',cls:'info',type:'TRAFIC',text:'Trafic normal — <b>1 200 req/min</b> sur /api/checkout'},
  {time:'14:20:33',cls:'ok',  type:'HEALTH',text:'Tous health checks OK — DB, cache, CDN opérationnels'}
];
const tlEl = document.getElementById('tl');
tlData.forEach((e,i) => {
  tlEl.innerHTML += '<div class="tli"><div class="tlt">'+e.time+'</div><div class="tlc"><div class="tld '+e.cls+'"></div>'+(i<tlData.length-1?'<div class="tll"></div>':'')+'</div><div><div class="tltype">'+e.type+'</div><div class="tltext">'+e.text+'</div></div></div>';
});

const mData = [
  {n:'P99 Latency',  v:'2 847', u:'ms',    d:'↑ +1 200 ms', dd:'up',   c:'crit'},
  {n:'Error Rate',   v:'18.4',  u:'%',     d:'↑ +17.2 %',   dd:'up',   c:'crit'},
  {n:'Throughput',   v:'843',   u:'req/s', d:'↓ −357',       dd:'down', c:'warn'},
  {n:'DB Connections',v:'78',   u:'/ 100', d:'↑ +12',        dd:'up',   c:'warn'},
  {n:'Memory',       v:'84',    u:'%',     d:'↑ +8 %',       dd:'up',   c:'warn'},
  {n:'CPU',          v:'31',    u:'%',     d:'↑ +2 %',       dd:'up',   c:'ok'}
];
const mEl = document.getElementById('mrow');
mData.forEach(m => {
  mEl.innerHTML += '<div class="mc '+m.c+'"><div class="mn">'+m.n+'</div><div class="mv '+m.c+'">'+m.v+' <span class="mu">'+m.u+'</span></div><div class="md '+m.dd+'">'+m.d+'</div></div>';
});

const hData = [
  {r:'#1',cls:'top', t:'Régression introduite par Deploy #847',       p:'87',pc:'high',d:'Deploy 4 min avant l\'alerte. Corrélation forte. checkout-service v2.4.1 non validé en pré-prod.'},
  {r:'#2',cls:'',    t:'Saturation du connection pool base de données',p:'65',pc:'mid', d:'orders_db à 78/100 connexions. Requêtes lentes détectées. Facteur aggravant probable.'},
  {r:'#3',cls:'',    t:'Pic de trafic externe anormal',                p:'23',pc:'low', d:'Trafic légèrement au-dessus de la moyenne déjeuner, dans les normes historiques.'}
];
const hEl = document.getElementById('hyps');
hData.forEach(h => {
  hEl.innerHTML += '<div class="hyp '+h.cls+'"><div class="hh"><div class="hr">'+h.r+'</div><div class="ht">'+h.t+'</div><div class="hp '+h.pc+'">'+h.p+' %</div></div><div class="hbar"><div class="hfill" style="width:'+h.p+'%"></div></div><div class="hdesc">'+h.d+'</div></div>';
});

const logData = [
  {t:'14:32:08',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 847 ms'},
  {t:'14:32:07',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 3 102 ms'},
  {t:'14:32:06',l:'WARN', m:'checkout-service: DB query slow — <span class="hl">orders_db</span> — 1 847 ms (seuil 500 ms)'},
  {t:'14:32:05',l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — backend cms-prod — 2 991 ms'},
  {t:'14:32:04',l:'WARN', m:'checkout-service: connection pool à <span class="hl">78 %</span>'},
  {t:'14:32:01',l:'ERROR',m:'datadog-agent: monitor <span class="hl">p99_latency</span> dépassé — 2 847 ms > 2 000 ms'},
  {t:'14:31:58',l:'WARN', m:'app-server-03: mémoire <span class="hl">84 %</span> — proche du seuil'},
  {t:'14:31:44',l:'ERROR',m:'haproxy: <span class="hl">247</span> erreurs 504 en 60 s — équipe notifiée'},
  {t:'14:28:14',l:'INFO', m:'deploy-agent: checkout-service <span class="hl">v2.4.1</span> déployé par thomas.b — #847'},
  {t:'14:25:00',l:'INFO', m:'traffic-monitor: débit <span class="hl">1 200 req/min</span> — plage normale'},
  {t:'14:20:33',l:'OK',   m:'health-check: tous services OK — DB, cache, CDN opérationnels'}
];
const ls = document.getElementById('ls');
let lc = 0;
function addLog(t,l,m) {
  ls.innerHTML += '<div class="ll"><span class="lt">'+t+'</span><span class="llv '+l+'">'+l+'</span><span class="lm">'+m+'</span></div>';
  document.getElementById('lp').textContent = (++lc)+' logs';
  ls.scrollTop = ls.scrollHeight;
}
logData.forEach((x,i) => setTimeout(() => addLog(x.t,x.l,x.m), i*150));

const live = [
  {l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 3 247 ms'},
  {l:'WARN', m:'checkout-service: DB query slow — <span class="hl">2 100 ms</span>'},
  {l:'ERROR',m:'haproxy[1234]: <span class="hl">504 Gateway Timeout</span> — cms-prod — 2 891 ms'},
  {l:'WARN', m:'memory: app-server-03 à <span class="hl">86 %</span>'}
];
let li = 0;
setInterval(() => {
  const n = new Date(), t = [n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  const f = live[li++%live.length];
  addLog(t,f.l,f.m);
}, 5000);

const ws = new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
const cm = document.getElementById('cm');
const me = 'User'+Math.floor(Math.random()*90+10);
function addMsg(a,t,s) {
  const i = s?'AI':a.slice(0,2).toUpperCase();
  cm.innerHTML += '<div class="msg"><div class="av '+(s?'av-s':'av-u')+'">'+i+'</div><div><div class="ma">'+a+'</div><div class="mt">'+t+'</div></div></div>';
  cm.scrollTop = cm.scrollHeight;
}
ws.onopen = () => addMsg('Système','War Room activée — WebSocket connecté.',true);
ws.onmessage = e => { const d=JSON.parse(e.data); addMsg(d.author,d.text,d.author==='Système'); };
function send() {
  const i=document.getElementById('ci');
  if(!i.value.trim()) return;
  ws.send(JSON.stringify({author:me,text:i.value.trim()}));
  i.value='';
}
document.getElementById('ci').addEventListener('keypress',e=>{ if(e.key==='Enter') send(); });

const t0=Date.now();
setInterval(()=>{
  const n=new Date();
  document.getElementById('clk').textContent=[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
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
