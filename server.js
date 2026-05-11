const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

// Stockage en mémoire des incidents
const incidents = {};

// Page HTML principale
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🚨 War Room</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e1a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; }
  header { background: #ff3333; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 20px; font-weight: 700; }
  .badge { background: white; color: #ff3333; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; animation: blink 1s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; height: calc(100vh - 120px); }
  .panel { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; overflow-y: auto; }
  .panel h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 16px; }
  .event { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
  .event-time { color: #f59e0b; font-size: 11px; font-family: monospace; white-space: nowrap; margin-top: 2px; }
  .event-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-top: 5px; flex-shrink: 0; }
  .event-dot.alert { background: #ef4444; }
  .event-dot.deploy { background: #10b981; }
  .event-text { font-size: 13px; color: #d1d5db; }
  .hypothesis { background: #1f2937; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
  .hyp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .hyp-title { font-size: 13px; font-weight: 600; }
  .hyp-prob { font-size: 18px; font-weight: 700; color: #f59e0b; }
  .hyp-bar { height: 4px; background: #374151; border-radius: 2px; }
  .hyp-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #f59e0b, #ef4444); }
  .hyp-desc { font-size: 11px; color: #6b7280; margin-top: 6px; }
  .chat-panel { grid-column: span 2; display: flex; flex-direction: column; height: 200px; }
  .messages { flex: 1; overflow-y: auto; margin-bottom: 10px; }
  .msg { margin-bottom: 8px; font-size: 13px; }
  .msg-author { color: #3b82f6; font-weight: 600; margin-right: 6px; }
  .msg-text { color: #d1d5db; }
  .chat-input { display: flex; gap: 8px; }
  .chat-input input { flex: 1; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; outline: none; }
  .chat-input button { background: #3b82f6; border: none; border-radius: 8px; padding: 8px 16px; color: white; cursor: pointer; font-size: 13px; }
  .status-bar { background: #111827; border-top: 1px solid #1f2937; padding: 8px 24px; display: flex; gap: 20px; font-size: 11px; color: #6b7280; }
  .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; margin-right: 4px; }
</style>
</head>
<body>
<header>
  <span style="font-size:24px">🚨</span>
  <h1>WAR ROOM — Incident en cours</h1>
  <span class="badge">LIVE</span>
  <span style="margin-left:auto;font-size:12px;opacity:0.8" id="incident-title">Chargement...</span>
</header>

<div class="grid">
  <div class="panel">
    <h2>📋 Timeline des événements</h2>
    <div id="timeline"></div>
  </div>
  <div class="panel">
    <h2>🧠 Hypothèses classées</h2>
    <div id="hypotheses"></div>
  </div>
  <div class="panel chat-panel">
    <h2>💬 Chat d'équipe en direct</h2>
    <div class="messages" id="messages"></div>
    <div class="chat-input">
      <input type="text" id="msg-input" placeholder="Tape ton message... (Entrée pour envoyer)" />
      <button onclick="sendMsg()">Envoyer</button>
    </div>
  </div>
</div>

<div class="status-bar">
  <span><span class="status-dot"></span>WebSocket connecté</span>
  <span id="clock"></span>
  <span>War Room v1.0 — Yacine</span>
</div>

<script>
// Données de démo
const demoData = {
  title: "API Latency Spike — Production",
  timeline: [
    { time: "14:32:01", type: "alert", text: "🚨 Alerte Datadog : p99 latency > 2000ms sur /api/checkout" },
    { time: "14:28:14", type: "deploy", text: "🚀 Deploy #847 mergé par thomas.b — checkout-service v2.4.1" },
    { time: "14:25:00", type: "normal", text: "📊 Trafic normal — 1200 req/min sur /api/checkout" },
    { time: "14:20:33", type: "normal", text: "✅ Tous les health checks OK" },
    { time: "14:15:00", type: "normal", text: "🔄 Début du pic de trafic habituel (heure de déjeuner)" }
  ],
  hypotheses: [
    { title: "Deploy #847 a introduit une régression", prob: 87, desc: "Deploy effectué 4 min avant l'alerte. Corrélation temporelle forte." },
    { title: "Saturation de la base de données", prob: 65, desc: "Connections pool proche du max. Requêtes lentes détectées sur orders_db." },
    { title: "Pic de trafic externe anormal", prob: 23, desc: "Trafic légèrement élevé mais dans les normes habituelles du déjeuner." }
  ]
};

// Afficher les données
document.getElementById('incident-title').textContent = demoData.title;

const timeline = document.getElementById('timeline');
demoData.timeline.forEach(e => {
  timeline.innerHTML += \`<div class="event">
    <span class="event-time">\${e.time}</span>
    <span class="event-dot \${e.type}"></span>
    <span class="event-text">\${e.text}</span>
  </div>\`;
});

const hyps = document.getElementById('hypotheses');
demoData.hypotheses.forEach(h => {
  hyps.innerHTML += \`<div class="hypothesis">
    <div class="hyp-header">
      <span class="hyp-title">\${h.title}</span>
      <span class="hyp-prob">\${h.prob}%</span>
    </div>
    <div class="hyp-bar"><div class="hyp-fill" style="width:\${h.prob}%"></div></div>
    <div class="hyp-desc">\${h.desc}</div>
  </div>\`;
});

// WebSocket chat
const ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host);
const messages = document.getElementById('messages');
const username = 'User' + Math.floor(Math.random() * 100);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  messages.innerHTML += \`<div class="msg"><span class="msg-author">\${data.author}:</span><span class="msg-text">\${data.text}</span></div>\`;
  messages.scrollTop = messages.scrollHeight;
};

function sendMsg() {
  const input = document.getElementById('msg-input');
  if (!input.value.trim()) return;
  ws.send(JSON.stringify({ author: username, text: input.value }));
  input.value = '';
}

document.getElementById('msg-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMsg();
});

// Horloge
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('fr-FR');
}, 1000);
</script>
</body>
</html>`);
});

// Webhook Datadog
app.post('/webhook', (req, res) => {
  console.log('Webhook reçu:', req.body);
  res.json({ status: 'ok', message: 'War Room activé' });
});

// Serveur HTTP + WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Nouveau client connecté');
  ws.send(JSON.stringify({ author: '🤖 Système', text: 'Bienvenue dans la War Room. Connecté en temps réel.' }));
  
  ws.on('message', (data) => {
    // Diffuser à tous les clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data.toString());
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('War Room démarré sur le port ' + PORT);
});
