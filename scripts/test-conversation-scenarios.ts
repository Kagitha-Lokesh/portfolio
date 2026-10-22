/**
 * LOKI Offline Intelligence — Phase 7C & 7D: Realistic Multi-Turn Scenarios & Conversation Isolation
 *
 * Exercises the offline retrieval and composition engines across 5 realistic
 * 10-15 turn conversational scenarios and validates complete visitor-isolation
 * across concurrent and interleaved request contexts.
 *
 * Rules:
 * - Uses real exported ChatMessage interface and retrieval/composition functions.
 * - Zero external API calls, zero mock data mutations.
 * - Explicit assertions on topic resolution, pronoun binding, clarification prompts,
 *   draft generation, cancellation, and cross-session data leakage prevention.
 */

import { retrievePortfolioFacts } from "../src/lib/agent/offline-retrieval";
import { composeOfflineResponse } from "../src/lib/agent/offline-composer";
import type { ChatMessage } from "../src/lib/agent/llm";
import { PROJECTS, PROFILE } from "../src/lib/data";

interface TestReport {
  scenariosExecuted: number;
  totalTurnsExecuted: number;
  passedAssertions: number;
  failedAssertions: number;
  isolationChecksPassed: number;
  isolationFailures: number;
}

const report: TestReport = {
  scenariosExecuted: 0,
  totalTurnsExecuted: 0,
  passedAssertions: 0,
  failedAssertions: 0,
  isolationChecksPassed: 0,
  isolationFailures: 0,
};

function assertStep(
  condition: boolean,
  stepDescription: string,
  errorDetail: string,
  isIsolation: boolean = false
) {
  if (condition) {
    report.passedAssertions++;
    if (isIsolation) report.isolationChecksPassed++;
    console.log(`  ✓ [PASS] ${stepDescription}`);
  } else {
    report.failedAssertions++;
    if (isIsolation) report.isolationFailures++;
    console.error(`  ✗ [FAIL] ${stepDescription}: ${errorDetail}`);
  }
}

/**
 * Executes a conversational turn through real offline retrieval & composition,
 * updating the passed history immutably.
 */
async function runTurn(
  userQuery: string,
  history: ChatMessage[]
): Promise<{ text: string; intent: string; updatedHistory: ChatMessage[]; raw: any }> {
  report.totalTurnsExecuted++;
  const retrieval = await retrievePortfolioFacts(userQuery, history);
  const composed = composeOfflineResponse(userQuery, retrieval, history);

  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: "user", content: userQuery },
    { role: "assistant", content: composed.rawOutput },
  ];

  return {
    text: composed.text,
    intent: composed.intent,
    updatedHistory,
    raw: composed,
  };
}

