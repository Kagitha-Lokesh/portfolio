# 🧠 LOKI — Lokesh Kagitha Portfolio AI Assistant System Architecture & Documentation

A complete, production-grade AI assistant named **LOKI** and contact dispatch system engineered for Next.js 15 (App Router), React 19, and Tailwind CSS 4. Built with **zero new runtime dependencies**, strict grounded knowledge, provider-swappable streaming, multi-turn conversation memory, smart contact collection, and spam protection.

---

## 📑 Table of Contents
1. [Architectural Overview](#1-architectural-overview)
2. [LOKI Persona & Knowledge Grounding Engine (`src/lib/agent/knowledge.ts`)](#2-loki-persona--knowledge-grounding-engine)
3. [Provider-Swappable LLM Layer (`src/lib/agent/llm.ts`)](#3-provider-swappable-llm-layer)
4. [Streaming Chat API Route (`src/app/api/chat/route.ts`)](#4-streaming-chat-api-route)
5. [Two-Tier Rate Limiting Engine (`src/lib/agent/rate-limit.ts`)](#5-two-tier-rate-limiting-engine)
6. [Contact Dispatch & Email Delivery (`src/app/api/contact/route.ts`)](#6-contact-dispatch--email-delivery)
7. [Frontend Agent Widget (`src/components/agent/`)](#7-frontend-agent-widget)
8. [Configuration & Provider Swapping](#8-configuration--provider-swapping)
9. [Security, Anti-Abuse & Privacy Protocols](#9-security-anti-abuse--privacy-protocols)

---

## 1. Architectural Overview

**LOKI** is designed to solve two core visitor needs:
1. **Answer questions about Lokesh** (skills, education, enterprise experience at Charani Infotech, freelance case studies, and certifications) strictly from verified portfolio data.
2. **Facilitate direct communication** by retaining multi-turn conversation memory, recognizing contact intent, collecting only missing contact details, preparing an editable contact draft, and dispatching it securely via Resend's REST API.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                    VISITOR BROWSER                     │
                    │                                                        │
                    │  ┌──────────────────────┐    ┌──────────────────────┐  │
                    │  │   Ask AI Launcher    │    │ "Ask my AI" Button   │  │
                    │  │   (waits for Loader) │    │  (Contact Section)   │  │
                    │  └──────────┬───────────┘    └──────────┬───────────┘  │
                    │             │                           │              │
                    │             ▼                           ▼              │
                    │  ┌──────────────────────────────────────────────────┐  │
                    │  │      AgentWidget.tsx (next/dynamic, ssr:false)   │  │
                    │  │   - Lenis Scroll Suppression (data-lenis-prevent)│  │
                    │  │   - Suggestion Chips & Safe Link/Text Renderer   │  │
                    │  │   - Interactive Contact Draft Confirmation Card  │  │
                    │  │   - SessionStorage Persistence & New Chat (↺)    │  │
                    │  └───────────────┬──────────────────────────┬───────┘  │
                    └──────────────────┼──────────────────────────┼──────────┘
                                       │ POST /api/chat           │ POST /api/contact
                                       ▼                          ▼
      ┌────────────────────────────────────────────────┐  ┌───────────────────────────────────┐
      │         NEXT.JS SERVER: /api/chat              │  │    NEXT.JS SERVER: /api/contact   │
      │                                                │  │                                   │
      │  1. IP Rate Limiting (20 req / 10 min)         │  │  1. IP Rate Limiting (3 / hr)     │
      │  2. Payload & Role Validation (≤12 msgs)       │  │  2. Global Daily Cap (50 / day)   │
      │  3. Knowledge Injection (data.ts Grounding)    │  │  3. Honeypot Check ("website")    │
      │  4. Native fetch to LLM Base URL (SSE Stream)  │  │  4. CR/LF Header Sanitization     │
      │  5. Chunked Transfer to Client                 │  │  5. Append Chat Context to Body   │
      │                                                │  │  6. Dispatch via Resend REST API  │
      └────────────────────────┬───────────────────────┘  └─────────────────┬─────────────────┘
                               │                                            │
                               ▼                                            ▼
                    ┌─────────────────────┐                      ┌─────────────────────┐
                    │    LLM PROVIDER     │                      │   RESEND REST API   │
                    │ (Groq, OpenAI, etc) │                      │ (kagithalokesh8@...)│
                    └─────────────────────┘                      └─────────────────────┘
```

### Core Design Philosophy: Zero Runtime Dependencies
- No LangChain, LlamaIndex, or heavy external agent libraries.
- No third-party SDKs (`openai`, `resend`, `@upstash/redis`).
- Native Web standard APIs only: `fetch`, `ReadableStream`, `TextEncoder`, `TextDecoder`, `AbortController`.
- Zero bundle bloat on first-load page render (dynamic import chunks the widget separately).

---

## 2. Knowledge Grounding Engine

Located at [`src/lib/agent/knowledge.ts`](file:///d:/Project/portfolio/src/lib/agent/knowledge.ts).

### Single Source of Truth
The assistant never hallucinates or requires separate hard-coded database files. It imports your verified data directly from [`src/lib/data.ts`](file:///d:/Project/portfolio/src/lib/data.ts):
- `PROFILE`: Bio, role, location, contact, CGPA, graduation, GitHub, LinkedIn.
- `EDUCATION`: Sri Vasavi Institute of Engineering & Technology, Intermediate, High School.
- `EXPERIENCE`: Charani Infotech Pvt Ltd (Associate Software Engineer, HRM modules, attendance, payroll, APIs).
- `PROJECTS`: Purnima Kalamkari, JavaMentor, Attendance Management System, 3D Cinematic Portfolio.
- `SKILL_ELEMENTS`: Categorized across Languages, Frontend, Backend, Databases, Tools, and AI concepts.
- `CERTIFICATIONS`: Java Full Stack (BISTS), Developer Internship (Charani Infotech).
- `FREELANCE`: Detailed case study on Purnima Kalamkari (architecture, WhatsApp ordering, JWT admin).
- `ACHIEVEMENTS`: Honors, completed architectures, and credential metrics.

### System Prompt Rules & Defenses
The compiled system prompt enforces foundational constraints:

1. **LOKI Persona & Third Person**:
   The assistant's official name is **LOKI**. LOKI represents Lokesh Kagitha and always refers to Lokesh in the third person (*"Lokesh is...", "He developed...", "His stack includes..."*). LOKI never confuses himself with Lokesh. Answers adhere to a concise ~120-word limit unless deep technical detail is requested.
2. **Grounding & Honesty**:
   If a question cannot be answered using the provided data, the model replies:
   > *"I don't have that information in Lokesh's portfolio, but I can help you send him a message directly."*
   It is strictly prohibited from inventing salary, notice periods, availability dates, or unlisted technologies.
3. **Off-Topic Deflection**:
   Politely declines arbitrary coding assistance, homework problems, or unrelated general chat and steers the conversation back to Lokesh's background.
4. **Conversation Memory & Contact Intent Recognition**:
   LOKI inspects the entire conversation history. When a visitor expresses intent to connect (*"I want to contact him"*, *"Can you connect me with Lokesh?"*, recruitment enquiries, or hiring requests), LOKI immediately initiates the contact flow rather than treating it as an FAQ.
5. **Smart Contact Detail Collection**:
   LOKI tracks known details across the entire dialogue:
   - If the visitor already introduced themselves (*"I'm Raj Shekar from Charani Info Tech..."*), LOKI **never asks for their name again** and greets them warmly by name (*"Hi Raj!"*).
   - If they already shared their purpose or company, LOKI retains it and **does not ask them to repeat it**.
   - LOKI asks only for missing details among the required trio: **Name**, **Email**, and **Message**.
6. **Contact Draft Synthesis (`[[CONTACT_DRAFT]]`)**:
   Once Name, Email, and Message/Purpose are available, LOKI synthesizes a professional, structured note reflecting the visitor's genuine context, informs them the draft is ready for review, and emits:
   ```
   [[CONTACT_DRAFT]]{"name":"...","email":"...","message":"..."}
   ```
   LOKI is strictly forbidden from claiming an email was sent. An interactive confirmation card renders in the UI allowing the visitor to review, edit, and explicitly click *"Send to Lokesh"*.
7. **Contextual Navigation Actions (`[[NAV_ACTION]]`)**:
   When answering portfolio questions, LOKI can offer relevant deep links to sections (`work`, `skills`, `experience`, `freelance`, `certifications`, `about`, `contact`). Navigation tokens are stripped during draft rendering.

---

## 3. Provider-Swappable LLM Layer

Located at [`src/lib/agent/llm.ts`](file:///d:/Project/portfolio/src/lib/agent/llm.ts).

### Compatibility
The abstraction supports any provider offering an **OpenAI-compatible HTTP chat completions endpoint**:
- **GroqCloud** (`https://api.groq.com/openai/v1`) — Recommended for sub-200ms latency.
- **OpenAI** (`https://api.openai.com/v1`) — Standard `gpt-4o-mini` or `gpt-4o`.
- **Google Gemini** (`https://generativelanguage.googleapis.com/v1beta/openai`) — OpenAI compatibility mode.
- **OpenRouter**, **Mistral**, **Perplexity**, or self-hosted **vLLM** / **Ollama**.

### Streaming Engine
The `createLLMStream` function:
1. Connects to `${LLM_BASE_URL}/chat/completions` using native `fetch` with `stream: true`.
2. Parses incoming Server-Sent Events (`data: {...}`) chunk-by-chunk across TCP boundaries using `TextDecoder({ stream: true })`.
3. Buffers text until `[DONE]` is reached or the stream closes.
4. Enforces a **25-second `AbortController` timeout** to prevent hung connections.
5. Sets `max_tokens: 800` to support reasoning models (like `openai/gpt-oss-20b`) where initial tokens may be dedicated to internal analysis before answer synthesis.

### Sanitized Errors
If an upstream error occurs (401, 429, 500, network failure), it throws an `LLMError` with safe, generic copy. Internal API keys, endpoint URLs, and raw upstream payloads are logged server-side only and **never leaked** to the client.

---

## 4. Streaming Chat API Route

Located at [`src/app/api/chat/route.ts`](file:///d:/Project/portfolio/src/app/api/chat/route.ts).

- **Runtime**: `nodejs`.
- **Method**: `POST`.
- **Rate Limit**: 20 requests per 10 minutes per IP.
- **Validation**:
  - Request body must contain a `messages` array.
  - Length is capped at `MAX_MESSAGES = 12` (conversations longer than 12 prompts prompt the user to start a new chat).
  - Allowed roles: strictly `'user'` and `'assistant'` (system messages from clients are rejected with HTTP 400).
  - User messages: capped at 500 characters each.
  - Total payload: capped at 10,000 characters to prevent denial-of-wallet / memory attacks.
- **Headers**:
  ```http
  Content-Type: text/plain; charset=utf-8
  Cache-Control: no-cache, no-transform
  X-Content-Type-Options: nosniff
  ```

---

## 5. Zero-Dependency In-Memory Rate Limiting Engine

Located at [`src/lib/agent/rate-limit.ts`](file:///d:/Project/portfolio/src/lib/agent/rate-limit.ts).

### In-Memory Sliding Window (Zero External Dependencies)
By default and design, the assistant operates with zero third-party database dependencies using a local sliding-window Map:
1. Tracks request counts and reset timestamps per key (`chat:{ip}`, `contact:{ip}`, `contact:global:daily:{date}`).
2. Automatically triggers periodic garbage collection every 60 seconds to prune expired buckets and prevent Node.js memory leaks.
3. Requires zero cloud database setup, credentials, or network latency.

### Serverless Architecture Policy & Limitations (Vercel)
- **Per-Instance Isolation**: In-memory state is maintained inside the memory of the active Node.js server container. Different serverless instances deployed across Vercel regions do not share memory.
- **Global Daily Cap Policy**: The 50/day email cap serves as a safe ceiling per active instance. It is **explicitly not guaranteed** to be an absolute distributed global cap across disparate serverless instances without external shared storage.
- **Primary Abuse Defense**: The primary protection against automated spam bots, rapid script firing, and denial-of-wallet attacks is enforced via strict **per-IP rate limits** (20 requests / 10 min for chat, 3 requests / 1 hr for contact) combined with the silent honeypot trap on each container.
- **Optional Upstash Support**: If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are ever provided in the future, the code will dynamically pipe to Upstash Redis REST; otherwise, it operates 100% in-memory with zero overhead.

### IP Address Extraction
```ts
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
```

---

## 6. Contact Dispatch & Email Delivery

Located at [`src/app/api/contact/route.ts`](file:///d:/Project/portfolio/src/app/api/contact/route.ts).

### Security & Anti-Abuse Measures
1. **Honeypot Trap**:
   Contains a hidden input field named `website`. If bots fill this out, the route immediately returns HTTP `200` with `{ success: true }` without sending any email, trapping spammers silently.
2. **Header Injection Defense**:
   All CR (`\r`), LF (`\n`), and tab (`\t`) characters are stripped from the sender's name and email to prevent SMTP/HTTP header manipulation.
3. **Strict Validation**:
   - `name`: 1–80 characters.
   - `email`: verified against standard email regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), ≤ 100 characters.
   - `message`: 10–1000 characters.
4. **Rate Limiting**:
   - **Per-IP Limit**: Maximum 3 messages per hour per IP.
   - **Global Limit**: Maximum 50 messages per day across all visitors.

### Email Formatting & Conversational Context
The email body sent to `CONTACT_TO_EMAIL` includes:
- Visitor's name, email, and IP address.
- The visitor's verified message.
- **Recent Chat Context**: The last 6 conversational turns from the chat session, formatted in clean HTML and plain text, giving you immediate context on what the visitor discussed with the AI before deciding to reach out.

---

## 7. Frontend Agent Widget

Located at [`src/components/agent/`](file:///d:/Project/portfolio/src/components/agent/).

### Component Breakdown
| Component | Purpose |
| :--- | :--- |
| [`AgentWidget.tsx`](file:///d:/Project/portfolio/src/components/agent/AgentWidget.tsx) | Main orchestrator; controls open/close state, streaming, focus trap, and events. |
| [`ContactCard.tsx`](file:///d:/Project/portfolio/src/components/agent/ContactCard.tsx) | The confirmation card rendered when a draft is ready, plus standalone fallback mode. |
| [`FormattedText.tsx`](file:///d:/Project/portfolio/src/components/agent/FormattedText.tsx) | Safely renders Markdown bold, inline code, and URLs with **zero `dangerouslySetInnerHTML`**. Strips draft tokens. |
| [`SuggestionChips.tsx`](file:///d:/Project/portfolio/src/components/agent/SuggestionChips.tsx) | Starter prompt chips (*"What has Lokesh built?"*, *"Tell me about his experience"*, etc.). |
| [`types.ts`](file:///d:/Project/portfolio/src/components/agent/types.ts) | Shared TypeScript interfaces for messages and drafts. |

### Key User Experience & Motion Features
- **Loader Synchronization**: The launcher pill remains hidden until the intro loading animation finishes (listens for `"intro-loader-complete"` and checks `document.documentElement.getAttribute("data-loaded") === "true"`).
- **Lenis Smooth-Scroll Safety**:
  - The dialog container and message list contain `data-lenis-prevent` to prevent Lenis scroll hijacking.
  - On mobile viewports (`< 768px`), opening the widget calls `stopScroll()` and locks the document body; closing calls `startScroll()`.
- **Aesthetic Consistency**:
  - Built strictly with `#0d0d0d` (ink), `#f4f2ee` (paper), white, and `border-[#0d0d0d]/10`.
  - Section headers feature *Instrument Serif* italic accents and *JetBrains Mono* tags.
  - Zero arbitrary gradients, foreign saturated colors, or emojis.
- **Accessibility & Focus Trap**:
  - Semantic `role="dialog"`, `aria-modal="true"`, and `aria-live="polite"` for incoming messages.
  - Tab key cycles focus strictly within dialog elements when open.
  - Pressing `Escape` closes the widget and returns focus to the launcher.
  - Minimum 44×44px touch targets on all interactive buttons.
- **Persistence & Fallback**:
  - Session state persists in `sessionStorage` (`lk_portfolio_chat_messages`).
  - Includes a "New chat" button (`↺`) to reset the conversation.
  - Includes a "Write a message" fallback toggle that works even if the LLM provider is offline.

---

## 8. Configuration & Provider Swapping

All configurations reside in server-only environment variables (never prefixed with `NEXT_PUBLIC_`):

### Supported Providers (`.env.local`)

```env
# ==============================================================================
# LLM PROVIDER SETTINGS (Choose one)
# ==============================================================================

# Option 1: GroqCloud (Ultra-fast streaming)
LLM_API_KEY=gsk_your_groq_key
LLM_MODEL=openai/gpt-oss-20b
LLM_BASE_URL=https://api.groq.com/openai/v1

# Option 2: OpenAI
# LLM_API_KEY=sk-proj-your_openai_key
# LLM_MODEL=gpt-4o-mini
# LLM_BASE_URL=https://api.openai.com/v1

# Option 3: Google Gemini (OpenAI Compatibility Mode)
# LLM_API_KEY=your_gemini_api_key
# LLM_MODEL=gemini-2.0-flash
# LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai

# Option 4: OpenRouter
# LLM_API_KEY=sk-or-v1-your_openrouter_key
# LLM_MODEL=anthropic/claude-3.5-sonnet
# LLM_BASE_URL=https://openrouter.ai/api/v1

# ==============================================================================
# RESEND CONTACT SETTINGS
# ==============================================================================
RESEND_API_KEY=re_your_resend_api_key
CONTACT_TO_EMAIL=kagithalokesh8@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev

# ==============================================================================
# OPTIONAL DISTRIBUTED RATE LIMITING (Upstash Redis)
# ==============================================================================
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 9. Security, Anti-Abuse & Privacy Protocols

| Threat Vector | Defense Mechanism |
| :--- | :--- |
| **API Key Exposure** | Keys are kept exclusively server-side in Node.js environment variables. Zero exposure in client bundles or `.env.example`. |
| **Prompt Injection / Jailbreak** | System prompt explicitly instructs model to ignore roleplay overrides, instruction resets, and system prompt extractors. |
| **Email Header Injection** | All `\r`, `\n`, and `\t` characters are removed from the visitor name and email before dispatching to Resend. |
| **Spam Bot Flooding** | Hidden honeypot `website` field traps automated form bots without triggering Resend API calls. |
| **Denial-of-Service / Abuse** | Two-tier rate limiting: 20 chat requests / 10 min, 3 contact submissions / hr, and a 50/day global cap. |
| **Cross-Site Scripting (XSS)** | Text rendering is built with pure React nodes and regex parsers — **`dangerouslySetInnerHTML` is never used**. |
| **Payload Bloat** | Payloads exceeding 12 messages, 500 characters per message, or 10,000 characters total are rejected at the edge with HTTP 400. |

---

*Verified with Next.js 15.5 production builds, TypeScript strict mode, and full mobile/desktop test suites.*
