const mineflayer = require('mineflayer');
const http = require('http');

const MC_HOST = 'ByteBot.aternos.me';
const MC_PORT = 59544;
const VERSION = '1.12.2';
const PORT = process.env.PORT || 8080;

let bot = null;
let botCheckInterval = null;
let reconnectTimeout = null;

function logVision(level, text) {
  const logLine = `[${new Date().toISOString()}] [${level}] ${text}`;
  console.log(logLine);
}

function createBot() {
  if (bot) {
    logVision('WARN', 'Bot já está ativo, não criando outro.');
    return;
  }

  const username = `ByteBot_${Math.floor(Math.random() * 9999)}`;
  logVision('INFO', `Iniciando bot como ${username}...`);

  bot = mineflayer.createBot({
    host: MC_HOST,
    port: MC_PORT,
    username,
    version: VERSION,
    auth: 'offline',
  });

  bot.once('spawn', () => {
    logVision('SUCCESS', `Bot conectado: ${bot.username}`);
    startBotCheck();
  });

  bot.on('login', () => logVision('INFO', 'Bot logado no servidor.'));

  bot.on('end', () => {
    logVision('ERROR', 'Bot desconectado.');
    cleanupBot();
    scheduleReconnect();
  });

  bot.on('kicked', (reason) => {
    logVision('ERROR', `Bot kickado: ${reason}`);
    cleanupBot();
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    logVision('ERROR', `Erro: ${err.message || err}`);
    cleanupBot();
    scheduleReconnect();
  });
}

function startBotCheck() {
  if (botCheckInterval) clearInterval(botCheckInterval);
  botCheckInterval = setInterval(() => {
    if (bot && bot.player) {
      logVision('CHECK', `Bot ainda está online como ${bot.username}.`);
    } else {
      logVision('WARN', 'Bot não está online, tentando reconectar...');
      cleanupBot();
      scheduleReconnect();
    }
  }, 10000); // verifica a cada 10 segundos
}

function cleanupBot() {
  if (botCheckInterval) {
    clearInterval(botCheckInterval);
    botCheckInterval = null;
  }
  try {
    if (bot) bot.quit();
  } catch (_) {}
  bot = null;
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  logVision('INFO', 'Tentando reconectar em 10 segundos...');
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    createBot();
  }, 10000);
}

// Servidor HTTP para manter vivo
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ByteBot está rodando sem interface.');
});

server.listen(PORT, () => {
  logVision('SERVER', `Servidor HTTP rodando em http://localhost:${PORT}`);
  createBot();
});
