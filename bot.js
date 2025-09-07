const mineflayer = require('mineflayer');

// ========== CONFIG ==========
const MC_HOST = 'ByteBot_.aternos.me';
const MC_PORT = 59544; // Porta correta
const VERSION = '1.12.2';

let bot = null;
let reconnectTimeout = null;
let moveInterval = null;
let connectTimeout = null;

// ========== LOG ==========
function logVision(text) {
    console.log(`[${new Date().toISOString()}] ${text}`);
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
        cleanupBot();
        scheduleReconnect();
    }, 15000);

    bot.once('spawn', () => {
        clearTimeout(connectTimeout);
        logVision(`✅ Bot conectado: ${bot.username}`);

        // Movimentação aleatória
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
    });

    bot.on('chat', (username, msg) => {
        if (username !== bot.username)
            logVision(`💬 ${username}: ${msg}`);
    });

    bot.on('kicked', (reason) => {
        logVision(`🚫 Bot kickado: ${reason}`);
        cleanupBot();
        scheduleReconnect();
    });

    bot.on('end', () => {
        logVision('🔴 Bot desconectado');
        cleanupBot();
        scheduleReconnect();
    });

    bot.on('error', (err) => {
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

// ========== INÍCIO ==========
createBot();
