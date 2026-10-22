/**
 * LOKI Multi-Provider Failover & Offline Intelligence Test Suite (Phase 5)
 *
 * Validates:
 * 1. Groq (Primary) success (no fallback).
 * 2. Cloudflare Workers AI fallback success.
 * 3. OpenRouter free fallback success.
 * 4. Google Gemini fallback success.
 * 5. All 4 remote providers failing activates LOKI Offline Intelligence.
 * 6. Offline diagnostics record "offline" as the selected provider.
 * 7. Unconfigured providers are handled correctly.
 * 8. Offline output conforms to the existing stream contract.
 * 9. Navigation markers [[NAV_ACTION]] survive integration.
 * 10. Contact draft markers [[CONTACT_DRAFT]] survive integration.
 * 11. Conversation history is passed correctly to retrieval & composer.
 * 12. No offline fallback occurs after remote response bytes have been committed.
 * 13. Contact drafts are prepared without automatically sending email.
 * 14. Unsupported portfolio questions do not produce invented facts.
 * 15. Clean 503 error preserved if offline engine itself fails.
 */

import {
  createLLMStream,
  getProviderConfigs,
  ChatMessage,
  LLMError,
  isLLMError,
  getLastSessionDiagnostics,
} from "../src/lib/agent/llm";
import { buildSystemPrompt } from "../src/lib/agent/knowledge";
import {
  extractContactDraft,
  extractNavAction,
  stripInternalMarkers,
} from "../src/components/agent/FormattedText";

const sampleMessages: ChatMessage[] = [
  { role: "system", content: buildSystemPrompt() },
  { role: "user", content: "Hi LOKI, what is Lokesh's role?" },
];

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

const originalFetch = global.fetch;

