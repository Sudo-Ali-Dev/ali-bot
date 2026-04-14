# Ali Forged - Lightweight RAG Chat System

<p align="center">
   <b>Simple | Fast | Zero-Infra RAG</b><br/>
   A minimal Retrieval-Augmented Generation chatbot using keyword-based retrieval + Groq LLM.
</p>

---

<p align="center">
   <img src="https://img.shields.io/badge/LLM-Groq-blue?style=for-the-badge" />
   <img src="https://img.shields.io/badge/RAG-Lightweight-green?style=for-the-badge" />
   <img src="https://img.shields.io/badge/Infra-Zero-orange?style=for-the-badge" />
   <img src="https://img.shields.io/badge/Status-MVP-yellow?style=for-the-badge" />
</p>

## Overview

Ali Forged is a lightweight implementation of a RAG system designed for:

- speed
- zero/low cost
- simplicity

Instead of embeddings and vector databases, this project uses:

> keyword-based retrieval + prompt augmentation + Groq LLM

This repo is also persona-driven: the assistant is intentionally configured to answer in Ali's voice via `src/lib/system-prompt.ts`.

## End-to-End Architecture

```text
User Input
    |
    v
Keyword Retrieval (in-memory token overlap)
    |
    v
Context Selection (top-k matches)
    |
    v
Prompt Augmentation (inject retrieved Q/A)
    |
    v
LLM Call (Groq API + API key rotation)
    |
    v
Response
```

## Core Components

### API Layer - `src/pages/api/chat.ts`

Handles the full request lifecycle:

- receives conversation messages
- retrieves relevant context from local dataset
- injects context into the system prompt
- calls Groq with automatic key rotation on rate-limit errors
- returns final model response

Also includes:

- CORS handling with explicit allowlist
- `OPTIONS` preflight handler
- input validation and error responses

### Retriever - `src/lib/retriever.ts`

Simple keyword retrieval engine over `src/lib/dataset.json`.

How it works:

```ts
1. Parse dataset entries into Q/A pairs
2. Tokenize query + documents (lowercase, punctuation stripped)
3. Remove stop-words and short tokens
4. Score by normalized token overlap
5. Return top-k matches above a threshold
```

Scoring formula:

```ts
score = overlap / Math.sqrt(queryTokens.size * pairTokens.size)
```

### Prompt Builder - `src/lib/system-prompt.ts` + `buildPrompt()`

`SYSTEM_PROMPT` defines identity, tone, and strict response rules.

At request time, matched Q/A examples are appended as reference context:

```text
REFERENCE - Ali has answered similar questions before...
Q: ...
Ali's real answer: ...
```

### LLM - Groq (`llama-3.3-70b-versatile`)

- processes final prompt + chat messages
- returns concise chat response
- no fine-tuning required

## API Usage

### Endpoint

```http
POST /api/chat
```

### Request Body

```json
{
   "messages": [
      { "role": "user", "content": "What is machine learning?" }
   ]
}
```

Notes:

- `messages` is required and must be a non-empty array.
- The retriever uses the most recent `role: "user"` message.

### Success Response

```json
{
   "reply": "..."
}
```

### Error Responses

- `400`: invalid or missing `messages`
- `500`: Groq/API/internal failure

## Installation

### Prerequisites

- Node.js `>= 18.0.0`
- npm

### Local Setup

```bash
git clone https://github.com/Sudo-Ali-Dev/ali-forged.git
cd ali-forged
npm install
cp .env.example .env
```

Add at least one Groq API key in `.env`:

```env
GROQ_API_KEY_1=gsk_your_first_key
GROQ_API_KEY_2=gsk_your_second_key
GROQ_API_KEY_3=gsk_your_third_key
GROQ_API_KEY_4=gsk_your_fourth_key
```

Then run:

```bash
npm run dev
```

Open `http://localhost:4321`.

## Deployment

This project is configured for server output with the Vercel adapter:

- `astro.config.mjs` -> `output: "server"`, `adapter: vercel()`
- `vercel.json` -> uses `npm install` and `npm run build`

## Project Structure

```text
src/
   env.d.ts
   layouts/
      Layout.astro
   lib/
      dataset.json         # Knowledge base entries
      retriever.ts         # Keyword retrieval logic
      system-prompt.ts     # Persona/system instructions
   pages/
      index.astro          # Chat UI
      api/
         chat.ts            # Chat API route
```

## Design Philosophy

This project intentionally avoids full RAG complexity.

Why this approach:

- no vector database
- no embedding pipeline
- near-zero infra setup
- fast iteration for small datasets

Tradeoffs:

| Limitation | Explanation |
| --- | --- |
| No semantic understanding | Matches words, not deep meaning |
| Weak with synonyms | "AI" and "Artificial Intelligence" can diverge |
| Limited scalability | In-memory matching is best for small/medium corpora |
| Lower retrieval quality ceiling | Embedding-based retrieval is usually stronger |

## Lightweight RAG vs Full RAG

| Feature | This Project | Full RAG |
| --- | --- | --- |
| Retrieval | Keyword-based | Embedding-based |
| Setup | Simple | Complex |
| Cost | Low | Usually higher |
| Speed | Fast | Medium |
| Accuracy ceiling | Moderate | High |
| Scalability | Limited | High |

## Customization

### Update the knowledge base

Edit `src/lib/dataset.json` with entries in this format:

```json
{
   "text": "User: your question\nAli: your answer</s>"
}
```

### Update assistant behavior

Edit `src/lib/system-prompt.ts`.

### Adjust retrieval sensitivity

Edit scoring/threshold logic in `src/lib/retriever.ts`.

## Roadmap

Potential upgrades toward full RAG:

- embeddings (OpenAI or local)
- vector database (Supabase, Pinecone, etc.)
- semantic or hybrid retrieval
- reranking layer
- conversation memory beyond current message list

## Use Cases

- personal AI assistants
- internal knowledge bots
- MVP chatbot systems
- learning RAG fundamentals

## Key Insight

You do not need complex infrastructure to build a useful RAG chatbot.

Start simple, measure behavior, then scale complexity when needed.

## Author

Ali

## Support

If you find this useful:

- star the repo
- fork it
- build on top of it
