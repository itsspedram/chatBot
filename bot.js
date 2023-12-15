const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = "4000";
app.use(bodyParser.json());

const token = '6432656994:AAHryPpTrMapZpoP7VEBMRgkMqttpgd24Qk';
const bot = new TelegramBot(token, { polling: true });

let waitingUsers = [];
let chatPairs = new Map();

// Webhook for the express app
app.post('/bot' + token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Anonymous Chat Bot!");
});

bot.onText(/\/anonymous_chat/, (msg) => {
  const fromId = msg.from.id;
  // If already waiting, do nothing
  if (!waitingUsers.includes(fromId)) {
    waitingUsers.push(fromId);
    bot.sendMessage(fromId, "You're now in the waiting list. Please wait for a partner.");
  }
  if (waitingUsers.length > 1) {
    let partnerId = waitingUsers.find(id => id != fromId);
    if (partnerId) {
      waitingUsers = waitingUsers.filter(id => id !== fromId && id !== partnerId);
      chatPairs.set(fromId, partnerId);
      chatPairs.set(partnerId, fromId);
      
      bot.sendMessage(fromId, "Connected to a user. You can chat now!");
      bot.sendMessage(partnerId, "Connected to a user. You can chat now!");
    }
  }
});

bot.on('message', (msg) => {
    console.log(msg);
  let fromId = msg.from.id;
  let partnerId = chatPairs.get(fromId);
  
  if (partnerId && msg.text) {
    bot.sendMessage(partnerId, msg.text);  // Forward message to partner
  }
});

// Start Express Server
app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});

// Set webhook
bot.setWebHook(`https://78cf-91-98-208-149.ngrok-free.app/bot${token}`);