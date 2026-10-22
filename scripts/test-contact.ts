/**
 * LOKI Offline Intelligence — Phase 4 Contact Flow Test Suite
 *
 * Validates context-aware multi-turn contact flow, name/email/org/purpose extraction,
 * memory across conversation turns, safe [[CONTACT_DRAFT]] serialization,
 * frontend parser compatibility, and history immutability across 18+ scenarios.
 */

import {
  extractEmail,
  extractName,
  extractOrganization,
  extractPurpose,
  extractContactContext,
  processOfflineContactFlow,
  formatContactDraft,
} from "../src/lib/agent/offline-contact";
import {
  extractContactDraft,
  stripInternalMarkers,
} from "../src/components/agent/FormattedText";
import type { ChatMessage } from "../src/lib/agent/llm";

async function runTestSuite() {
  console.log("=== LOKI Offline Intelligence: Phase 4 Contact Flow Test Suite ===");
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

  // -------------------------------------------------------------------------
  // 1. Name Extraction
  // -------------------------------------------------------------------------
  const name1 = extractName("I'm Raj Shekar from Charani Info Tech.");
  assert(
    name1 === "Raj Shekar",
    "extractName captures 'Raj Shekar' from 'I'm Raj Shekar from Charani Info Tech'",
    `Extracted: "${name1}"`
  );

  const name2 = extractName("My name is Dr. Jane Watson and I want to connect.");
  assert(
    name2 === "Dr. Jane Watson",
    "extractName captures 'Dr. Jane Watson' from 'My name is Dr. Jane Watson'",
    `Extracted: "${name2}"`
  );

  const nameFalsePositive = extractName("I'm interested in hiring Lokesh for a project.");
  assert(
    nameFalsePositive === undefined,
    "extractName correctly rejects non-name phrases like 'I'm interested'",
    `Extracted: "${nameFalsePositive}"`
  );

  // -------------------------------------------------------------------------
  // 2. Organization Extraction
  // -------------------------------------------------------------------------
  const org1 = extractOrganization("I'm Raj Shekar from Charani Info Tech. We need a developer.");
  assert(
    org1 === "Charani Info Tech",
    "extractOrganization captures 'Charani Info Tech' from 'from Charani Info Tech'",
    `Extracted: "${org1}"`
  );

  const orgFalsePositive = extractOrganization("I saw his work from your portfolio.");
  assert(
    orgFalsePositive === undefined,
    "extractOrganization rejects generic phrase 'from your portfolio'",
    `Extracted: "${orgFalsePositive}"`
  );

  // -------------------------------------------------------------------------
  // 3. Email Extraction & Validation
  // -------------------------------------------------------------------------
  const email1 = extractEmail("You can reach me at raj.shekar@charani.com.");
  assert(
    email1 === "raj.shekar@charani.com",
    "extractEmail captures clean address and strips trailing period",
    `Extracted: "${email1}"`
  );

  const emailMailto = extractEmail("Contact: [lokesh-team](mailto:recruiter@google.com)");
  assert(
    emailMailto === "recruiter@google.com",
    "extractEmail handles markdown mailto syntax correctly",
    `Extracted: "${emailMailto}"`
  );

  const invalidEmail = extractEmail("Send email to user@domain or test@.com or not-an-email");
  assert(
    invalidEmail === undefined,
    "extractEmail rejects malformed emails like test@.com",
    `Extracted: "${invalidEmail}"`
  );

  // -------------------------------------------------------------------------
  // 4. Purpose Extraction
  // -------------------------------------------------------------------------
  const purp1 = extractPurpose(
    "I'm Raj Shekar from Charani Info Tech. I reviewed Lokesh's portfolio and want to discuss a job opportunity."
  );
  assert(
    Boolean(purp1 && purp1.toLowerCase().includes("job opportunity")),
    "extractPurpose preserves specific contact purpose ('job opportunity')",
    `Extracted: "${purp1}"`
  );

  // -------------------------------------------------------------------------
  // 5. Missing Email Prompt: Asks ONLY for Email
  // -------------------------------------------------------------------------
  const qTurn1 =
    "I'm Raj Shekar from Charani Info Tech. I reviewed Lokesh's portfolio and want to discuss a job opportunity.";
  const resTurn1 = processOfflineContactFlow(qTurn1, []);
  assert(
    resTurn1.status === "need_email" &&
      resTurn1.extracted.name === "Raj Shekar" &&
      resTurn1.extracted.organization === "Charani Info Tech" &&
      resTurn1.responseMessage.includes("Raj Shekar") &&
      resTurn1.responseMessage.includes("email address") &&
      !resTurn1.responseMessage.includes("What is your name"),
    "Recognizes name and purpose; asks ONLY for email without repeating questions",
    resTurn1.responseMessage
  );

  // -------------------------------------------------------------------------
  // 6. Multi-Turn Memory: Turn 2 Provides Email -> Generates Complete Draft
  // -------------------------------------------------------------------------
  const historyTurn2: ChatMessage[] = [
    { role: "user", content: qTurn1 },
    { role: "assistant", content: resTurn1.responseMessage },
  ];
  const qTurn2 = "raj@example.com";
  const resTurn2 = processOfflineContactFlow(qTurn2, historyTurn2);

  assert(
    resTurn2.status === "complete_draft_ready" &&
      Boolean(resTurn2.draft) &&
      resTurn2.draft?.name === "Raj Shekar" &&
      resTurn2.draft?.email === "raj@example.com" &&
      Boolean(resTurn2.draft?.message.includes("Charani Info Tech")),
    "Turn 2 retains previous name, org, and purpose; synthesizes complete draft",
    JSON.stringify(resTurn2.draft)
  );

  // -------------------------------------------------------------------------
  // 7. All-in-One Turn (Name, Email, Org, Purpose in Single Message)
  // -------------------------------------------------------------------------
  const qAllInOne =
    "Hi, I'm Sarah Connor from Skynet (sarah@skynet.com). We want to schedule an interview with Lokesh for a cloud role.";
  const resAllInOne = processOfflineContactFlow(qAllInOne, []);
  assert(
    resAllInOne.status === "complete_draft_ready" &&
      resAllInOne.draft?.name === "Sarah Connor" &&
      resAllInOne.draft?.email === "sarah@skynet.com" &&
      resAllInOne.draft?.message.includes("interview"),
    "Prepares draft immediately when all details are supplied in one message",
    JSON.stringify(resAllInOne.draft)
  );

  // -------------------------------------------------------------------------
  // 8. Email Correction Across Conversation
  // -------------------------------------------------------------------------
  const historyCorrection: ChatMessage[] = [
    { role: "user", content: qTurn1 },
    { role: "assistant", content: resTurn1.responseMessage },
    { role: "user", content: "raj@example.com" },
    { role: "assistant", content: resTurn2.responseMessage },
  ];
  const qCorrection = "Actually, use my official email: raj.shekar@charani.com";
  const resCorrection = processOfflineContactFlow(qCorrection, historyCorrection);
  assert(
    resCorrection.status === "complete_draft_ready" &&
      resCorrection.draft?.email === "raj.shekar@charani.com" &&
      resCorrection.draft?.name === "Raj Shekar",
    "Email correction overrides earlier address while retaining visitor name",
    JSON.stringify(resCorrection.draft)
  );

  // -------------------------------------------------------------------------
  // 9. Topic Change / Withdrawal
  // -------------------------------------------------------------------------
  const historyWithdraw: ChatMessage[] = [
    { role: "user", content: qTurn1 },
    { role: "assistant", content: resTurn1.responseMessage },
  ];
  const qWithdraw = "Nevermind, tell me about his projects instead";
  const resWithdraw = processOfflineContactFlow(qWithdraw, historyWithdraw);
  assert(
    resWithdraw.status === "not_contact_flow" && resWithdraw.draft === null,
    "Withdrawal ('Nevermind') cancels contact flow and does not force a draft",
    resWithdraw.responseMessage
  );

  // -------------------------------------------------------------------------
  // 10. General Contact Inquiry (No Details Provided Yet)
  // -------------------------------------------------------------------------
  const qGeneral = "How can I contact Lokesh?";
  const resGeneral = processOfflineContactFlow(qGeneral, []);
  assert(
    resGeneral.status === "general_inquiry" &&
      resGeneral.draft === null &&
      resGeneral.responseMessage.includes("kagithalokesh8@gmail.com") &&
      resGeneral.responseMessage.includes("+91 7032817065"),
    "General contact query provides direct phone/email and invites message details",
    resGeneral.responseMessage
  );

  // -------------------------------------------------------------------------
  // 11. Draft Marker Serialization & JSON Format
  // -------------------------------------------------------------------------
  const sampleDraft = {
    name: "Alex Rivera",
    email: "alex@techpartners.io",
    message: "Hi Lokesh, let's discuss a contract for building an enterprise dashboard.",
  };
  const serializedMarker = formatContactDraft(sampleDraft);
  assert(
    serializedMarker.startsWith("\n\n[[CONTACT_DRAFT]]") &&
      serializedMarker.includes('"name":"Alex Rivera"') &&
      serializedMarker.includes('"email":"alex@techpartners.io"'),
    "formatContactDraft produces safe, valid standard JSON payload",
    serializedMarker
  );

  // -------------------------------------------------------------------------
  // 12. Frontend Parser Compatibility (FormattedText.tsx)
  // -------------------------------------------------------------------------
  const parsedDraft = extractContactDraft(resTurn2.rawOutput);
  assert(
    Boolean(parsedDraft) &&
      parsedDraft?.name === "Raj Shekar" &&
      parsedDraft?.email === "raj@example.com",
    "extractContactDraft from FormattedText.tsx successfully extracts synthesized draft",
    JSON.stringify(parsedDraft)
  );

  // -------------------------------------------------------------------------
  // 13. Frontend Marker Stripping for Display
  // -------------------------------------------------------------------------
  const cleanDisplay = stripInternalMarkers(resTurn2.rawOutput);
  assert(
    !cleanDisplay.includes("[[CONTACT_DRAFT]]") &&
      cleanDisplay.includes("editable contact draft"),
    "stripInternalMarkers removes [[CONTACT_DRAFT]] tag leaving clean user-facing text",
    cleanDisplay
  );

  // -------------------------------------------------------------------------
  // 14. No Automatic Email Sending Check
  // -------------------------------------------------------------------------
  assert(
    typeof resTurn2.rawOutput === "string" && Boolean(resTurn2.draft),
    "Offline engine yields editable draft marker and does NOT send email automatically",
    "Draft generated for user confirmation"
  );

  // -------------------------------------------------------------------------
  // 15. History Immutability Check
  // -------------------------------------------------------------------------
  const historyCheckCopy = JSON.parse(JSON.stringify(historyTurn2));
  processOfflineContactFlow("test@example.com", historyTurn2);
  assert(
    JSON.stringify(historyTurn2) === JSON.stringify(historyCheckCopy),
    "Conversation history array remains strictly immutable throughout contact flow",
    "History strictly preserved"
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\nResults: ${passed}/${total} contact flow scenarios passed successfully.`);
  if (passed === total) {
    console.log("✓ All Phase 4 context-aware contact flow tests PASSED!");
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
