const mineflayer = require('mineflayer');
const http = require('http');
const WebSocket = require('ws');

// ========== CONFIG ==========
const MC_HOST = 'ByteBot_.aternos.me';
const MC_PORT = 59544;
const VERSION = '1.12.2';
const PORT = process.env.PORT || 8080;

let bot = null;
let clients = [];
let reconnectTimeout = null;
let moveInterval = null;
let updateInterval = null;
let connectTimeout = null;

// ========== LOG + BROADCAST ==========
function logVision(text) {
  const logLine = `[${new Date().toISOString()}] ${text}`;
  console.log(logLine);
  broadcast({ log: logLine });
}

function broadcast(data) {
  const json = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(json);
  });
}

// ========== BOT ==========
function createBot() {
  if (bot) {
    logVision('⚠️ Bot já está ativo.');
    return;
  }

  const username = `ByteBot_${Math.floor(Math.random() * 9999)}`;
  logVision(`🤖 Iniciando bot como ${username}...`);

  bot = mineflayer.createBot({
    host: MC_HOST,
    port: MC_PORT,
    username,
    version: VERSION,
    auth: 'offline',
  });

  connectTimeout = setTimeout(() => {
    logVision('⏰ Timeout: conexão muito demorada.');
    bot.quit();
    cleanupBot();
    scheduleReconnect();
  }, 15000);

  bot.once('spawn', () => {
    clearTimeout(connectTimeout);
    logVision(`✅ Bot conectado: ${bot.username}`);

    if (moveInterval) clearInterval(moveInterval);
    moveInterval = setInterval(() => {
      if (!bot.entity) return;
      const dirs = ['forward', 'back', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const jump = Math.random() < 0.4;

      bot.clearControlStates();
      bot.setControlState(dir, true);
      if (jump) bot.setControlState('jump', true);

      setTimeout(() => bot.clearControlStates(), 1000);
    }, 8000);

    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
      if (!bot.entity) return;
      const position = {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z,
      };
      const players = Object.values(bot.players).map(p => ({
        username: p.username,
        pos: p.entity ? {
          x: p.entity.position.x,
          y: p.entity.position.y,
          z: p.entity.position.z
        } : null
      }));
      broadcast({ position, players });
    }, 1000);
  });

  bot.on('chat', (username, msg) => {
    if (username !== bot.username)
      logVision(`💬 ${username}: ${msg}`);
  });

  bot.once('end', () => {
    logVision('🔴 Bot desconectado');
    cleanupBot();
    scheduleReconnect();
  });

  bot.once('kicked', (reason, loggedIn) => {
    logVision(`🚫 Bot kickado: ${reason}`);
    cleanupBot();
    scheduleReconnect();
  });

  bot.on('error', err => {
    logVision(`❌ Erro: ${err.message}`);
    cleanupBot();
    scheduleReconnect();
  });

  bot.on('login', () => {
    logVision('🔐 Bot logado com sucesso!');
  });
}

function cleanupBot() {
  if (moveInterval) clearInterval(moveInterval);
  if (updateInterval) clearInterval(updateInterval);
  if (connectTimeout) clearTimeout(connectTimeout);
  try {
    if (bot) bot.quit();
  } catch (_) {}
  bot = null;
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  logVision('🔄 Tentando reconectar em 10 segundos...');
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    createBot();
  }, 10000);
}

// ========== HTTP + WS ==========
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ByteBot está rodando sem interface.');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  clients.push(ws);
  logVision('📡 Novo cliente conectado');
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    logVision('🔌 Cliente desconectado');
  });
  ws.on('error', err => {
    logVision(`❗ Erro WS: ${err.message}`);
  });
});

// ========== INÍCIO ==========
server.listen(PORT, () => {
  console.log(`🌐 Servidor rodando: http://localhost:${PORT}`);
  createBot();
});
