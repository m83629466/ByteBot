const mineflayer = require('mineflayer');
const MC_HOST = 'ByteBot_.aternos.me';
const MC_PORT = 59544;
const VERSION = '1.12.2';

let bot = null;
let reconnectTimeout = null;
let botCheckInterval = null;
let connectTimeout = null;

function logVision(text) {
  const logLine = `[${new Date().toISOString()}] ${text}`;
  console.log(logLine);
}

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
    cleanupBot();
    scheduleReconnect();
  }, 15000);

  bot.once('spawn', () => {
    clearTimeout(connectTimeout);
    logVision(`✅ Bot conectado: ${bot.username}`);
    startBotCheck();
  });

  bot.on('chat', (username, msg) => {
    if (username !== bot.username)
      logVision(`💬 ${username}: ${msg}`);
  });

  ['end', 'kicked', 'error'].forEach(evt => {
    bot.on(evt, (arg1) => {
      let msg = '';
      if (evt === 'end') msg = '🔴 Bot desconectado';
      if (evt === 'kicked') msg = `🚫 Bot kickado: ${arg1}`;
      if (evt === 'error') msg = `❌ Erro: ${arg1.message || arg1}`;

      logVision(msg);
      cleanupBot();
      scheduleReconnect();
    });
  });

  bot.on('login', () => logVision('🔐 Bot logado com sucesso!'));
}

function startBotCheck() {
  if (botCheckInterval) clearInterval(botCheckInterval);
  botCheckInterval = setInterval(() => {
    if (bot && bot.connected) {
      logVision(`✅ Bot está online: ${bot.username}`);
    } else {
      logVision('⚠️ Bot não está conectado, tentando reconectar...');
      cleanupBot();
      scheduleReconnect();
    }
  }, 5000); // verifica a cada 5 segundos
}

function cleanupBot() {
  if (botCheckInterval) clearInterval(botCheckInterval);
  if (connectTimeout) clearTimeout(connectTimeout);
  try { if (bot) bot.quit(); } catch (_) {}
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

// Inicia o bot
createBot();
