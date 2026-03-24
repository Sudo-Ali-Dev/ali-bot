# Ali Bot

A personal AI chatbot modeled after Muhammad Ali from Lahore, Pakistan. Built with Astro + Groq (Llama 3.3 70B).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Groq API key**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and paste your key from [console.groq.com](https://console.groq.com).

3. **Run the dev server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) and start talking to Ali.

## Stack

- **Astro 6** — SSR with Node adapter
- **Groq** — Llama 3.3 70B Versatile
- **Zero JS frameworks** — vanilla TypeScript in the client
