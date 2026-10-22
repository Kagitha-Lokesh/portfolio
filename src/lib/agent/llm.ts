import fs from "fs";
import path from "path";
import { retrievePortfolioFacts } from "./offline-retrieval";
import { composeOfflineResponse } from "./offline-composer";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type ProviderId = "primary" | "cloudflare" | "openrouter" | "gemini" | "offline";

export interface ProviderDiagnostic {
  provider: ProviderId;
  model: string;
  status: number;
  statusCategory:
    | "OK"
    | "RATE_LIMITED"
    | "AUTH_ERROR"
    | "UPSTREAM_ERROR"
    | "TIMEOUT"
    | "NETWORK_ERROR"
    | "NOT_CONFIGURED";
  durationMs: number;
  errorSnippet?: string;
  fallbackAttempted: boolean;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "LLM_ERROR",
    public diagnostics: ProviderDiagnostic[] = []
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

// Cached environment reader with fallback to .env.local
let cachedEnv: Record<string, string> | null = null;

function getEnvValue(key: string): string | undefined {
  if (process.env[key]) return process.env[key]?.trim();

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx !== -1) {
            const k = trimmed.slice(0, idx).trim();
            if (k === key) {
              let v = trimmed.slice(idx + 1).trim();
              if (
                (v.startsWith('"') && v.endsWith('"')) ||
                (v.startsWith("'") && v.endsWith("'"))
              ) {
                v = v.slice(1, -1);
              }
              return v;
            }
          }
        }
      }
    }
  } catch {
    // Ignore filesystem read errors in restricted environments
  }

  return undefined;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  model: string;
  endpoint: string;
  isConfigured: boolean;
}

export function getProviderConfigs(): {
  primary: ProviderConfig & { apiKey?: string };
  cloudflare: ProviderConfig & { accountId?: string; apiToken?: string };
  openrouter: ProviderConfig & { apiKey?: string };
  gemini: ProviderConfig & { apiKey?: string };
} {
  // 1. Primary Provider: Groq (or configured OpenAI-compatible endpoint)
  const primaryApiKey = getEnvValue("LLM_API_KEY");
  const primaryModel = getEnvValue("LLM_MODEL") || "openai/gpt-oss-20b";
  let primaryBaseUrl = getEnvValue("LLM_BASE_URL") || "https://api.groq.com/openai/v1";
  primaryBaseUrl = primaryBaseUrl.replace(/\/+$/, "");
  const primaryEndpoint = primaryBaseUrl.endsWith("/chat/completions")
    ? primaryBaseUrl
    : `${primaryBaseUrl}/chat/completions`;

  // 2. Fallback 1: Cloudflare Workers AI
  const cfAccountId = getEnvValue("CLOUDFLARE_ACCOUNT_ID");
  const cfApiToken = getEnvValue("CLOUDFLARE_API_TOKEN");
  const cfModel = getEnvValue("CLOUDFLARE_AI_MODEL") || "@cf/meta/llama-3.1-8b-instruct";
  const cfEndpoint =
    cfAccountId && cfApiToken
      ? `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`
      : "";

  // 3. Fallback 2: OpenRouter (:free model route only)
  const openRouterApiKey = getEnvValue("OPENROUTER_API_KEY");
  const openRouterModel = getEnvValue("OPENROUTER_MODEL") || "nvidia/nemotron-3.5-super-vl:free";
  const openRouterEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  // 4. Fallback 3: Google Gemini (OpenAI Compatibility Mode)
  const geminiApiKey = getEnvValue("GEMINI_API_KEY");
  const geminiModel = getEnvValue("GEMINI_MODEL") || "gemini-2.5-flash";
  const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

  return {
    primary: {
      id: "primary",
      name: "Groq (Primary)",
      apiKey: primaryApiKey,
      model: primaryModel,
      endpoint: primaryEndpoint,
      isConfigured: Boolean(primaryApiKey),
    },
    cloudflare: {
      id: "cloudflare",
      name: "Cloudflare Workers AI",
      accountId: cfAccountId,
      apiToken: cfApiToken,
      model: cfModel,
      endpoint: cfEndpoint,
      isConfigured: Boolean(cfAccountId && cfApiToken),
    },
    openrouter: {
      id: "openrouter",
      name: "OpenRouter Free",
      apiKey: openRouterApiKey,
      model: openRouterModel,
      endpoint: openRouterEndpoint,
      isConfigured: Boolean(openRouterApiKey),
    },
    gemini: {
      id: "gemini",
      name: "Google Gemini",
      apiKey: geminiApiKey,
      model: geminiModel,
      endpoint: geminiEndpoint,
      isConfigured: Boolean(geminiApiKey),
    },
  };
}

