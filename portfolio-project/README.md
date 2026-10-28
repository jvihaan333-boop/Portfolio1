# Vihaan Jain — Personal Portfolio

Single-page portfolio for a Computer Science student: dark/light theme, searchable project grid, and a floating AI assistant. The chatbot talks to a Vercel serverless function so the API key never ships in client code.

**Live URL:** `https://YOUR-VERCEL-PROJECT.vercel.app`  
<!-- TODO: replace with the real Vercel URL after first deploy -->

Add a photo at `assets/profile.jpg`. Until that file exists, the hero shows initials as a fallback.

## Features

- Sticky header with smooth-scroll nav and a pill-shaped theme switch
- Theme persisted in `localStorage` (`theme`) without a flash of the wrong colors
- Searchable, filterable project cards from `data/projects.js`
- Contact links plus a front-end message form (`mailto:`)
- Keyboard-accessible chatbot grounded in portfolio data
- Mobile-first layout (1 / 2 / 3 project columns)

## Tech stack

- HTML5, CSS3, vanilla JavaScript (no front-end build step)
- Vercel Node.js serverless function (`api/chat.js`)
- Google Gemini-style `generateContent` API (model name configurable)

## Directory tree

```
portfolio-project/
  index.html
  css/style.css
  js/main.js
  js/chatbot.js
  data/projects.js
  api/chat.js
  assets/profile.jpg          (add your photo)
  assets/icons/               (SVG icons)
  .gitignore
  .env.example
  README.md
```

## Local setup

1. Install the [Vercel CLI](https://vercel.com/docs/cli) if you do not already have it.
2. Copy env example and add a key (never commit this file):

   ```bash
   cd portfolio-project
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   cd portfolio-project
   Copy-Item .env.example .env.local
   ```

3. Edit `.env.local`:

   ```
   CHATBOT_API_KEY=your_key_here
   CHATBOT_MODEL=gemini-2.0-flash
   ```

4. Run the site and API together:

   ```bash
   npx vercel dev
   ```

   Open the local URL printed by the CLI (usually `http://localhost:3000`).

Opening `index.html` as a file will render the page, but `/api/chat` only works through `vercel dev` or a deployed Vercel URL.

## Deployment

1. Push this folder to GitHub (`jvihaan333-boop` or another repo).
2. In [Vercel](https://vercel.com), **Add New… → Project** and import the repo. Set the root directory to `portfolio-project` if the repo contains a parent folder.
3. **Settings → Environment Variables**: add `CHATBOT_API_KEY` (and optionally `CHATBOT_MODEL`).
4. Redeploy so the function can read the key.
5. Confirm `https://YOUR-PROJECT.vercel.app/api/chat` rejects GET with 405 and accepts POST.

## Testing checklist

- [ ] Theme switch in the header; choice survives reload with no flash
- [ ] Five project cards; GitHub links open in a new tab
- [ ] Search `Python` → projects 1–3; search `Quiz` → project 4 only
- [ ] Chip + search combine; empty state copy appears for nonsense queries
- [ ] Chatbot opens/closes, starter prompts send, typing indicator shows
- [ ] Off-topic chat is steered back to the portfolio (requires a live key)
- [ ] Layout at ~360px, 768px, and 1280px
- [ ] Tab through controls; visible `:focus-visible` rings
- [ ] No API key in client files; `.env.local` is gitignored