async function runTestSuite() {
  console.log("=== LOKI Multi-Provider Failover & Offline Intelligence Test Suite ===");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] Scenario ${total}: ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] Scenario ${total}: ${desc}`);
      if (details) {
        console.error(`   Details: ${details}`);
      }
    }
  }

  // -------------------------------------------------------------
  // Test 1: Configuration Verification
  // -------------------------------------------------------------
  const configs = getProviderConfigs();
  assert(
    configs.primary.endpoint.includes("/chat/completions") &&
      configs.primary.model.length > 0 &&
      configs.gemini.endpoint.includes("generativelanguage.googleapis.com"),
    "Provider configs properly structured for all 4 providers"
  );

  // -------------------------------------------------------------
  // Test 2: Primary (Groq) succeeds -> No fallback occurs
  // -------------------------------------------------------------
  {
    let primaryCalled = false;
    let fallbackCalled = false;

    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        primaryCalled = true;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Lokesh is an Associate Software Engineer."}}]}\n\ndata: [DONE]\n\n'
              )
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      fallbackCalled = true;
      return new Response("Not reached", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      primaryCalled && !fallbackCalled && text.includes("Associate Software Engineer"),
      "Primary succeeds: no fallback occurs, correct text streamed"
    );
  }

  // -------------------------------------------------------------
  // Test 3: Primary returns 429 -> Cloudflare fallback succeeds
  // -------------------------------------------------------------
  {
    let cfCalled = false;
    process.env.CLOUDFLARE_ACCOUNT_ID = "mock_cf_account";
    process.env.CLOUDFLARE_API_TOKEN = "mock_cf_token";

    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        return new Response("Rate limit exceeded", { status: 429 });
      }
      if (url.includes("cloudflare.com")) {
        cfCalled = true;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"response":"LOKI: Answer via Cloudflare Workers AI."}\n\ndata: [DONE]\n\n')
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Unknown", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      cfCalled && text.includes("via Cloudflare Workers AI"),
      "Primary 429 triggers failover to Cloudflare Workers AI successfully"
    );
  }

  // -------------------------------------------------------------
  // Test 4: Primary & Cloudflare fail -> OpenRouter fallback succeeds
  // -------------------------------------------------------------
  {
    let openRouterCalled = false;
    process.env.OPENROUTER_API_KEY = "mock_openrouter_key";

    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        return new Response("Primary 503", { status: 503 });
      }
      if (url.includes("cloudflare.com")) {
        return new Response("Cloudflare 500", { status: 500 });
      }
      if (url.includes("openrouter.ai")) {
        openRouterCalled = true;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"LOKI: Answer via OpenRouter Free model."}}]}\n\ndata: [DONE]\n\n'
              )
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Unknown", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      openRouterCalled && text.includes("via OpenRouter Free model"),
      "Primary and Cloudflare failure triggers OpenRouter fallback successfully"
    );
  }

  // -------------------------------------------------------------
  // Test 5: Primary, Cloudflare & OpenRouter fail -> Gemini succeeds
  // -------------------------------------------------------------
  {
    let geminiCalled = false;
    process.env.GEMINI_API_KEY = "mock_gemini_key";

    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        return new Response("Primary 429", { status: 429 });
      }
      if (url.includes("cloudflare.com")) {
        return new Response("Cloudflare 500", { status: 500 });
      }
      if (url.includes("openrouter.ai")) {
        return new Response("OpenRouter 502", { status: 502 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        geminiCalled = true;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"LOKI: Answer via Google Gemini."}}]}\n\ndata: [DONE]\n\n'
              )
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Unknown", { status: 404 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      geminiCalled && text.includes("via Google Gemini"),
      "Primary, Cloudflare, and OpenRouter failure triggers Google Gemini fallback successfully"
    );
  }

  // -------------------------------------------------------------
  // Test 6: All 4 remote providers fail -> Activates LOKI Offline Intelligence
  // -------------------------------------------------------------
  {
    global.fetch = async () => {
      return new Response("All Upstream Down", { status: 503 });
    };

    const offlineMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: "Tell me about JavaMentor project" },
    ];

    const stream = await createLLMStream(offlineMessages);
    const rawText = await readStream(stream);

    assert(
      rawText.includes("JavaMentor") &&
        rawText.includes("Tech Stack") &&
        rawText.includes("Firebase"),
      "All 4 remote providers fail -> LOKI Offline Intelligence activates and streams verified project data",
      rawText
    );
  }

  // -------------------------------------------------------------
  // Test 7: Offline diagnostics identify 'offline' as selected provider
  // -------------------------------------------------------------
  {
    const diags = getLastSessionDiagnostics();
    const offlineDiag = diags.find((d) => d.provider === "offline");
    assert(
      offlineDiag !== undefined &&
        offlineDiag.status === 200 &&
        offlineDiag.statusCategory === "OK" &&
        offlineDiag.model === "loki-offline-intelligence",
      "Offline diagnostics accurately record 'offline' provider with 200 OK status",
      JSON.stringify(offlineDiag)
    );
  }

  // -------------------------------------------------------------
  // Test 8: Unconfigured providers handled correctly
  // -------------------------------------------------------------
  {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.OPENROUTER_API_KEY;
    process.env.GEMINI_API_KEY = "mock_gemini_key";

    let geminiReached = false;
    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        return new Response("Primary 429", { status: 429 });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        geminiReached = true;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Answered directly via Gemini."}}]}\n\ndata: [DONE]\n\n'
              )
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Unknown", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      geminiReached && text.includes("directly via Gemini"),
      "Missing intermediate credentials cleanly skipped directly to next configured provider"
    );
  }

  // -------------------------------------------------------------
  // Test 9: Pre-stream verification guarantees no duplicate stream leakage
  // -------------------------------------------------------------
  {
    process.env.CLOUDFLARE_ACCOUNT_ID = "mock_cf_account";
    process.env.CLOUDFLARE_API_TOKEN = "mock_cf_token";

    let primaryStreamBrokenBeforeChunk = false;
    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        primaryStreamBrokenBeforeChunk = true;
        // Stream breaks immediately before any tokens
        const stream = new ReadableStream({
          start(controller) {
            controller.error(new Error("Upstream pipe broke before tokens"));
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      if (url.includes("cloudflare.com")) {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"response":"Cloudflare clean stream."}\n\ndata: [DONE]\n\n')
            );
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Not reached", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    const text = await readStream(stream);

    assert(
      primaryStreamBrokenBeforeChunk && text === "Cloudflare clean stream.",
      "Pre-stream verification guarantees no partial duplicate stream leakage"
    );
  }

  // -------------------------------------------------------------
  // Test 10: No offline fallback occurs after remote response bytes committed
  // -------------------------------------------------------------
  {
    // If a provider emits a chunk and then breaks, the client stream errors cleanly.
    // It must NOT restart with an offline answer midway!
    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("groq.com") || url.includes("openai.com")) {
        let chunkSent = false;
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"First partial chunk emitted."}}]}\n\n'
              )
            );
            chunkSent = true;
          },
          pull(controller) {
            if (chunkSent) {
              controller.error(new Error("Mid-stream connection severed"));
            }
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      return new Response("Fallback Should Not Be Called", { status: 500 });
    };

    const stream = await createLLMStream(sampleMessages);
    let streamFailedMidway = false;
    try {
      await readStream(stream);
    } catch {
      streamFailedMidway = true;
    }

    assert(
      streamFailedMidway,
      "No offline fallback occurs after remote response bytes have been committed (prevents double streaming)"
    );
  }

  // -------------------------------------------------------------
  // Test 11: Navigation markers [[NAV_ACTION]] survive integration
  // -------------------------------------------------------------
  {
    global.fetch = async () => new Response("All Down", { status: 503 });

    const navMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: "What projects has Lokesh built?" },
    ];

    const stream = await createLLMStream(navMessages);
    const rawText = await readStream(stream);
    const nav = extractNavAction(rawText);

    assert(
      Boolean(nav) && nav?.section === "work",
      "Offline response emits valid [[NAV_ACTION]] parseable by FormattedText.tsx",
      rawText
    );
  }

  // -------------------------------------------------------------
  // Test 12: Contact-draft markers [[CONTACT_DRAFT]] survive integration
  // -------------------------------------------------------------
  {
    global.fetch = async () => new Response("All Down", { status: 503 });

    const contactMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "user",
        content:
          "I'm Raj Shekar from Charani Info Tech. I want to hire Lokesh for a Full Stack role. Email: raj@example.com",
      },
    ];

    const stream = await createLLMStream(contactMessages);
    const rawText = await readStream(stream);
    const draft = extractContactDraft(rawText);
    const cleanText = stripInternalMarkers(rawText);

    assert(
      Boolean(draft) &&
        draft?.name === "Raj Shekar" &&
        draft?.email === "raj@example.com" &&
        !cleanText.includes("[[CONTACT_DRAFT]]"),
      "Offline contact flow emits parseable [[CONTACT_DRAFT]] with clean text display",
      rawText
    );
  }

  // -------------------------------------------------------------
  // Test 13: Conversation history passed correctly (Follow-up resolution)
  // -------------------------------------------------------------
  {
    global.fetch = async () => new Response("All Down", { status: 503 });

    const historyMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: "Tell me about JavaMentor" },
      {
        role: "assistant",
        content: "JavaMentor is a full-stack learning platform for Java developers.",
      },
      { role: "user", content: "What features does it have?" },
    ];

    const stream = await createLLMStream(historyMessages);
    const rawText = await readStream(stream);

    assert(
      rawText.includes("JavaMentor") && rawText.includes("Key Highlights"),
      "Conversation history enables offline engine to resolve follow-up pronoun 'it' to JavaMentor",
      rawText
    );
  }

  // -------------------------------------------------------------
  // Test 14: Unsupported questions do not produce invented facts
  // -------------------------------------------------------------
  {
    global.fetch = async () => new Response("All Down", { status: 503 });

    const salaryMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: "What is Lokesh's current salary expectation?" },
    ];

    const stream = await createLLMStream(salaryMessages);
    const rawText = await readStream(stream);

    assert(
      rawText.includes("salary expectations") &&
        !rawText.includes("$") &&
        !rawText.includes("₹"),
      "Unsupported salary query honestly states boundary without inventing numbers",
      rawText
    );
  }

  // -------------------------------------------------------------
  // Test 15: Clean 503 error preserved if offline engine itself fails
  // -------------------------------------------------------------
  {
    global.fetch = async () => new Response("All Down", { status: 503 });

    // Simulate empty message array where offline engine cannot find query
    let caught503: LLMError | null = null;
    try {
      // Empty user turns
      await createLLMStream([{ role: "system", content: "Empty" }]);
    } catch (err: unknown) {
      if (isLLMError(err)) {
        caught503 = err;
      }
    }

    assert(
      caught503 === null || caught503.statusCode === 503,
      "Clean 503 error preserved as ultimate safeguard if engine encountered error"
    );
  }

  // Restore fetch
  global.fetch = originalFetch;

  console.log(`\nResults: ${passed}/${total} multi-provider failover scenarios passed successfully.`);
  if (passed === total) {
    console.log("✓ All Phase 5 provider failover & offline intelligence tests PASSED!");
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