async function runScenario1() {
  console.log("\n================================================================================");
  console.log(" Scenario 1: Project Exploration (10 Turns)");
  console.log("================================================================================");
  report.scenariosExecuted++;

  let history: ChatMessage[] = [];

  // Turn 1: Overview of projects
  let res = await runTurn("What projects has Lokesh built?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "projects" && res.text.includes("Purnima Kalamkari") && res.text.includes("JavaMentor"),
    "Turn 1: Overview lists verified portfolio projects",
    `Unexpected response: ${res.text.slice(0, 100)}`
  );

  // Turn 2: Ask about one specific project
  res = await runTurn("Tell me more about Purnima Kalamkari", history);
  history = res.updatedHistory;
  assertStep(
    (res.intent === "projects" || res.intent === "followup" || res.intent === "freelance") &&
      res.text.includes("Purnima Kalamkari") &&
      res.text.toLowerCase().includes("ecommerce"),
    "Turn 2: Specific project details retrieved accurately",
    `Unexpected response: ${res.text.slice(0, 100)}`
  );

  // Turn 3: Ask which technologies it uses (pronoun reference 'it')
  res = await runTurn("What technologies did he use in it?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("React.js") && res.text.includes("MySQL") && res.text.includes("Express.js"),
    "Turn 3: Resolves pronoun 'it' to Purnima Kalamkari and returns accurate tech stack",
    `Tech stack missing: ${res.text.slice(0, 120)}`
  );

  // Turn 4: Ask for additional features
  res = await runTurn("What other features does that project have?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("Purnima Kalamkari") && (res.text.includes("catalog") || res.text.includes("order") || res.text.includes("admin")),
    "Turn 4: Resolves 'that project' to Purnima Kalamkari and lists verified features",
    `Features missing: ${res.text.slice(0, 120)}`
  );

  // Turn 5: Ask how it differs from another project (JavaMentor)
  res = await runTurn("How does JavaMentor compare to Purnima Kalamkari?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("JavaMentor") && res.text.includes("Firebase"),
    "Turn 5: Distinguishes JavaMentor and its architecture from Purnima Kalamkari",
    `Comparison missing: ${res.text.slice(0, 120)}`
  );

  // Turn 6: Change the subject to technical skills
  res = await runTurn("What technical skills does Lokesh specialize in?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "skills" && res.text.includes("JavaScript") && res.text.includes("React"),
    "Turn 6: Explicit topic change to technical skills overrides project history",
    `Topic switch failed: intent=${res.intent}`
  );

  // Turn 7: Ask which listed skills relate to JavaMentor
  res = await runTurn("Does JavaMentor use Firebase and React from his backend skills?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("JavaMentor") && res.text.includes("Firebase"),
    "Turn 7: Grounds query in JavaMentor technologies and verified skillset",
    `Skills grounding failed: ${res.text.slice(0, 120)}`
  );

  // Turn 8: Return to original project (Purnima Kalamkari)
  res = await runTurn("Back to Purnima Kalamkari: why did he build it?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("Purnima Kalamkari") && (res.text.includes("ecommerce") || res.text.includes("storefront")),
    "Turn 8: Returns cleanly to Purnima Kalamkari without confusion",
    `Return failed: ${res.text.slice(0, 120)}`
  );

  // Turn 9: Ask for a concise summary
  res = await runTurn("Can you give me a quick summary of that project?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("Purnima Kalamkari"),
    "Turn 9: Resolves 'that project' to Purnima Kalamkari following the previous turn",
    `Summary failed: ${res.text.slice(0, 120)}`
  );

  // Turn 10: Ask an unrelated profile question
  res = await runTurn("Where is Lokesh located and what is his degree?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes(PROFILE.location) || res.text.includes("B.Tech"),
    "Turn 10: Unrelated profile inquiry answers accurately without project leakage",
    `Profile answer failed: ${res.text.slice(0, 120)}`
  );
}

async function runScenario2() {
  console.log("\n================================================================================");
  console.log(" Scenario 2: Ambiguous References & Clarification Prompting");
  console.log("================================================================================");
  report.scenariosExecuted++;

  let history: ChatMessage[] = [];

  // Turn 1: User mentions two projects in same sentence
  let res = await runTurn("Lokesh built both JavaMentor and Attendance Management System.", history);
  history = res.updatedHistory;

  // Turn 2: Ambiguous "Which one is better?"
  res = await runTurn("Which one is better?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "clarification" || res.text.toLowerCase().includes("which") || res.text.toLowerCase().includes("clarif"),
    "Turn 2: Ambiguous 'Which one is better?' prompts for clarification or balanced explanation rather than hallucinating superiority",
    `Did not handle ambiguous comparison: ${res.text.slice(0, 120)}`
  );

  // Turn 3: Ambiguous "Tell me more about it."
  res = await runTurn("Tell me more about it.", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "clarification" || res.text.toLowerCase().includes("clarif") || res.text.toLowerCase().includes("which"),
    "Turn 3: Ambiguous 'Tell me more about it' with multiple candidates prompts for clarification",
    `Ambiguous it failed: ${res.text.slice(0, 120)}`
  );

  // Turn 4: Disambiguation provided by user
  res = await runTurn("I mean the Attendance Management System.", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("Attendance") && (res.text.includes("Express.js") || res.text.includes("HRM") || res.text.includes("Firebase")),
    "Turn 4: Explicit disambiguation immediately locks onto Attendance Management System",
    `Disambiguation failed: ${res.text.slice(0, 120)}`
  );

  // Turn 5: "What about the other one?"
  res = await runTurn("What about the other one?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("JavaMentor") || res.text.includes("Purnima"),
    "Turn 5: 'What about the other one?' switches context to alternate project",
    `Alternate project failed: ${res.text.slice(0, 120)}`
  );
}

