import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/agent/knowledge";
import { createLLMStream, ChatMessage, LLMError, isLLMError } from "@/lib/agent/llm";
import { getClientIp, rateLimit } from "@/lib/agent/rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGES = 24;
const MAX_USER_MSG_CHARS = 500;
const MAX_TOTAL_CHARS = 10000;

export async function POST(req: NextRequest) {
  console.log("[POST /api/chat] handler started");
  try {
    // 1. Rate limiting: 20 requests / 10 minutes per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `chat:${clientIp}`;
    const rateCheck = await rateLimit({
      key: rateLimitKey,
      limit: 20,
      windowSeconds: 600, // 10 minutes
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit reached. Please wait a few minutes before sending more messages.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateCheck.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 2. Parse & Validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !("messages" in body)) {
      return NextResponse.json(
        { error: "Missing 'messages' in request body.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { messages } = body as { messages: unknown };

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "'messages' must be an array.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        {
          error: `Conversation exceeds the maximum limit of ${MAX_MESSAGES} messages. Please start a new chat.`,
          code: "TOO_MANY_MESSAGES",
        },
        { status: 400 }
      );
    }

    let totalChars = 0;
    const validatedMessages: ChatMessage[] = [];

    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return NextResponse.json(
          { error: "Malformed message object.", code: "BAD_REQUEST" },
          { status: 400 }
        );
      }

      const role = (msg as { role?: unknown }).role;
      const content = (msg as { content?: unknown }).content;

      if (role !== "user" && role !== "assistant") {
        return NextResponse.json(
          { error: "Only 'user' and 'assistant' roles are permitted.", code: "BAD_REQUEST" },
          { status: 400 }
        );
      }

      if (typeof content !== "string") {
        return NextResponse.json(
          { error: "Message content must be a string.", code: "BAD_REQUEST" },
          { status: 400 }
        );
      }

      const trimmedContent = content.trim();

      if (role === "user" && trimmedContent.length > MAX_USER_MSG_CHARS) {
        return NextResponse.json(
          {
            error: `Message exceeds the ${MAX_USER_MSG_CHARS} character limit. Please shorten your question.`,
            code: "MESSAGE_TOO_LONG",
          },
          { status: 400 }
        );
      }

      totalChars += trimmedContent.length;
      if (totalChars > MAX_TOTAL_CHARS) {
        return NextResponse.json(
          {
            error: "Total conversation payload is too large. Please start a new chat.",
            code: "PAYLOAD_TOO_LARGE",
          },
          { status: 400 }
        );
      }

      validatedMessages.push({
        role,
        content: trimmedContent,
      });
    }

    // 3. Assemble complete message array with server-enforced system prompt
    const systemPrompt = buildSystemPrompt();
    const fullConversation: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...validatedMessages,
    ];

    // 4. Stream response
    const stream = await createLLMStream(fullConversation, req.signal);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    if (isLLMError(err)) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    console.error("[Chat API Internal Error]:", (err as Error)?.message);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again or use the contact form.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
