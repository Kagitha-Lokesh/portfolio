import fs from "fs";
import path from "path";

const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

function setSimulateFailure(enabled: boolean) {
  let content = fs.existsSync(ENV_LOCAL_PATH) ? fs.readFileSync(ENV_LOCAL_PATH, "utf8") : "";
  // Strip any existing LOKI_SIMULATE_TOTAL_FAILURE lines
  content = content
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("LOKI_SIMULATE_TOTAL_FAILURE"))
    .join("\n");

  if (enabled) {
    content += "\nLOKI_SIMULATE_TOTAL_FAILURE=true\n";
  }
  fs.writeFileSync(ENV_LOCAL_PATH, content, "utf8");
}

async function callChat(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function runValidation() {
  console.log("================================================================================");
  console.log("        LOKI Phase 5: Complete End-to-End Live Application Validation           ");
  console.log("================================================================================\n");

  let allPassed = true;

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: Normal Operation (Remote Provider)
    // -------------------------------------------------------------------------
    console.log("--- Scenario 1: Normal Operation (Remote Provider) ---");
    setSimulateFailure(false);
    // Wait 500ms to allow file watcher/hot reload to settle
    await new Promise((r) => setTimeout(r, 500));

    const s1 = await callChat([
      { role: "user", content: "What projects has Lokesh built?" },
    ]);
    console.log("Status:", s1.status);
    console.log("Response Preview:\n" + s1.text.substring(0, 350) + "...\n");

    const s1Passed =
      s1.status === 200 &&
      s1.text.includes("Purnima Kalamkari") &&
      s1.text.includes("JavaMentor") &&
      s1.text.includes("[[NAV_ACTION]]");

    console.log("Scenario 1 Check (Remote Provider responded with projects & nav):", s1Passed ? "PASSED" : "FAILED");
    if (!s1Passed) allPassed = false;
    console.log("\n--------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // Scenario 2: Total Provider Failure (Offline Engine Activation)
    // -------------------------------------------------------------------------
    console.log("--- Scenario 2: Total Provider Failure (Simulate Outage -> Offline Fallback) ---");
    setSimulateFailure(true);
    await new Promise((r) => setTimeout(r, 500));

    const s2 = await callChat([
      { role: "user", content: "What projects has Lokesh built?" },
    ]);
    console.log("Status:", s2.status);
    console.log("Full Offline Response:\n" + s2.text);

    // Verify:
    // 1. Returns 200 OK (not 500 or 503 error)
    // 2. Contains verified portfolio projects from data.ts
    // 3. No credentials or internal keys exposed
    // 4. Emits navigation marker
    const s2NoLeak =
      !s2.text.includes("gsk_") &&
      !s2.text.includes("sk-or") &&
      !s2.text.includes("API_KEY") &&
      !s2.text.includes("Internal Server Error");

    const s2Passed =
      s2.status === 200 &&
      s2.text.includes("JavaMentor") &&
      s2.text.includes("Purnima Kalamkari") &&
      s2.text.includes("[[NAV_ACTION]]") &&
      s2NoLeak;

    console.log("Scenario 2 Check (Offline engine answered safely with verified facts):", s2Passed ? "PASSED" : "FAILED");
    if (!s2Passed) allPassed = false;
    console.log("\n--------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // Scenario 3: Contact Conversation (Multi-Turn Context Retention)
    // -------------------------------------------------------------------------
    console.log("--- Scenario 3: Contact Conversation (Turn 1: Name, Org, Purpose) ---");
    const turn1Msg = {
      role: "user" as const,
      content: "I'm Raj Shekar from Charani Info Tech. I want to discuss a full stack opportunity with Lokesh.",
    };
    const s3Turn1 = await callChat([turn1Msg]);
    console.log("Turn 1 Response:\n" + s3Turn1.text);

    const s3Turn1Passed =
      s3Turn1.status === 200 &&
      s3Turn1.text.includes("Raj Shekar") &&
      s3Turn1.text.toLowerCase().includes("email address");
    console.log("Turn 1 Check (Acknowledges Raj Shekar & asks only for email):", s3Turn1Passed ? "PASSED" : "FAILED");
    if (!s3Turn1Passed) allPassed = false;

    console.log("\n--- Scenario 3: Contact Conversation (Turn 2: Supplying Email Only) ---");
    const turn2Msg = {
      role: "user" as const,
      content: "raj@example.com",
    };
    const s3Turn2 = await callChat([
      turn1Msg,
      { role: "assistant", content: s3Turn1.text },
      turn2Msg,
    ]);
    console.log("Turn 2 Response:\n" + s3Turn2.text);

    const s3Turn2Passed =
      s3Turn2.status === 200 &&
      s3Turn2.text.includes("[[CONTACT_DRAFT]]") &&
      s3Turn2.text.includes("Raj Shekar") &&
      s3Turn2.text.includes("Charani Info Tech") &&
      s3Turn2.text.includes("raj@example.com");

    console.log("Turn 2 Check (Retains earlier name & org, crafts [[CONTACT_DRAFT]]):", s3Turn2Passed ? "PASSED" : "FAILED");
    if (!s3Turn2Passed) allPassed = false;
    console.log("\n--------------------------------------------------------------------------------\n");

    // -------------------------------------------------------------------------
    // Scenario 4: Follow-up Context Resolution
    // -------------------------------------------------------------------------
    console.log("--- Scenario 4: Follow-up Context Resolution ---");
    const followUpHistory = [
      { role: "user" as const, content: "Tell me about JavaMentor" },
      {
        role: "assistant" as const,
        content:
          "JavaMentor is a learning platform for Java Full Stack Development with authentication, coding practice, interview preparation, and progress tracking.",
      },
      { role: "user" as const, content: "What technologies did he use in it?" },
    ];
    const s4 = await callChat(followUpHistory);
    console.log("Follow-up Response:\n" + s4.text);

    const s4Passed =
      s4.status === 200 &&
      s4.text.includes("JavaMentor") &&
      (s4.text.includes("Firebase") || s4.text.includes("React")) &&
      s4.text.includes("[[NAV_ACTION]]");

    console.log("Scenario 4 Check (Resolves 'it' to JavaMentor and returns tech stack):", s4Passed ? "PASSED" : "FAILED");
    if (!s4Passed) allPassed = false;
    console.log("\n--------------------------------------------------------------------------------\n");

  } finally {
    // Restore normal operation
    setSimulateFailure(false);
    console.log("Restored normal environment configuration (LOKI_SIMULATE_TOTAL_FAILURE removed).");
  }

  console.log("================================================================================");
  console.log(`Final Result: ${allPassed ? "ALL 4 SCENARIOS PASSED SUCCESSFULLY" : "VALIDATION FAILED"}`);
  console.log("================================================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
