export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Telegram bot token is not configured" });
  }

  try {
    const update = req.body;

    if (!update?.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = (update.message.text || "").trim();

    let reply = "";

    if (text === "/start") {
      reply =
        "👋 Welcome to DivineTube!\n\n" +
        "Watch, create and share videos.\n\n" +
        "Commands:\n" +
        "/latest - Latest videos\n" +
        "/support - Contact support\n" +
        "/help - Show help";
    } else if (text === "/help") {
      reply =
        "🤖 DivineTube Bot\n\n" +
        "/start - Start the bot\n" +
        "/latest - Latest videos\n" +
        "/support - Contact DivineTube support";
    } else if (text === "/latest") {
      reply =
        "🎬 Latest DivineTube videos\n\n" +
        "Visit DivineTube:\n" +
        "https://divinetube-6-0.vercel.app/";
    } else if (text === "/support") {
      reply =
        "💬 DivineTube Support\n\n" +
        "Send your support request here and we'll get back to you.";
    } else {
      reply =
        "I don't recognize that command.\n\n" +
        "Try /help to see what I can do.";
    }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply
      })
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Telegram request failed" });
  }
}
