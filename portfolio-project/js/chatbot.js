(function () {
  const MAX_MESSAGE_LENGTH = 500;
  const MAX_HISTORY_TURNS = 6;
  const STARTER_PROMPTS = [
    "What projects have you completed?",
    "What was corrected in the buggy code project?",
    "Explain your Python programs.",
  ];

  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const messagesEl = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const openFromHero = document.getElementById("open-chatbot");

  if (!launcher || !panel || !messagesEl || !form || !input) return;

  const history = [];
  let waiting = false;

  function setWaiting(isWaiting) {
    waiting = isWaiting;
    input.disabled = isWaiting;
    sendBtn.disabled = isWaiting;
  }

  function scrollToLatest() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className =
      "chat-bubble " + (role === "user" ? "chat-bubble--user" : "chat-bubble--assistant");
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToLatest();
    return bubble;
  }

  function appendError(text) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble--error";
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToLatest();
  }

  function showTyping() {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble--assistant";
    bubble.id = "typing-indicator";
    const dots = document.createElement("span");
    dots.className = "typing-indicator";
    dots.setAttribute("aria-label", "Assistant is typing");
    for (let i = 0; i < 3; i += 1) {
      dots.appendChild(document.createElement("span"));
    }
    bubble.appendChild(dots);
    messagesEl.appendChild(bubble);
    scrollToLatest();
  }

  function hideTyping() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
  }

  function remember(role, content) {
    history.push({ role: role, content: content });
    while (history.length > MAX_HISTORY_TURNS) history.shift();
  }

  async function requestReply(message, historyToSend) {
    const payload = {
      message: message,
      history: historyToSend,
    };

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error("parse");
    }

    if (!response.ok || !data || typeof data.reply !== "string") {
      const code = response.status;
      const error = new Error("api");
      error.status = code;
      throw error;
    }

    return data.reply;
  }

  async function sendMessage(raw) {
    const message = (raw || "").trim();
    if (!message || waiting) return;
    if (message.length > MAX_MESSAGE_LENGTH) {
      appendError("Please keep messages under 500 characters.");
      return;
    }

    appendBubble("user", message);
    const historyToSend = history.slice(-MAX_HISTORY_TURNS);
    remember("user", message);
    input.value = "";
    setWaiting(true);
    showTyping();

    try {
      const reply = await requestReply(message, historyToSend);
      hideTyping();
      appendBubble("assistant", reply);
      remember("assistant", reply);
    } catch (err) {
      hideTyping();
      appendError("Sorry, I could not answer just now. Please try again in a moment.");
    } finally {
      setWaiting(false);
      input.focus();
    }
  }

  function renderWelcome() {
    appendBubble(
      "assistant",
      "Hi — I can answer questions about Vihaan Jain's projects, skills, and coursework."
    );
    const wrap = document.createElement("div");
    wrap.className = "starter-prompts";
    STARTER_PROMPTS.forEach(function (prompt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = prompt;
      btn.addEventListener("click", function () {
        sendMessage(prompt);
      });
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", function () {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (openFromHero) openFromHero.addEventListener("click", openPanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) {
      closePanel();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });

  renderWelcome();
})();
