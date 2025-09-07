const mineflayer = require('mineflayer');

// ====== Configurações do servidor ======
const HOST = 'ByteBot.aternos.me';
const PORT = 59544;

// Nick aleatório
const NICK = `ByteBot#${Math.floor(Math.random()*10000)}`;

// Criar bot
const bot = mineflayer.createBot({
  host: HOST,
  port: PORT,
  username: NICK
});

// Controle de movimento
let moving = false;
let lastX = null;
let lastY = null;

bot.once('spawn', () => {
  console.log(`🤖 Bot ${NICK} entrou no servidor!`);
  antiAFK();
  monitorPosition();
});

// Função anti-AFK: movimenta aleatoriamente
function antiAFK() {
  setInterval(() => {
    const directions = ['forward', 'back', 'left', 'right', 'jump'];
    directions.forEach(dir => bot.setControlState(dir, Math.random() < 0.5));
  }, 3000);
}

// Verificar posição e blocos à frente
function monitorPosition() {
  setInterval(() => {
    const pos = bot.entity.position;
    const block = bot.blockAt(bot.entity.position.offset(0, -1, 0));

    if (block && block.name === 'air') {
      // pular se estiver no vazio
      bot.setControlState('jump', true);
    } else if (block && block.name === 'stone') {
      // evita bloco preto (obstáculo)
      bot.setControlState('forward', false);
      bot.setControlState('left', Math.random() < 0.5);
      bot.setControlState('right', Math.random() < 0.5);
    }

    if (lastX !== null && lastY !== null) {
      if (lastX === pos.x && lastY === pos.z) {
        console.log(`⏸ Bot parado, tentando movimentar...`);
        bot.setControlState('forward', true);
      }
    }

    lastX = pos.x;
    lastY = pos.z;

    console.log(`📍 Posição: X=${pos.x.toFixed(1)}, Y=${pos.y.toFixed(1)}, Z=${pos.z.toFixed(1)}, Bloco abaixo: ${block ? block.name : 'none'}`);
  }, 5000);
}

// Reconectar se cair do servidor
bot.on('end', () => {
  console.log('⚠️ Bot saiu do servidor. Tentando reconectar...');
  setTimeout(() => {
    mineflayer.createBot({
      host: HOST,
      port: PORT,
      username: NICK
    });
  }, 5000);
});

bot.on('error', err => console.log('❌ Erro do bot:', err));
