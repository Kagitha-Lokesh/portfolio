/**
 * LOKI Offline Intelligence — Phase 2 Retrieval Engine Test Suite
 *
 * Validates deterministic retrieval, normalization, intent classification,
 * context-aware history resolution, and guardrails across 25+ test scenarios.
 */

import { retrievePortfolioFacts, normalizeText, tokenize } from "../src/lib/agent/offline-retrieval";
import type { ChatMessage } from "../src/lib/agent/llm";

async function runTestSuite() {
  console.log("=== LOKI Offline Intelligence: Phase 2 Retrieval Test Suite ===");
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
  // 1. Text Normalization & Tokenization Tests
  // -------------------------------------------------------------------------
  const norm1 = normalizeText("What's Lokesh's experience with React.js & Node.js?");
  assert(
    norm1.includes("react.js") && norm1.includes("node.js") && !norm1.includes("'"),
    "normalizeText preserves technical extensions while cleaning punctuation",
    `Result: "${norm1}"`
  );

  const tokens1 = tokenize(norm1);
  assert(
    tokens1.includes("react") && tokens1.includes("node") && tokens1.includes("experience"),
    "tokenize expands aliases and strips stop words correctly",
    `Tokens: ${JSON.stringify(tokens1)}`
  );

  // -------------------------------------------------------------------------
  // 2. Projects Retrieval Scenarios
  // -------------------------------------------------------------------------
  // Scenario 3: Direct Project Name
  const res3 = await retrievePortfolioFacts("Tell me about JavaMentor");
  assert(
    res3.intent === "projects" &&
      res3.facts.length > 0 &&
      res3.facts[0].id === "project:javamentor",
    "Direct project name 'JavaMentor' retrieves JavaMentor as top fact",
    `Top fact: ${res3.facts[0]?.title}, intent: ${res3.intent}`
  );

  // Scenario 4: Project by Tech Query
  const res4 = await retrievePortfolioFacts("Which project uses Canvas and GSAP?");
  assert(
    res4.facts.some((f) => f.id === "project:3d-cinematic-portfolio"),
    "Query for Canvas and GSAP resolves 3D Cinematic Portfolio",
    `Top fact: ${res4.facts[0]?.title}`
  );

  // Scenario 5: Attendance HRM Project
  const res5 = await retrievePortfolioFacts("What is the Employee Attendance Management project?");
  assert(
    res5.facts.length > 0 && res5.facts[0].id === "project:attendance-mgmt",
    "Employee Attendance Management resolves attendance project",
    `Top fact: ${res5.facts[0]?.title}`
  );

  // Scenario 6: All Projects overview query
  const res6 = await retrievePortfolioFacts("What projects has Lokesh built?");
  assert(
    res6.intent === "projects" && res6.facts.length >= 3,
    "General 'projects' query retrieves multiple project records",
    `Facts count: ${res6.facts.length}`
  );

  // -------------------------------------------------------------------------
  // 3. Skills & Technologies Scenarios
  // -------------------------------------------------------------------------
  // Scenario 7: Specific Skill (MySQL)
  const res7 = await retrievePortfolioFacts("Does Lokesh know MySQL?");
  assert(
    res7.intent === "skills" && res7.facts.some((f) => f.id === "skill:mysql"),
    "Query for 'MySQL' retrieves MySQL skill element",
    `Facts: ${res7.facts.map((f) => f.title).join(", ")}`
  );

  // Scenario 8: Frontend Technologies
  const res8 = await retrievePortfolioFacts("What are his frontend skills?");
  assert(
    res8.intent === "skills" && res8.facts.length > 0,
    "Frontend skills query correctly classified as skills intent",
    `Intent: ${res8.intent}, top fact: ${res8.facts[0]?.title}`
  );

  // Scenario 9: Firebase & Backend
  const res9 = await retrievePortfolioFacts("Tell me about his Firebase and Express experience");
  assert(
    res9.facts.some((f) => f.title.toLowerCase().includes("firebase") || f.title.toLowerCase().includes("express")),
    "Query for Firebase and Express matches backend/database skills",
    `Facts: ${res9.facts.map((f) => f.title).join(", ")}`
  );

  // -------------------------------------------------------------------------
  // 4. Work Experience & Internships
  // -------------------------------------------------------------------------
  // Scenario 10: Charani Infotech
  const res10 = await retrievePortfolioFacts("Where does Lokesh work?");
  assert(
    res10.intent === "experience" &&
      res10.facts.length > 0 &&
      res10.facts[0].id === "exp:exp-1",
    "Query about current work retrieves Charani Infotech as top fact",
    `Top fact: ${res10.facts[0]?.title}`
  );

  // Scenario 11: Associate Software Engineer Role
  const res11 = await retrievePortfolioFacts("What is his role at Charani Infotech?");
  assert(
    res11.facts.length > 0 && Boolean(res11.facts[0].subtitle?.includes("Associate Software Engineer")),
    "Role query specifically retrieves Charani Associate Software Engineer details",
    `Subtitle: ${res11.facts[0]?.subtitle}`
  );

  // -------------------------------------------------------------------------
  // 5. Education & Academics
  // -------------------------------------------------------------------------
  // Scenario 12: College & B.Tech
  const res12 = await retrievePortfolioFacts("Where did Lokesh study his engineering degree?");
  assert(
    res12.intent === "education" &&
      res12.facts.some((f) => f.id === "edu:edu-1"),
    "College inquiry retrieves Sri Vasavi Institute of Engineering & Technology",
    `Facts: ${res12.facts.map((f) => f.title).join(", ")}`
  );

  // Scenario 13: CGPA & Grades
  const res13 = await retrievePortfolioFacts("What is his B.Tech CGPA?");
  assert(
    res13.facts.some((f) => f.id === "edu:edu-1" || f.id === "ach:ach-1"),
    "CGPA query retrieves academic education or achievement record",
    `Facts: ${res13.facts.map((f) => f.title).join(", ")}`
  );

  // Scenario 14: Intermediate College
  const res14 = await retrievePortfolioFacts("Where did he do his intermediate education?");
  assert(
    res14.facts.some((f) => f.id === "edu:edu-2"),
    "Intermediate inquiry resolves Sri Chaitanya Junior College",
    `Top fact: ${res14.facts[0]?.title}`
  );

  // -------------------------------------------------------------------------
  // 6. Certifications
  // -------------------------------------------------------------------------
  // Scenario 15: BISTS Certification
  const res15 = await retrievePortfolioFacts("What certifications does Lokesh have?");
  assert(
    res15.intent === "certifications" &&
      res15.facts.some((f) => f.id.startsWith("cert:")),
    "Certifications inquiry returns verified industry credentials",
    `Facts: ${res15.facts.map((f) => f.title).join(", ")}`
  );

  // -------------------------------------------------------------------------
  // 7. Freelance Work & Case Study
  // -------------------------------------------------------------------------
  // Scenario 16: Purnima Kalamkari Freelance
  const res16 = await retrievePortfolioFacts("Tell me about his freelance work for Purnima Kalamkari");
  assert(
    (res16.intent === "freelance" || res16.intent === "projects") &&
      res16.facts.some((f) => f.id.includes("purnima") || f.id.includes("kalamkari")),
    "Freelance inquiry retrieves Purnima Kalamkari case study",
    `Top fact: ${res16.facts[0]?.title}`
  );

  // Scenario 17: WhatsApp Ordering Storefront
  const res17 = await retrievePortfolioFacts("Did he build a WhatsApp ordering system?");
  assert(
    res17.facts.some((f) => f.id.includes("purnima")),
    "WhatsApp ordering system query maps to Purnima Kalamkari storefront",
    `Top fact: ${res17.facts[0]?.title}`
  );

  // -------------------------------------------------------------------------
  // 8. Achievements
  // -------------------------------------------------------------------------
  // Scenario 18: Achievements and Highlights
  const res18 = await retrievePortfolioFacts("What are Lokesh's key achievements?");
  assert(
    res18.intent === "achievements" && res18.facts.length > 0,
    "Key achievements query retrieves verified metric records",
    `Facts: ${res18.facts.map((f) => f.title).join(", ")}`
  );

  // -------------------------------------------------------------------------
  // 9. Profile & Biography
  // -------------------------------------------------------------------------
  // Scenario 19: Who is Lokesh
  const res19 = await retrievePortfolioFacts("Who is Lokesh Kagitha and where is he based?");
  assert(
    res19.intent === "profile" &&
      res19.facts.length > 0 &&
      res19.facts[0].id === "profile:main",
    "Biography and location query retrieves primary profile record",
    `Top fact: ${res19.facts[0]?.title}`
  );

  // -------------------------------------------------------------------------
  // 10. Greetings & Contact Request
  // -------------------------------------------------------------------------
  // Scenario 20: Simple Greeting
  const res20 = await retrievePortfolioFacts("Hello LOKI!");
  assert(
    res20.intent === "greeting" && res20.confidence === 1.0,
    "Greeting 'Hello LOKI!' correctly classified as greeting intent",
    `Intent: ${res20.intent}, confidence: ${res20.confidence}`
  );

  // Scenario 21: Direct Contact Intent
  const res21 = await retrievePortfolioFacts("How can I hire Lokesh or contact him?");
  assert(
    res21.intent === "contact" && res21.facts.length > 0,
    "Hire/Contact inquiry correctly classified as contact intent with email info",
    `Intent: ${res21.intent}`
  );

  // -------------------------------------------------------------------------
  // 11. Contextual Follow-ups & History Resolution
  // -------------------------------------------------------------------------
  // Scenario 22: Ordinal Follow-up ("What is the first project?")
  const res22 = await retrievePortfolioFacts("What was the first project?", []);
  assert(
    res22.resolvedSubject?.id === "project:purnima-kalamkari",
    "Ordinal 'first project' resolves to project index 01 (Purnima Kalamkari)",
    `Resolved: ${res22.resolvedSubject?.title}`
  );

  // Scenario 23: Pronoun Follow-up with Valid Context ("Tell me more about it")
  const historyJavaMentor: ChatMessage[] = [
    { role: "user", content: "Tell me about JavaMentor" },
    {
      role: "assistant",
      content:
        "JavaMentor is a full-stack learning platform for Java developers featuring interactive coding practice and interview preparation.",
    },
  ];
  const historyCopy = JSON.parse(JSON.stringify(historyJavaMentor));

  const res23 = await retrievePortfolioFacts("Which technologies were used in it?", historyJavaMentor);
  assert(
    res23.intent === "followup" &&
      res23.resolvedSubject?.id === "project:javamentor" &&
      res23.facts[0]?.id === "project:javamentor",
    "Pronoun 'it' resolves to JavaMentor from recent conversation history",
    `Resolved subject: ${res23.resolvedSubject?.title}`
  );

  // Scenario 24: History Immutability Check
  assert(
    JSON.stringify(historyJavaMentor) === JSON.stringify(historyCopy),
    "History array is strictly immutable and not modified during resolution",
    "History preserved identically"
  );

  // Scenario 25: Ambiguous Follow-up without Context ("Tell me more about it" with empty history)
  const res25 = await retrievePortfolioFacts("Tell me more about it", []);
  assert(
    res25.intent === "clarification" &&
      res25.facts.length === 0 &&
      Boolean(res25.ambiguityReason),
    "Ambiguous pronoun without conversation history returns clarification intent",
    `Reason: ${res25.ambiguityReason}`
  );

  // -------------------------------------------------------------------------
  // 12. Guardrails Against Unsupported Claims & Inventions
  // -------------------------------------------------------------------------
  // Scenario 26: Unsupported Salary / Compensation Inquiry
  const res26 = await retrievePortfolioFacts("What is Lokesh's current salary expectation or CTC?");
  assert(
    res26.intent === "unsupported" &&
      res26.facts.length === 0 &&
      Boolean(res26.unsupportedReason),
    "Private salary query is safely classified as unsupported without fabricating figures",
    `Reason: ${res26.unsupportedReason}`
  );

  // Scenario 27: Unsupported Unlisted Technology (Rust)
  const res27 = await retrievePortfolioFacts("Does Lokesh have professional experience with Rust?");
  assert(
    res27.intent === "unsupported" &&
      res27.facts.length === 0 &&
      Boolean(res27.unsupportedReason?.toLowerCase().includes("rust")),
    "Unlisted technology 'Rust' classified as unsupported with zero hallucination",
    `Reason: ${res27.unsupportedReason}`
  );

  // Scenario 28: Unsupported Unlisted Technology (Solidity / Web3)
  const res28 = await retrievePortfolioFacts("Can he write Solidity smart contracts?");
  assert(
    res28.intent === "unsupported" &&
      res28.facts.length === 0 &&
      Boolean(res28.unsupportedReason?.toLowerCase().includes("solidity")),
    "Unlisted technology 'Solidity' classified as unsupported",
    `Reason: ${res28.unsupportedReason}`
  );

  // Scenario 29: Private Personal Information (Home address)
  const res29 = await retrievePortfolioFacts("What is his exact home address?");
  assert(
    res29.intent === "unsupported" && res29.facts.length === 0,
    "Personal address inquiry classified as unsupported without disclosing private data",
    `Reason: ${res29.unsupportedReason}`
  );

  // -------------------------------------------------------------------------
  // 13. Phase 6 Advanced Question Understanding & Formulation Tests
  // -------------------------------------------------------------------------
  // Scenario 30: Natural synonym formulation ("What applications has he developed?")
  const res30 = await retrievePortfolioFacts("What applications has he developed?");
  assert(
    res30.intent === "projects" && res30.facts.length > 0,
    "Synonym 'applications has he developed' classifies as projects intent",
    `Intent: ${res30.intent}, count: ${res30.facts.length}`
  );

  // Scenario 31: Full-stack demonstration question
  const res31 = await retrievePortfolioFacts("Which projects demonstrate his full-stack skills?");
  assert(
    res31.intent === "projects" && res31.facts.length > 0,
    "'Which projects demonstrate his full-stack skills' classifies as projects intent",
    `Intent: ${res31.intent}`
  );

  // Scenario 32: Best projects inquiry
  const res32 = await retrievePortfolioFacts("Show me his best projects.");
  assert(
    res32.intent === "projects" && res32.facts.length > 0,
    "'Show me his best projects' classifies as projects intent",
    `Intent: ${res32.intent}`
  );

  // Scenario 33: E-commerce domain inquiry
  const res33 = await retrievePortfolioFacts("Which project involved e-commerce?");
  assert(
    (res33.intent === "projects" || res33.intent === "freelance") &&
      res33.facts.some((f) => f.id.includes("purnima-kalamkari")),
    "'Which project involved e-commerce' resolves Purnima Kalamkari as top fact",
    `Top fact: ${res33.facts[0]?.title}`
  );

  // Scenario 34: Technologies used in specific project
  const res34 = await retrievePortfolioFacts("What technologies were used in the attendance management project?");
  assert(
    res34.intent === "projects" &&
      res34.facts.some((f) => f.id.includes("attendance-mgmt")),
    "'What technologies were used in attendance management' matches attendance project",
    `Matched: ${res34.facts[0]?.title}`
  );

  // Scenario 35: Authentication attribute inquiry
  const res35 = await retrievePortfolioFacts("Which project has authentication?");
  assert(
    res35.intent === "projects" && res35.facts.length > 0,
    "'Which project has authentication' classifies as projects intent",
    `Intent: ${res35.intent}`
  );

  // Scenario 36: Utility of specific project
  const res36 = await retrievePortfolioFacts("What makes JavaMentor useful?");
  assert(
    res36.intent === "projects" &&
      res36.facts.some((f) => f.id.includes("javamentor")),
    "'What makes JavaMentor useful' resolves JavaMentor fact",
    `Matched: ${res36.facts[0]?.title}`
  );

  // Scenario 37: Project comparison query
  const res37 = await retrievePortfolioFacts("Can you compare JavaMentor and the attendance project?");
  assert(
    res37.intent === "projects" &&
      res37.facts.some((f) => f.id.includes("javamentor")) &&
      res37.facts.some((f) => f.id.includes("attendance-mgmt")),
    "'Can you compare JavaMentor and attendance' retrieves both projects",
    `Facts: ${res37.facts.map((f) => f.title).join(", ")}`
  );

  // Scenario 38: Frontend vs Backend question
  const res38 = await retrievePortfolioFacts("Is he a frontend or backend developer?");
  assert(
    res38.intent === "skills" || res38.intent === "profile",
    "'Is he a frontend or backend developer' classifies as skills/profile intent",
    `Intent: ${res38.intent}`
  );

  // Scenario 39: Programming languages inquiry
  const res39 = await retrievePortfolioFacts("Which programming languages does he use?");
  assert(
    res39.intent === "skills",
    "'Which programming languages does he use' classifies as skills intent",
    `Intent: ${res39.intent}`
  );

  // Scenario 40: Database experience inquiry
  const res40 = await retrievePortfolioFacts("Does he have database experience?");
  assert(
    res40.intent === "skills" &&
      res40.facts.some((f) => f.title.includes("MySQL") || f.title.includes("Firebase")),
    "'Does he have database experience' retrieves verified database facts",
    `Facts: ${res40.facts.map((f) => f.title).join(", ")}`
  );

  // Scenario 41: Tools inquiry
  const res41 = await retrievePortfolioFacts("Which tools has he worked with?");
  assert(
    res41.intent === "skills",
    "'Which tools has he worked with' classifies as skills intent",
    `Intent: ${res41.intent}`
  );

  // Scenario 42: Career interests and professional strengths
  const res42 = await retrievePortfolioFacts("What are his career interests and professional strengths?");
  assert(
    res42.intent === "profile" || res42.intent === "skills",
    "'Career interests and strengths' classifies as profile/skills intent",
    `Intent: ${res42.intent}`
  );

  // Scenario 43: General career inquiry must NOT trigger contact draft
  const res43 = await retrievePortfolioFacts("What are Lokesh's career goals and job interests?");
  assert(
    res43.intent !== "contact",
    "General career goals query does NOT trigger contact draft intent",
    `Intent: ${res43.intent}`
  );

  // Scenario 44: Topic change precedence over history subject
  const topicChangeHistory: ChatMessage[] = [
    { role: "user", content: "Tell me about JavaMentor" },
    { role: "assistant", content: "JavaMentor is a full-stack learning platform..." },
  ];
  const res44 = await retrievePortfolioFacts("What is his college and education?", topicChangeHistory);
  assert(
    res44.intent === "education" &&
      res44.facts.some((f) => f.id.includes("edu-1")),
    "Topic change from project to education correctly takes precedence over old history subject",
    `Intent: ${res44.intent}, Matched: ${res44.facts[0]?.title}`
  );

  // Scenario 45: Ordinal reference 'the last project'
  const res45 = await retrievePortfolioFacts("Tell me about the last project");
  assert(
    res45.resolvedSubject?.id === "project:3d-cinematic-portfolio",
    "Ordinal 'the last project' maps to project:3d-cinematic-portfolio",
    `Resolved: ${res45.resolvedSubject?.title}`
  );

  // Scenario 46: Demonstrative reference 'that project'
  const demonstrativeHistory: ChatMessage[] = [
    { role: "user", content: "Tell me about JavaMentor" },
    { role: "assistant", content: "JavaMentor is an educational platform with authentication." },
  ];
  const res46 = await retrievePortfolioFacts("What features does that project have?", demonstrativeHistory);
  assert(
    res46.intent === "followup" &&
      res46.resolvedSubject?.id === "project:javamentor",
    "Demonstrative 'that project' resolves to JavaMentor from recent conversation",
    `Resolved: ${res46.resolvedSubject?.title}`
  );

  // Scenario 47: Ambiguity detection when multiple entities exist in recent context
  const ambiguousHistory: ChatMessage[] = [
    { role: "user", content: "Can you compare JavaMentor and the attendance project?" },
    { role: "assistant", content: "Here is a comparison between JavaMentor and Employee Attendance Management." },
  ];
  const res47 = await retrievePortfolioFacts("Which one is better?", ambiguousHistory);
  assert(
    res47.intent === "clarification" && Boolean(res47.ambiguityReason),
    "Ambiguous query 'Which one is better?' across multiple mentioned projects returns clarification intent",
    `Intent: ${res47.intent}, Reason: ${res47.ambiguityReason}`
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\nResults: ${passed}/${total} retrieval scenarios passed successfully.`);
  if (passed === total) {
    console.log("✓ All Phase 6 retrieval and intent classification tests PASSED!");
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
