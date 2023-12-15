const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = "4000";
app.use(bodyParser.json());

const token = "6432656994:AAHryPpTrMapZpoP7VEBMRgkMqttpgd24Qk";
const bot = new TelegramBot(token, { polling: true });

let waitingUsers = [];
let chatPairs = new Map();

app.post("/bot" + token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const startMessage = "Welcome to Anonymous Chat Bot! Press to start.";
  const opts = {
    reply_markup: {
      keyboard: [["/anonymous_chat", "/start"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  bot.sendMessage(chatId, startMessage, opts);
});

bot.onText(/\/join_waiting_list/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Join Waiting List",
            callback_data: "join",
          },
        ],
      ],
    },
  };
  bot.sendMessage(chatId, "Click the button to join the waiting list.", opts);
});
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.from.id;
  let partnerId = chatPairs.get(chatId);
  if (partnerId) {
    chatPairs.delete(chatId);
    chatPairs.delete(partnerId);
    const opts = {
      reply_markup: {
        keyboard: [["/anonymous_chat", "/start"]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    bot.sendMessage(chatId, "You have left the chat.", opts);
    bot.sendMessage(partnerId, "Your partner has left the chat.", opts);
  }
});

bot.on("callback_query", (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (action === "join") {
    if (!waitingUsers.includes(chatId)) {
      waitingUsers.push(chatId);
      bot.sendMessage(
        chatId,
        "You're now in the waiting list. Please wait for a partner."
      );
    }
  }
});

bot.onText(/\/anonymous_chat/, (msg) => {
  const fromId = msg.from.id;
  if (!waitingUsers.includes(fromId)) {
    waitingUsers.push(fromId);
    bot.sendMessage(
      fromId,
      "You're now in the waiting list. Please wait for a partner."
    );
  }
  if (waitingUsers.length > 1) {
    let partnerId = waitingUsers.find((id) => id != fromId);
    if (partnerId) {
      waitingUsers = waitingUsers.filter(
        (id) => id !== fromId && id !== partnerId
      );
      chatPairs.set(fromId, partnerId);
      chatPairs.set(partnerId, fromId);

      const opts = {
        reply_markup: {
          keyboard: [["/stop"]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      bot.sendMessage(fromId, "Connected to a user. You can chat now!", opts);
      bot.sendMessage(
        partnerId,
        "Connected to a user. You can chat now!",
        opts
      );
    }
  }
});

bot.on("message", (msg) => {
  let fromId = msg.from.id;
  let partnerId = chatPairs.get(fromId);

  if (partnerId) {
    if (msg.text) {
      bot.sendMessage(partnerId, msg.text); // Forward text message to partner
    } else if (msg.photo) {
      bot.sendPhoto(partnerId, msg.photo[msg.photo.length - 1].file_id); // Forward photo to partner
    } else if (msg.video) {
      bot.sendVideo(partnerId, msg.video.file_id); // Forward video to partner
    } else if (msg.document) {
      bot.sendDocument(partnerId, msg.document.file_id); // Forward document to partner
    } else if (msg.voice) {
      bot.sendVoice(partnerId, msg.voice.file_id); // Forward voice message to partner
    } else if (msg.audio) {
      bot.sendAudio(partnerId, msg.audio.file_id); // Forward audio file to partner
    } else if (msg.sticker) {
      bot.sendSticker(partnerId, msg.sticker.file_id); // Forward sticker to partner
    } else if (msg.animation) {
      bot.sendAnimation(partnerId, msg.animation.file_id); // Forward gif to partner
    }
    // Add more else if blocks here for other types of messages if needed
  }
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});

bot.setWebHook(`https://78cf-91-98-208-149.ngrok-free.app/bot${token}`);
