// TODO: Verify the current model name in the provider docs.
const DEFAULT_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION =
  "You are an AI assistant representing Vihaan Jain. Answer ONLY using the portfolio context below. Background: Computer Science student skilled in Python, JavaScript, HTML/CSS, Git, Vercel, and Cursor AI. Project 1 (Python Programs Collection): Implemented Factorial, Fibonacci sequence generator, and structure-to-dict parser. Project 2 (Messy Python Code Improvement): Took an unstructured, un-commented Python file and improved readability, modularity, and PEP 8 compliance using Cursor AI. Project 3 (Bug Fixing Using Cursor AI): Identified edge-case logic defects and exceptions in a program, documented the bugs, and fixed them using AI prompts. Project 4 (Interactive Quiz App): Lecture 10 project featuring score counters, dynamic question rendering, and responsive styling. Project 5 (Book Reading List App): Lecture 11 project allowing users to add, update, and manage book progress with live deployment. GitHub: https://github.com/jvihaan333-boop. Keep answers friendly, concise, and professional. If you don't know something from this context, say so instead of guessing. If a question is unrelated to the portfolio, politely steer back to the projects.";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;

function isTurn(item) {
  if (!item || typeof item !== "object") return false;
  const role = item.role;
  const content = item.content;
  return (role === "user" || role === "assistant") && typeof content === "string";
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.filter(isTurn).slice(-MAX_HISTORY_TURNS);
}

function toGeminiContents(history, message) {
  const contents = sanitizeHistory(history).map(function (turn) {
    return {
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    };
  });
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

function extractReply(payload) {
  const text =
    payload &&
    payload.candidates &&
    payload.candidates[0] &&
    payload.candidates[0].content &&
    payload.candidates[0].content.parts &&
    payload.candidates[0].content.parts[0] &&
    payload.candidates[0].content.parts[0].text;
  return typeof text === "string" ? text.trim() : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message is too long." });
  }

  const apiKey = process.env.CHATBOT_API_KEY;
  if (!apiKey) {
    console.error("CHATBOT_API_KEY is not configured.");
    return res.status(500).json({ error: "The assistant is unavailable right now." });
  }

  const model = process.env.CHATBOT_MODEL || DEFAULT_MODEL;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent";

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: toGeminiContents(body.history, message),
      }),
    });

    if (upstream.status === 429) {
      return res.status(429).json({
        error: "The assistant is busy right now. Please try again shortly.",
      });
    }

    if (!upstream.ok) {
      console.error("Upstream chat request failed with status", upstream.status);
      return res.status(502).json({ error: "The assistant is unavailable right now." });
    }

    let payload;
    try {
      payload = await upstream.json();
    } catch (err) {
      console.error("Failed to parse upstream JSON.");
      return res.status(502).json({ error: "The assistant is unavailable right now." });
    }

    const reply = extractReply(payload);
    if (!reply) {
      return res.status(502).json({ error: "The assistant is unavailable right now." });
    }

    return res.status(200).json({ reply: reply });
  } catch (err) {
    console.error("Chat handler network failure.");
    return res.status(502).json({ error: "The assistant is unavailable right now." });
  }
}
