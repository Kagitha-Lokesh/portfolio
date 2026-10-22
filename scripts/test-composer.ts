/**
 * LOKI Offline Intelligence — Phase 3 Response Composer Test Suite
 *
 * Validates natural language composition, domain-specific formatting,
 * [[NAV_ACTION]] protocol compliance, comparison handling, honest boundaries,
 * and zero hallucination across 19+ test scenarios.
 */

import { retrievePortfolioFacts } from "../src/lib/agent/offline-retrieval";
import { composeOfflineResponse } from "../src/lib/agent/offline-composer";
import { extractNavAction, stripInternalMarkers } from "../src/components/agent/FormattedText";
import type { ChatMessage } from "../src/lib/agent/llm";

async function runTestSuite() {
  console.log("=== LOKI Offline Intelligence: Phase 3 Composer Test Suite ===");
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
  // 1. Project List Question
  // -------------------------------------------------------------------------
  const q1 = "What projects has Lokesh built?";
  const ret1 = await retrievePortfolioFacts(q1);
  const comp1 = composeOfflineResponse(q1, ret1);
  assert(
    comp1.text.includes("Purnima Kalamkari") &&
      comp1.text.includes("JavaMentor") &&
      comp1.text.includes("Employee Attendance Management"),
    "Project list response outlines all 3 verified portfolio projects",
    comp1.text
  );

  // -------------------------------------------------------------------------
  // 2. Named Project Question (JavaMentor)
  // -------------------------------------------------------------------------
  const q2 = "Tell me about JavaMentor";
  const ret2 = await retrievePortfolioFacts(q2);
  const comp2 = composeOfflineResponse(q2, ret2);
  assert(
    comp2.text.includes("JavaMentor") &&
      comp2.text.includes("Tech Stack") &&
      comp2.text.includes("Firebase") &&
      comp2.text.includes("Key Highlights"),
    "Named project response includes title, tech stack, and key highlights",
    comp2.text
  );

  // -------------------------------------------------------------------------
  // 3. Technology Stack Question
  // -------------------------------------------------------------------------
  const q3 = "What technologies does Lokesh work with?";
  const ret3 = await retrievePortfolioFacts(q3);
  const comp3 = composeOfflineResponse(q3, ret3);
  assert(
    comp3.text.includes("JavaScript") &&
      comp3.text.includes("React.js") &&
      comp3.text.includes("Node.js") &&
      comp3.text.includes("MySQL"),
    "Technology stack response organizes skills by technical categories",
    comp3.text
  );

  // -------------------------------------------------------------------------
  // 4. Experience Question
  // -------------------------------------------------------------------------
  const q4 = "What is Lokesh's work experience?";
  const ret4 = await retrievePortfolioFacts(q4);
  const comp4 = composeOfflineResponse(q4, ret4);
  assert(
    comp4.text.includes("CHARANI INFOTECH PVT LTD") &&
      comp4.text.includes("Associate Software Engineer") &&
      comp4.text.includes("HRM"),
    "Experience response details role, company, and HRM engineering achievements",
    comp4.text
  );

  // -------------------------------------------------------------------------
  // 5. Education Question
  // -------------------------------------------------------------------------
  const q5 = "Where did he complete his degree?";
  const ret5 = await retrievePortfolioFacts(q5);
  const comp5 = composeOfflineResponse(q5, ret5);
  assert(
    comp5.text.includes("SRI VASAVI INSTITUTE OF ENGINEERING & TECHNOLOGY") &&
      comp5.text.includes("B.Tech in CSE") &&
      comp5.text.includes("8.0"),
    "Education response specifies institution, degree, and 8.0 CGPA",
    comp5.text
  );

  // -------------------------------------------------------------------------
  // 6. Certification Question
  // -------------------------------------------------------------------------
  const q6 = "What certifications does he hold?";
  const ret6 = await retrievePortfolioFacts(q6);
  const comp6 = composeOfflineResponse(q6, ret6);
  assert(
    comp6.text.includes("BISTS Technologies") &&
      comp6.text.includes("Java Full Stack Development Certification"),
    "Certification response returns verified industry credentials",
    comp6.text
  );

  // -------------------------------------------------------------------------
  // 7. Freelance Case Study Question
  // -------------------------------------------------------------------------
  const q7 = "Tell me about his freelance work for Purnima Kalamkari";
  const ret7 = await retrievePortfolioFacts(q7);
  const comp7 = composeOfflineResponse(q7, ret7);
  assert(
    comp7.text.includes("Purnima Kalamkari") &&
      comp7.text.includes("WhatsApp") &&
      comp7.text.includes("JWT-secured"),
    "Freelance case study response details storefront and admin architecture",
    comp7.text
  );

  // -------------------------------------------------------------------------
  // 8. Achievements Question
  // -------------------------------------------------------------------------
  const q8 = "What are Lokesh's achievements and metrics?";
  const ret8 = await retrievePortfolioFacts(q8);
  const comp8 = composeOfflineResponse(q8, ret8);
  assert(
    comp8.text.includes("8.0 CGPA") &&
      comp8.text.includes("3 Built") &&
      comp8.text.includes("CLASS OF 2026"),
    "Achievements response accurately renders key verified metric items",
    comp8.text
  );

  // -------------------------------------------------------------------------
  // 9. Comparison Between Two Records
  // -------------------------------------------------------------------------
  const q9 = "Compare JavaMentor and Purnima Kalamkari";
  const ret9 = await retrievePortfolioFacts(q9);
  const comp9 = composeOfflineResponse(q9, ret9);
  assert(
    comp9.text.includes("Comparing") &&
      comp9.text.includes("JavaMentor") &&
      comp9.text.includes("Purnima Kalamkari"),
    "Comparison query formats a side-by-side contrast of the two projects",
    comp9.text
  );

  // -------------------------------------------------------------------------
  // 10. Contextual Follow-up
  // -------------------------------------------------------------------------
  const history10: ChatMessage[] = [
    { role: "user", content: "Tell me about JavaMentor" },
    {
      role: "assistant",
      content: "JavaMentor is a learning platform for Java full stack development.",
    },
  ];
  const q10 = "What features does it have?";
  const ret10 = await retrievePortfolioFacts(q10, history10);
  const comp10 = composeOfflineResponse(q10, ret10, history10);
  assert(
    comp10.intent === "followup" &&
      comp10.text.includes("JavaMentor") &&
      comp10.text.includes("Key Highlights"),
    "Contextual follow-up reuses resolved subject (JavaMentor) without generic preamble",
    comp10.text
  );

  // -------------------------------------------------------------------------
  // 11. Ambiguous Request Requiring Clarification
  // -------------------------------------------------------------------------
  const q11 = "Tell me more about it";
  const ret11 = await retrievePortfolioFacts(q11, []);
  const comp11 = composeOfflineResponse(q11, ret11);
  assert(
    comp11.intent === "clarification" &&
      Boolean(comp11.clarificationRequest) &&
      comp11.text.includes("clarify"),
    "Ambiguous query produces clear clarification request with suggestions",
    comp11.text
  );

  // -------------------------------------------------------------------------
  // 12. Unsupported Salary Question
  // -------------------------------------------------------------------------
  const q12 = "What is Lokesh's salary expectation?";
  const ret12 = await retrievePortfolioFacts(q12);
  const comp12 = composeOfflineResponse(q12, ret12);
  assert(
    comp12.intent === "unsupported" &&
      comp12.text.includes("salary expectations") &&
      !comp12.text.includes("$") &&
      !comp12.text.includes("₹"),
    "Salary query transparently states boundary and avoids fabricating numbers",
    comp12.text
  );

  // -------------------------------------------------------------------------
  // 13. Unlisted Technology Question (Rust)
  // -------------------------------------------------------------------------
  const q13 = "Does Lokesh have experience with Rust?";
  const ret13 = await retrievePortfolioFacts(q13);
  const comp13 = composeOfflineResponse(q13, ret13);
  assert(
    comp13.intent === "unsupported" &&
      comp13.text.toLowerCase().includes("rust") &&
      comp13.text.includes("not part of Lokesh's verified portfolio skillset"),
    "Unlisted technology inquiry explains boundary honestly without false claims",
    comp13.text
  );

  // -------------------------------------------------------------------------
  // 14. Greeting & Assistant Identity
  // -------------------------------------------------------------------------
  const q14 = "Hello LOKI, who are you?";
  const ret14 = await retrievePortfolioFacts(q14);
  const comp14 = composeOfflineResponse(q14, ret14);
  assert(
    comp14.intent === "greeting" &&
      comp14.text.includes("LOKI") &&
      comp14.text.includes("Lokesh Kagitha's AI assistant"),
    "Greeting clearly identifies assistant as LOKI",
    comp14.text
  );

  // -------------------------------------------------------------------------
  // 15. Contact-Intent Question
  // -------------------------------------------------------------------------
  const q15 = "How can I contact Lokesh or hire him?";
  const ret15 = await retrievePortfolioFacts(q15);
  const comp15 = composeOfflineResponse(q15, ret15);
  assert(
    comp15.intent === "contact" &&
      comp15.text.includes("kagithalokesh8@gmail.com") &&
      comp15.text.includes("+91 7032817065"),
    "Contact intent returns real email and phone number from verified profile",
    comp15.text
  );

  // -------------------------------------------------------------------------
  // 16. Valid Navigation Action Parsing
  // -------------------------------------------------------------------------
  const parsedNav = extractNavAction(comp1.rawOutput);
  assert(
    Boolean(parsedNav) &&
      parsedNav?.section === "work" &&
      parsedNav?.label.includes("View Projects"),
    "rawOutput contains valid [[NAV_ACTION]] parseable by FormattedText.tsx",
    comp1.rawOutput
  );

  // -------------------------------------------------------------------------
  // 17. Navigation Unnecessary for Greeting
  // -------------------------------------------------------------------------
  const parsedNavGreeting = extractNavAction(comp14.rawOutput);
  assert(
    parsedNavGreeting === null && comp14.navAction === undefined,
    "Navigation marker omitted when not relevant (e.g. for greetings)",
    comp14.rawOutput
  );

  // -------------------------------------------------------------------------
  // 18. Fact Grounding Verification
  // -------------------------------------------------------------------------
  const strippedText = stripInternalMarkers(comp2.rawOutput);
  assert(
    strippedText === comp2.text &&
      strippedText.includes("JavaMentor") &&
      !strippedText.includes("[[NAV_ACTION]]"),
    "stripInternalMarkers removes nav marker cleanly, preserving verified answer text",
    strippedText
  );

  // -------------------------------------------------------------------------
  // 19. History Immutability Check
  // -------------------------------------------------------------------------
  const historyCopy = JSON.parse(JSON.stringify(history10));
  composeOfflineResponse(q10, ret10, history10);
  assert(
    JSON.stringify(history10) === JSON.stringify(historyCopy),
    "History array remains completely immutable across composer execution",
    "Preserved identically"
  );

  // -------------------------------------------------------------------------
  // 20. Best Projects (Evidence-Based Criteria vs Unsupported Ranking)
  // -------------------------------------------------------------------------
  const q20 = "Show me his best projects.";
  const ret20 = await retrievePortfolioFacts(q20);
  const comp20 = composeOfflineResponse(q20, ret20);
  assert(
    comp20.text.includes("Purnima Kalamkari") &&
      comp20.text.includes("JavaMentor") &&
      comp20.text.includes("Employee Attendance Management") &&
      comp20.text.includes("criteria rather than an arbitrary universal ranking"),
    "Best projects response explains evidence-based architectural criteria",
    comp20.text
  );

  // -------------------------------------------------------------------------
  // 21. Authentication Feature Inquiry
  // -------------------------------------------------------------------------
  const q21 = "Which project has authentication?";
  const ret21 = await retrievePortfolioFacts(q21);
  const comp21 = composeOfflineResponse(q21, ret21);
  assert(
    comp21.text.includes("JavaMentor") &&
      comp21.text.includes("Employee Attendance Management") &&
      comp21.text.includes("Purnima Kalamkari") &&
      comp21.text.includes("authentication"),
    "Authentication query correctly lists all three projects featuring auth",
    comp21.text
  );

  // -------------------------------------------------------------------------
  // 22. E-Commerce Domain Project
  // -------------------------------------------------------------------------
  const q22 = "Which project involved e-commerce?";
  const ret22 = await retrievePortfolioFacts(q22);
  const comp22 = composeOfflineResponse(q22, ret22);
  assert(
    comp22.text.includes("Purnima Kalamkari") &&
      comp22.text.includes("storefront") &&
      comp22.navAction?.section === "freelance",
    "E-commerce project query answers directly with Purnima Kalamkari",
    comp22.text
  );

  // -------------------------------------------------------------------------
  // 23. Technologies Used in Attendance Management
  // -------------------------------------------------------------------------
  const q23 = "What technologies were used in the attendance management project?";
  const ret23 = await retrievePortfolioFacts(q23);
  const comp23 = composeOfflineResponse(q23, ret23);
  assert(
    comp23.text.includes("React.js") &&
      comp23.text.includes("Node.js") &&
      comp23.text.includes("Express.js") &&
      comp23.text.includes("Firebase"),
    "Attendance management tech query directly states React, Node, Express, Firebase",
    comp23.text
  );

  // -------------------------------------------------------------------------
  // 24. Utility of JavaMentor
  // -------------------------------------------------------------------------
  const q24 = "What makes JavaMentor useful?";
  const ret24 = await retrievePortfolioFacts(q24);
  const comp24 = composeOfflineResponse(q24, ret24);
  assert(
    comp24.text.includes("JavaMentor") &&
      comp24.text.includes("coding practice") &&
      comp24.text.includes("interview"),
    "Utility query highlights concrete educational features of JavaMentor",
    comp24.text
  );

  // -------------------------------------------------------------------------
  // 25. Frontend or Backend Developer Inquiry
  // -------------------------------------------------------------------------
  const q25 = "Is he a frontend or backend developer?";
  const ret25 = await retrievePortfolioFacts(q25);
  const comp25 = composeOfflineResponse(q25, ret25);
  assert(
    comp25.text.includes("Full Stack Developer") &&
      comp25.text.includes("Frontend") &&
      comp25.text.includes("Backend") &&
      comp25.text.includes("React.js") &&
      comp25.text.includes("Node.js"),
    "Frontend vs backend inquiry confirms Full Stack Developer with verified stack",
    comp25.text
  );

  // -------------------------------------------------------------------------
  // 26. Programming Languages Inquiry
  // -------------------------------------------------------------------------
  const q26 = "Which programming languages does he use?";
  const ret26 = await retrievePortfolioFacts(q26);
  const comp26 = composeOfflineResponse(q26, ret26);
  assert(
    comp26.text.includes("JavaScript") &&
      comp26.text.includes("SQL") &&
      comp26.text.includes("HTML5") &&
      comp26.text.includes("Java (Basic)"),
    "Programming languages inquiry directly lists verified language proficiencies",
    comp26.text
  );

  // -------------------------------------------------------------------------
  // 27. Database Experience Inquiry
  // -------------------------------------------------------------------------
  const q27 = "Does he have database experience?";
  const ret27 = await retrievePortfolioFacts(q27);
  const comp27 = composeOfflineResponse(q27, ret27);
  assert(
    comp27.text.includes("MySQL") &&
      comp27.text.includes("Firebase") &&
      comp27.text.includes("Relational Database") &&
      comp27.text.includes("NoSQL"),
    "Database query details MySQL and Firebase across relational and NoSQL models",
    comp27.text
  );

  // -------------------------------------------------------------------------
  // 28. Tools & Platforms Inquiry
  // -------------------------------------------------------------------------
  const q28 = "Which tools has he worked with?";
  const ret28 = await retrievePortfolioFacts(q28);
  const comp28 = composeOfflineResponse(q28, ret28);
  assert(
    comp28.text.includes("Git") &&
      comp28.text.includes("VS Code") &&
      comp28.text.includes("Postman"),
    "Tools inquiry details Git, VS Code, and Postman",
    comp28.text
  );

  // -------------------------------------------------------------------------
  // 29. Deep Dive ("Tell me more") Follow-up on Resolved Project
  // -------------------------------------------------------------------------
  const q29 = "Tell me more about it";
  const history29: ChatMessage[] = [
    { role: "user", content: "Tell me about JavaMentor" },
    { role: "assistant", content: "JavaMentor is a learning platform for Java Full Stack Development." },
  ];
  const ret29 = await retrievePortfolioFacts(q29, history29);
  const comp29 = composeOfflineResponse(q29, ret29, history29);
  assert(
    comp29.intent === "followup" &&
      comp29.text.includes("Deep Dive: JavaMentor") &&
      comp29.text.includes("React.js, Node.js, Firebase, JavaScript"),
    "Follow-up 'Tell me more about it' produces detailed deep-dive",
    comp29.text
  );

  // -------------------------------------------------------------------------
  // 30. Honest Limitation on Unverified Metrics
  // -------------------------------------------------------------------------
  const q30 = "What were the performance benchmarks and active user numbers for it?";
  const ret30 = await retrievePortfolioFacts(q30, history29);
  const comp30 = composeOfflineResponse(q30, ret30, history29);
  assert(
    comp30.text.includes("I don't have that detail in the portfolio information") &&
      comp30.text.includes("does not include public third-party benchmarks"),
    "Unverified benchmark question states clear honest boundary without hallucinating",
    comp30.text
  );

  // -------------------------------------------------------------------------
  // 31. Career Strengths & Professional Interests
  // -------------------------------------------------------------------------
  const q31 = "What are his career interests and professional strengths?";
  const ret31 = await retrievePortfolioFacts(q31);
  const comp31 = composeOfflineResponse(q31, ret31);
  assert(
    comp31.text.includes("Full-Stack Web Development") &&
      comp31.text.includes("500+ LeetCode") &&
      comp31.text.includes("Charani Infotech"),
    "Career strengths query renders verified strengths, metrics, and role",
    comp31.text
  );

  // -------------------------------------------------------------------------
  // 32. Mid-Conversation Greeting Tone
  // -------------------------------------------------------------------------
  const q32 = "Hello LOKI";
  const ret32 = await retrievePortfolioFacts(q32, history29);
  const comp32 = composeOfflineResponse(q32, ret32, history29);
  assert(
    comp32.text.includes("Hello again") &&
      !comp32.text.includes("Hey! I'm LOKI, Lokesh's AI assistant. What would you like"),
    "Mid-conversation greeting avoids repetitive full intro when history is active",
    comp32.text
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\nResults: ${passed}/${total} composer scenarios passed successfully.`);
  if (passed === total) {
    console.log("✓ All Phase 6 natural response composer tests PASSED!");
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