// Legacy helper for backwards compatibility
export function getLLMConfig() {
  const { primary } = getProviderConfigs();
  return {
    apiKey: primary.apiKey,
    model: primary.model,
    endpoint: primary.endpoint,
  };
}

/**
 * Transforms an OpenAI-compatible SSE ReadableStream into a ReadableStream of raw UTF-8 chunk Uint8Arrays.
 */
function createOpenAISSEParser(
  responseBody: ReadableStream<Uint8Array>,
  onMidStreamError?: (err: Error) => void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = responseBody.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const textChunk =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.text ??
                "";
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch {
              // Ignore partial JSON chunks during SSE stream
            }
          }
        }

        controller.close();
      } catch (err: unknown) {
        if (onMidStreamError) {
          onMidStreamError(err as Error);
        }
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

/**
 * Transforms a Cloudflare Workers AI SSE or JSON response into a ReadableStream of raw UTF-8 chunk Uint8Arrays.
 */
function createCloudflareParser(
  response: Response,
  onMidStreamError?: (err: Error) => void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const contentType = response.headers.get("content-type") || "";

  // If Cloudflare returned a non-streaming JSON payload
  if (!contentType.includes("text/event-stream") && response.body) {
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const json = await response.json();
          const text = json?.result?.response || "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  const reader = response.body!.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              // Cloudflare SSE format: { "response": "word" }
              const textChunk = parsed.response;
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch {
              // Ignore partial chunks
            }
          }
        }

        controller.close();
      } catch (err: unknown) {
        if (onMidStreamError) {
          onMidStreamError(err as Error);
        }
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

/**
 * Classifies an HTTP status code or error into a sanitized diagnostic category.
 */
function categorizeError(status: number, errName?: string): ProviderDiagnostic["statusCategory"] {
  if (errName === "AbortError" || status === 504) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 401 || status === 403) return "AUTH_ERROR";
  if (status >= 500) return "UPSTREAM_ERROR";
  if (status === 0 || errName === "TypeError") return "NETWORK_ERROR";
  return "UPSTREAM_ERROR";
}

/**
 * Attempts a single provider call with bounded timeout and returns a verified stream if the provider responds with valid text.
 * Streaming Safety Guarantee: Reads the first chunk before returning, ensuring failover happens BEFORE any bytes reach the client.
 */