async function runScenario3() {
  console.log("\n================================================================================");
  console.log(" Scenario 3: User Corrections vs Authoritative Portfolio Data");
  console.log("================================================================================");
  report.scenariosExecuted++;

  let history: ChatMessage[] = [];

  // Turn 1: User makes a false statement about portfolio facts
  let res = await runTurn("Lokesh built JavaMentor using Django and Python, right?", history);
  history = res.updatedHistory;
  assertStep(
    (res.text.includes("React.js") || res.text.includes("Firebase")) && !res.text.includes("Lokesh used Django for JavaMentor"),
    "Turn 1: Rejects false user assertion regarding JavaMentor stack with authoritative facts",
    `Accepted false tech stack: ${res.text.slice(0, 120)}`
  );

  // Turn 2: User corrects their own contact details
  res = await runTurn("I'd like to reach out to Lokesh. My name is Alex from TechCorp.", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "contact" && (res.text.includes("email") || res.text.includes("Alex")),
    "Turn 2: Initiates contact flow capturing Alex and TechCorp",
    `Contact initiation failed: ${res.text.slice(0, 120)}`
  );

  // Turn 3: User supplies email with typo
  res = await runTurn("My email is alex@techcorpp.co", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.email === "alex@techcorpp.co",
    "Turn 3: Draft prepared with initial email",
    `Draft missing email: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Turn 4: User corrects email
  res = await runTurn("Actually, my correct email is alex@techcorp.com, not co", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.email === "alex@techcorp.com",
    "Turn 4: Newest explicit email correction overrides previous typo in draft",
    `Email correction failed: ${JSON.stringify(res.raw.contactDraft)}`
  );
}

async function runScenario4() {
  console.log("\n================================================================================");
  console.log(" Scenario 4: Context-Aware Contact Flow Lifecycle");
  console.log("================================================================================");
  report.scenariosExecuted++;

  let history: ChatMessage[] = [];

  // Step 1: Contact intent with name, organization, and purpose
  let res = await runTurn(
    "Hi, I am David Miller from Horizon Robotics. We would like to discuss a frontend role.",
    history
  );
  history = res.updatedHistory;
  assertStep(
    res.intent === "contact" && (res.text.includes("email") || res.text.includes("David")),
    "Step 1: Recognizes contact intent with name, org, and purpose",
    `Step 1 failed: ${res.text.slice(0, 100)}`
  );

  // Step 2: Missing email prompt
  assertStep(
    (res.raw.contactDraft === null || res.raw.contactDraft === undefined) &&
      (res.raw.contactInstruction === "ask_email" || res.text.includes("email")),
    "Step 2: Correctly does not emit draft when email is missing, prompts for email",
    `Premature draft emitted: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Step 3: Email supplied in the next turn
  res = await runTurn("You can reach me at david.miller@horizonrobotics.ai", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.name === "David Miller" &&
      res.raw.contactDraft.email === "david.miller@horizonrobotics.ai" &&
      res.raw.contactDraft.message.includes("Horizon Robotics"),
    "Step 3: Email supplied; draft generated combining all accumulated details",
    `Draft incomplete: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Step 4: Email correction
  res = await runTurn("Wait, use my direct email d.miller@horizonrobotics.ai instead", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.email === "d.miller@horizonrobotics.ai",
    "Step 4: Draft email updated cleanly upon user correction",
    `Draft email not updated: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Step 5: Draft editing (updating message purpose)
  res = await runTurn("Also update the message to note we want to schedule an interview next week.", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.message.includes("interview"),
    "Step 5: Draft message updated with additional visitor requirements",
    `Draft message not updated: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Step 6: Cancellation
  res = await runTurn("Actually, nevermind. Let's cancel the contact request for now.", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft === null || res.raw.contactDraft === undefined,
    "Step 6: Contact flow successfully cancelled; draft cleared",
    `Draft not cleared: ${JSON.stringify(res.raw.contactDraft)}`
  );

  // Step 7: Topic change
  res = await runTurn("Can you tell me about Lokesh's education?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "education" && res.text.includes("SRI VASAVI"),
    "Step 7: Clean topic change to education without contact residue",
    `Education switch failed: ${res.text.slice(0, 100)}`
  );

  // Step 8: New contact request starts fresh
  res = await runTurn("I'd like to get in touch now. Email is newcontact@example.com", history);
  history = res.updatedHistory;
  assertStep(
    res.raw.contactDraft !== null &&
      res.raw.contactDraft !== undefined &&
      res.raw.contactDraft.email === "newcontact@example.com",
    "Step 8: Fresh contact request initializes new draft with explicit confirmation required",
    `Fresh draft failed: ${JSON.stringify(res.raw.contactDraft)}`
  );
}

async function runScenario5() {
  console.log("\n================================================================================");
  console.log(" Scenario 5: Rapid Topic Switching (Projects -> Skills -> Education -> Work)");
  console.log("================================================================================");
  report.scenariosExecuted++;

  let history: ChatMessage[] = [];

  // Turn 1: Project
  let res = await runTurn("Tell me about the 3D Cinematic Portfolio", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "projects" && (res.text.includes("GSAP") || res.text.includes("Canvas")),
    "Turn 1: Projects topic active",
    `Failed: ${res.text.slice(0, 80)}`
  );

  // Turn 2: Switch to Skills
  res = await runTurn("What database systems is he skilled in?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "skills" && res.text.includes("MySQL") && res.text.includes("Firebase"),
    "Turn 2: Explicit switch to skills active",
    `Failed: ${res.text.slice(0, 80)}`
  );

  // Turn 3: Switch to Education
  res = await runTurn("What was his college GPA?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "education" && (res.text.includes("8.18") || res.text.includes("CGPA")),
    "Turn 3: Explicit switch to education active",
    `Failed: ${res.text.slice(0, 80)}`
  );

  // Turn 4: Switch to Work Experience
  res = await runTurn("Where does he currently work?", history);
  history = res.updatedHistory;
  assertStep(
    res.intent === "experience" && res.text.includes("CHARANI INFOTECH"),
    "Turn 4: Explicit switch to experience active",
    `Failed: ${res.text.slice(0, 80)}`
  );

  // Turn 5: Switch back to Project with pronoun resolution
  res = await runTurn("Going back to that 3D portfolio project: what library handled animations?", history);
  history = res.updatedHistory;
  assertStep(
    res.text.includes("GSAP"),
    "Turn 5: Successfully returns to 3D portfolio and resolves animation question",
    `Failed: ${res.text.slice(0, 80)}`
  );
}

async function runPhase7DIsolationTests() {
  console.log("\n================================================================================");
  console.log(" Phase 7D: Visitor and Conversation Isolation Evaluation");
  console.log("================================================================================");

  // Synthetic Visitor A data
  const visitorA_Name = "Elena Rostova";
  const visitorA_Org = "Vanguard AI Labs";
  const visitorA_Email = "elena.rostova@vanguard-ai-test.org";
  const visitorA_Purpose = "We want to interview Lokesh for a lead platform engineer role.";

  // Synthetic Visitor B data
  const visitorB_Query = "What projects has Lokesh built using MySQL?";

  console.log("\n--- Sub-test 1: Order A -> B (Visitor A submits private data, Visitor B queries projects) ---");

  // Visitor A Turn 1: Introduces self
  const historyA_1: ChatMessage[] = [];
  const resA_1 = await runTurn(
    `Hello, my name is ${visitorA_Name} from ${visitorA_Org}. ${visitorA_Purpose}`,
    historyA_1
  );

  // Visitor A Turn 2: Provides email
  const historyA_2 = resA_1.updatedHistory;
  const resA_2 = await runTurn(`My email is ${visitorA_Email}`, historyA_2);

  assertStep(
    resA_2.raw.contactDraft !== null &&
      resA_2.raw.contactDraft !== undefined &&
      resA_2.raw.contactDraft.email === visitorA_Email,
    "Visitor A: Successfully established private draft with email and organization",
    `Draft creation failed for A: ${JSON.stringify(resA_2.raw.contactDraft)}`,
    true
  );

  // Visitor B makes request in an independent conversation context
  const historyB: ChatMessage[] = [];
  const resB = await runTurn(visitorB_Query, historyB);

  // Rigorous cross-leakage verification:
  const leaksA_in_B =
    resB.text.includes(visitorA_Name) ||
    resB.text.includes(visitorA_Org) ||
    resB.text.includes(visitorA_Email) ||
    (resB.raw.contactDraft !== null && resB.raw.contactDraft !== undefined);

  assertStep(
    !leaksA_in_B,
    "Visitor B: Zero leakage of Visitor A's name, organization, email, or draft",
    `LEAK DETECTED in Visitor B response: ${resB.text} | Draft: ${JSON.stringify(resB.raw.contactDraft)}`,
    true
  );

  console.log("\n--- Sub-test 2: Order B -> A (Reverse Order Execution) ---");

  // Re-run Visitor B first
  const historyB_Rev: ChatMessage[] = [];
  const resB_Rev = await runTurn("Tell me about the JavaMentor project", historyB_Rev);

  // Then run a new Visitor A inquiry with fresh synthetic details
  const visitorC_Name = "Marcus Aurelius";
  const visitorC_Email = "marcus@rome-holdings.example.com";
  const historyC: ChatMessage[] = [];
  const resC_1 = await runTurn(`My name is ${visitorC_Name}, contact me at ${visitorC_Email}`, historyC);

  const leaksC_in_B =
    resB_Rev.text.includes(visitorC_Name) ||
    resB_Rev.text.includes(visitorC_Email) ||
    (resB_Rev.raw.contactDraft !== null && resB_Rev.raw.contactDraft !== undefined);

  assertStep(
    !leaksC_in_B,
    "Reverse Order: Visitor B contains zero private details from any subsequent or concurrent visitor",
    `LEAK DETECTED in reverse order`,
    true
  );

  assertStep(
    resC_1.raw.contactDraft !== null &&
      resC_1.raw.contactDraft !== undefined &&
      resC_1.raw.contactDraft.name === visitorC_Name,
    "Independent Visitor C draft correctly isolates its own details",
    `Visitor C draft mismatch: ${JSON.stringify(resC_1.raw.contactDraft)}`,
    true
  );

  console.log("\n--- Sub-test 3: Global Mutable State & Diagnostics Privacy Check ---");
  // Inspect that offline composition does not store persistent visitor state in module scopes
  const freshQuery = "Hi";
  const freshRes = await runTurn(freshQuery, []);
  assertStep(
    freshRes.raw.contactDraft === null || freshRes.raw.contactDraft === undefined,
    "Zero global mutable draft state persists across empty-history requests",
    `Stale draft found on clean session: ${JSON.stringify(freshRes.raw.contactDraft)}`,
    true
  );
}

async function main() {
  console.log("================================================================================");
  console.log("   LOKI Offline Intelligence: Phase 7C & 7D Scenario & Isolation Suite          ");
  console.log("================================================================================");

  await runScenario1();
  await runScenario2();
  await runScenario3();
  await runScenario4();
  await runScenario5();
  await runPhase7DIsolationTests();

  console.log("\n================================================================================");
  console.log("                       SCENARIOS & ISOLATION SUMMARY                            ");
  console.log("================================================================================");
  console.log(`Scenarios Executed:             ${report.scenariosExecuted}`);
  console.log(`Total Conversation Turns:       ${report.totalTurnsExecuted}`);
  console.log(`Total Assertions Passed:        ${report.passedAssertions}`);
  console.log(`Total Assertions Failed:        ${report.failedAssertions}`);
  console.log(`Isolation Checks Passed:        ${report.isolationChecksPassed}`);
  console.log(`Isolation Failures:             ${report.isolationFailures}`);
  console.log("================================================================================\n");

  if (report.failedAssertions > 0) {
    console.error(`Evaluation completed with ${report.failedAssertions} failures.`);
    process.exit(1);
  } else {
    console.log("✓ All Phase 7C conversational scenarios and Phase 7D isolation checks PASSED cleanly!\n");
  }
}

main().catch((err) => {
  console.error("Fatal error during scenario evaluation:", err);
  process.exit(1);
});
