import fs from "fs";
import path from "path";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "LLM_ERROR"
  ) {
    super(message);
    this.name = "LLMError";
    Object.setPrototypeOf(this, LLMError.prototype);
  }
}

export function isLLMError(err: unknown): err is LLMError {
  return (
    err instanceof LLMError ||
    (typeof err === "object" && err !== null && (err as { name?: string }).name === "LLMError")
  );
}

export function getLLMConfig() {
  let apiKey = process.env.LLM_API_KEY?.trim();
  let model = process.env.LLM_MODEL?.trim();
  let baseUrl = process.env.LLM_BASE_URL?.trim();

  // If running in dev server that started before .env.local was created, read .env.local as fallback
  if (!apiKey) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const idx = trimmed.indexOf("=");
            if (idx !== -1) {
              const k = trimmed.slice(0, idx).trim();
              const v = trimmed.slice(idx + 1).trim();
              if (k === "LLM_API_KEY" && !apiKey) apiKey = v;
              if (k === "LLM_MODEL" && !model) model = v;
              if (k === "LLM_BASE_URL" && !baseUrl) baseUrl = v;
            }
          }
        }
      }
    } catch {}
  }

  model = model || "gpt-4o-mini";
  baseUrl = baseUrl || "https://api.openai.com/v1";

  // Normalize baseUrl
  baseUrl = baseUrl.replace(/\/+$/, "");
  const endpoint = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  return { apiKey, model, endpoint };
}

export async function createLLMStream(
  messages: ChatMessage[],
  clientSignal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, model, endpoint } = getLLMConfig();

  if (!apiKey) {
    throw new LLMError(
      "AI assistant is currently offline. Please use the contact form to reach Lokesh directly.",
      503,
      "CONFIG_MISSING"
    );
  }

  // Request timeout controller (25 seconds)
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 25000);

  // Link client abort signal if provided
  if (clientSignal) {
    clientSignal.addEventListener("abort", () => {
      timeoutController.abort();
    });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 800,
        stream: true,
      }),
      signal: timeoutController.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new LLMError("Request timed out. Please try again.", 504, "TIMEOUT");
    }
    // Generic error, never leak keys or internal network errors
    console.error("[LLM Error] Upstream connection failed:", (err as Error)?.message);
    throw new LLMError(
      "Unable to connect to AI provider. Please try again shortly.",
      502,
      "UPSTREAM_ERROR"
    );
  }

  if (!upstreamResponse.ok) {
    clearTimeout(timeoutId);
    let errorMessage = "AI provider encountered an error.";
    try {
      const errBody = await upstreamResponse.json();
      if (errBody?.error?.message) {
        console.error("[LLM Error] Upstream returned error:", errBody.error.message);
      }
    } catch {
      console.error("[LLM Error] Upstream returned status:", upstreamResponse.status);
    }

    if (upstreamResponse.status === 429) {
      errorMessage = "AI assistant is temporarily busy. Please wait a moment.";
    }

    throw new LLMError(errorMessage, upstreamResponse.status === 429 ? 429 : 502, "PROVIDER_ERROR");
  }

  const upstreamBody = upstreamResponse.body;
  if (!upstreamBody) {
    clearTimeout(timeoutId);
    throw new LLMError("No response stream received from AI provider.", 502, "NO_STREAM");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstreamBody.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              clearTimeout(timeoutId);
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = parsed.choices?.[0]?.delta?.content;
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }

        clearTimeout(timeoutId);
        controller.close();
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          controller.error(new LLMError("Stream timed out.", 504, "TIMEOUT"));
        } else {
          console.error("[LLM Stream Error]:", (err as Error)?.message);
          controller.error(new LLMError("Stream interrupted.", 500, "STREAM_ERROR"));
        }
      }
    },
    cancel() {
      clearTimeout(timeoutId);
      reader.cancel().catch(() => {});
    },
  });
}