async function attemptProvider(
  provider: ProviderConfig & { apiKey?: string; apiToken?: string; accountId?: string },
  messages: ChatMessage[],
  clientSignal?: AbortSignal,
  timeoutMs: number = 15000
): Promise<{ stream: ReadableStream<Uint8Array>; diagnostic: ProviderDiagnostic }> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (clientSignal) {
    clientSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    if (getEnvValue("LOKI_SIMULATE_TOTAL_FAILURE") === "true") {
      throw new LLMError("Simulated remote provider outage", 503, "UPSTREAM_ERROR");
    }

    let response: Response;

    if (provider.id === "cloudflare") {
      response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });
    } else if (provider.id === "openrouter") {
      response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lokeshkagitha.dev",
          "X-Title": "LOKI Portfolio Assistant",
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.2,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });
    } else if (provider.id === "gemini") {
      // Google Gemini in OpenAI compatibility mode
      response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.2,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });

      // If gemini-2.5-flash returns 404 because Google deprecated it in favor of gemini-3.8-flash:
      if (response.status === 404 && provider.model === "gemini-2.5-flash") {
        console.warn("[LOKI Provider] Gemini 2.5 deprecated by Google. Retrying with gemini-3.8-flash...");
        response = await fetch(provider.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            messages,
            temperature: 0.2,
            max_tokens: 800,
            stream: true,
          }),
          signal: controller.signal,
        });
      }
    } else {
      // Primary provider (Groq)
      response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.2,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      let errorSnippet = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        const msg = errJson?.error?.message || errJson?.errors?.[0]?.message;
        if (msg) errorSnippet = msg.slice(0, 150);
      } catch {
        // Non-JSON error body
      }

      const diag: ProviderDiagnostic = {
        provider: provider.id,
        model: provider.model,
        status: response.status,
        statusCategory: categorizeError(response.status),
        durationMs,
        errorSnippet,
        fallbackAttempted: true,
      };

      throw new LLMError(errorSnippet, response.status, diag.statusCategory, [diag]);
    }

    if (!response.body) {
      throw new Error("No response body received from provider.");
    }

    // Build normalized stream parser
    const parsedStream =
      provider.id === "cloudflare"
        ? createCloudflareParser(response)
        : createOpenAISSEParser(response.body);

    // CRITICAL STREAMING SAFETY:
    // Read the first chunk to ensure this provider is actively yielding text.
    // If it fails immediately or aborts before emitting words, we catch it here and fall over!
    const reader = parsedStream.getReader();
    let firstChunk: Uint8Array | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.length > 0) {
        firstChunk = value;
        break;
      }
    }

    if (!firstChunk) {
      throw new Error("Provider returned empty response stream without text.");
    }

    // Provider verified! Lock in this provider.
    // If mid-stream fails after this point, terminate cleanly—never concatenate a second model.
    const clientStream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        if (firstChunk) {
          ctrl.enqueue(firstChunk);
        }
      },
      async pull(ctrl) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              ctrl.close();
              return;
            }
            if (value && value.length > 0) {
              ctrl.enqueue(value);
              return;
            }
          }
        } catch (streamErr) {
          console.error(`[LOKI Stream Interrupted: ${provider.id}]`, (streamErr as Error)?.message);
          ctrl.error(streamErr);
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    const successDiag: ProviderDiagnostic = {
      provider: provider.id,
      model: provider.model,
      status: 200,
      statusCategory: "OK",
      durationMs,
      fallbackAttempted: false,
    };

    return { stream: clientStream, diagnostic: successDiag };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const isAbort = (err as Error)?.name === "AbortError";
    const status = (err as LLMError)?.statusCode || (isAbort ? 504 : 502);
    const category = isAbort ? "TIMEOUT" : categorizeError(status, (err as Error)?.name);
    const snippet = (err as Error)?.message?.slice(0, 150) || "Connection failed";

    const failedDiag: ProviderDiagnostic = {
      provider: provider.id,
      model: provider.model,
      status,
      statusCategory: category,
      durationMs,
      errorSnippet: snippet,
      fallbackAttempted: true,
    };

    throw new LLMError(snippet, status, category, [failedDiag]);
  }
}

/**
 * Main entry point with Multi-Provider Automatic Failover.
 * Sequence: Groq (Primary) → Cloudflare Workers AI → OpenRouter → Google Gemini → Clean 503 Fallback.
 */
export async function createLLMStream(
  messages: ChatMessage[],
  clientSignal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const configs = getProviderConfigs();
  const providerSequence: Array<ProviderConfig & { apiKey?: string; apiToken?: string; accountId?: string }> = [
    configs.primary,
    configs.cloudflare,
    configs.openrouter,
    configs.gemini,
  ];

  const accumulatedDiagnostics: ProviderDiagnostic[] = [];

  for (let i = 0; i < providerSequence.length; i++) {
    const provider = providerSequence[i];

    if (!provider.isConfigured) {
      const skipDiag: ProviderDiagnostic = {
        provider: provider.id,
        model: provider.model,
        status: 0,
        statusCategory: "NOT_CONFIGURED",
        durationMs: 0,
        errorSnippet: "Credentials not configured in environment.",
        fallbackAttempted: true,
      };
      accumulatedDiagnostics.push(skipDiag);
      console.log(
        `[LOKI Provider] ${provider.name} (${provider.model}): NOT_CONFIGURED. Skipping to next provider.`
      );
      continue;
    }

    try {
      console.log(
        `[LOKI Provider] Attempting ${provider.name} (${provider.model})... [Attempt ${i + 1}/${providerSequence.length}]`
      );

      // Bounded 15s timeout per provider attempt
      const result = await attemptProvider(provider, messages, clientSignal, 15000);

      console.log(
        `[LOKI Provider] ${provider.name} (${provider.model}): Selected successfully (200 OK, ${result.diagnostic.durationMs}ms).`
      );

      accumulatedDiagnostics.push(result.diagnostic);
      lastSessionDiagnostics = [...accumulatedDiagnostics];
      return result.stream;
    } catch (err: unknown) {
      if (err instanceof LLMError && err.diagnostics.length > 0) {
        accumulatedDiagnostics.push(...err.diagnostics);
      } else {
        accumulatedDiagnostics.push({
          provider: provider.id,
          model: provider.model,
          status: 500,
          statusCategory: "UPSTREAM_ERROR",
          durationMs: 0,
          errorSnippet: (err as Error)?.message || "Unknown error",
          fallbackAttempted: true,
        });
      }

      const lastDiag = accumulatedDiagnostics[accumulatedDiagnostics.length - 1];
      console.warn(
        `[LOKI Provider Failover] ${provider.name} failed with ${lastDiag.statusCategory} (${lastDiag.status}) in ${lastDiag.durationMs}ms: "${lastDiag.errorSnippet}". Moving to fallback provider.`
      );
    }
  }

  // All 4 remote providers failed or were unconfigured.
  // CRITICAL STREAMING SAFETY: Zero remote bytes were committed to client.
  // Activate LOKI Offline Intelligence Engine.
  const offlineStartTime = Date.now();
  console.log(
    `[LOKI Provider Failover] All remote providers exhausted. Activating LOKI Offline Intelligence Engine.`
  );

  try {
    const userMessages = messages.filter((m) => m.role === "user");
    const latestUserMsg = userMessages[userMessages.length - 1];
    const query = latestUserMsg ? latestUserMsg.content : "";

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1);

    const retrieval = await retrievePortfolioFacts(query, history);
    const composed = composeOfflineResponse(query, retrieval, history);

    const offlineDurationMs = Date.now() - offlineStartTime;
    const offlineDiag: ProviderDiagnostic = {
      provider: "offline",
      model: "loki-offline-intelligence",
      status: 200,
      statusCategory: "OK",
      durationMs: offlineDurationMs,
      fallbackAttempted: false,
    };

    accumulatedDiagnostics.push(offlineDiag);
    lastSessionDiagnostics = [...accumulatedDiagnostics];

    console.log(
      `[LOKI Provider] Offline Intelligence Engine: Selected successfully (200 OK, ${offlineDurationMs}ms, intent: ${composed.intent}).`
    );

    return createOfflineStream(composed.rawOutput, clientSignal);
  } catch (offlineErr: unknown) {
    console.error(`[LOKI Offline Engine Failed]:`, (offlineErr as Error)?.message);

    lastSessionDiagnostics = [...accumulatedDiagnostics];
    throw new LLMError(
      "LOKI is temporarily unable to answer questions. Please try again later, or use the contact option to reach Lokesh.",
      503,
      "ALL_PROVIDERS_UNAVAILABLE",
      accumulatedDiagnostics
    );
  }
}

let lastSessionDiagnostics: ProviderDiagnostic[] = [];
export function getLastSessionDiagnostics(): ProviderDiagnostic[] {
  return [...lastSessionDiagnostics];
}

/**
 * Create a chunked ReadableStream<Uint8Array> simulating progressive streaming
 * for offline deterministic responses.
 */
export function createOfflineStream(
  text: string,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(ctrl) {
      if (signal?.aborted) {
        ctrl.error(new Error("Stream aborted by client"));
        return;
      }

      // Split text into words/whitespace for progressive streaming simulation
      const chunks = text.match(/\S+\s*/g) || [text];

      for (const chunk of chunks) {
        if (signal?.aborted) {
          ctrl.error(new Error("Stream aborted by client"));
          return;
        }

        ctrl.enqueue(encoder.encode(chunk));

        // Yield execution to event loop for natural progressive rendering
        if (chunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 6));
        }
      }

      ctrl.close();
    },
    cancel() {
      // Reader cancelled
    },
  });
}
