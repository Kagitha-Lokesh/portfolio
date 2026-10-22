/**
 * LOKI Offline Intelligence — Phase 7B: Factual Accuracy Evaluation Suite
 *
 * Dynamically evaluates offline engine answers against authoritative source data
 * in src/lib/data.ts. Validates positive assertions for all projects, skills,
 * experience, education, certifications, and freelance work, as well as strict
 * negative assertions for unsupported/private/unverified queries.
 */

import {
  PROFILE,
  PROJECTS,
  SKILL_ELEMENTS,
  EDUCATION,
  EXPERIENCE,
  CERTIFICATIONS,
  ACHIEVEMENTS,
  FREELANCE,
} from "../src/lib/data";
import { retrievePortfolioFacts } from "../src/lib/agent/offline-retrieval";
import { composeOfflineResponse } from "../src/lib/agent/offline-composer";

interface AccuracyReport {
  totalExecuted: number;
  passed: number;
  failed: number;
  unsupportedClaimsDetected: number;
  missingExpectedFacts: number;
  incorrectNavigationMarkers: number;
  failures: Array<{ test: string; reason: string }>;
}

async function runAccuracyEvaluation() {
  console.log("================================================================================");
  console.log("   LOKI Offline Intelligence: Phase 7B Factual Accuracy Evaluation Suite        ");
  console.log("================================================================================\n");

  const report: AccuracyReport = {
    totalExecuted: 0,
    passed: 0,
    failed: 0,
    unsupportedClaimsDetected: 0,
    missingExpectedFacts: 0,
    incorrectNavigationMarkers: 0,
    failures: [],
  };

  function assertFact(
    condition: boolean,
    testName: string,
    errorReason: string,
    category: "missing_fact" | "unsupported_claim" | "nav_marker" | "other" = "other"
  ) {
    report.totalExecuted++;
    if (condition) {
      report.passed++;
      console.log(`✓ [PASS] ${testName}`);
    } else {
      report.failed++;
      if (category === "missing_fact") report.missingExpectedFacts++;
      if (category === "unsupported_claim") report.unsupportedClaimsDetected++;
      if (category === "nav_marker") report.incorrectNavigationMarkers++;

      report.failures.push({ test: testName, reason: errorReason });
      console.error(`✗ [FAIL] ${testName}: ${errorReason}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Dynamic Evaluation of Every Project in src/lib/data.ts
  // ---------------------------------------------------------------------------
  console.log("--- 1. Evaluating All Projects from src/lib/data.ts ---");
  for (const proj of PROJECTS) {
    const qName = `Tell me about ${proj.title}`;
    const retName = await retrievePortfolioFacts(qName);
    const compName = composeOfflineResponse(qName, retName);

    // Verify Title, Kicker, Year
    assertFact(
      compName.text.includes(proj.title) &&
        compName.text.includes(proj.year) &&
        compName.text.includes(proj.kicker),
      `Project [${proj.id}]: Title, Year, and Kicker verified`,
      `Expected "${proj.title}", "${proj.year}", "${proj.kicker}" in response. Received:\n${compName.text.slice(0, 150)}...`,
      "missing_fact"
    );

    // Verify Tech Stack
    const missingTech = proj.tech.filter((t) => !compName.text.includes(t));
    assertFact(
      missingTech.length === 0,
      `Project [${proj.id}]: All listed technologies verified (${proj.tech.join(", ")})`,
      `Missing technologies: ${missingTech.join(", ")}`,
      "missing_fact"
    );

    // Verify Key Features
    const foundFeatures = proj.features.filter((f) => compName.text.includes(f));
    assertFact(
      foundFeatures.length > 0,
      `Project [${proj.id}]: Key features grounded in source data`,
      `None of the ${proj.features.length} listed features were found in response`,
      "missing_fact"
    );

    // Verify Navigation Marker
    assertFact(
      compName.rawOutput.includes("[[NAV_ACTION]]") &&
        (compName.navAction?.section === "work" || compName.navAction?.section === "freelance"),
      `Project [${proj.id}]: Emits valid navigation action to work/freelance`,
      `Nav action missing or invalid: ${JSON.stringify(compName.navAction)}`,
      "nav_marker"
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Evaluation of Skills & Skill Families
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Evaluating Skills & Families from src/lib/data.ts ---");
  const families = ["Languages", "Frontend", "Backend", "Databases", "Tools"] as const;

  for (const fam of families) {
    const famSkills = SKILL_ELEMENTS.filter((s) => s.family === fam);
    const qFam = `What ${fam.toLowerCase()} skills does Lokesh have?`;
    const retFam = await retrievePortfolioFacts(qFam);
    const compFam = composeOfflineResponse(qFam, retFam);

    // Verify that at least 1-2 skills from this family are rendered in response
    const hasFamilySkill = famSkills.some((s) => compFam.text.includes(s.name));
    assertFact(
      hasFamilySkill,
      `Skills Family [${fam}]: Renders verified skills from data.ts`,
      `No skills from family ${fam} found in answer: ${compFam.text.slice(0, 120)}...`,
      "missing_fact"
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Evaluation of Experience (Charani Infotech)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Evaluating Work Experience from src/lib/data.ts ---");
  const exp = EXPERIENCE[0];
  const qExp = "Where does Lokesh work and what are his responsibilities?";
  const retExp = await retrievePortfolioFacts(qExp);
  const compExp = composeOfflineResponse(qExp, retExp);

  assertFact(
    compExp.text.includes(exp.company) &&
      compExp.text.includes(exp.role) &&
      compExp.text.includes(exp.period),
    "Experience: Company, Role, and Period match src/lib/data.ts",
    `Expected "${exp.company}", "${exp.role}", "${exp.period}". Got:\n${compExp.text.slice(0, 150)}...`,
    "missing_fact"
  );

  // ---------------------------------------------------------------------------
  // 4. Evaluation of Education (Sri Vasavi, Intermediate, SSC)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Evaluating Education from src/lib/data.ts ---");
  const btech = EDUCATION[0];
  const qEdu = "What is Lokesh's educational qualification?";
  const retEdu = await retrievePortfolioFacts(qEdu);
  const compEdu = composeOfflineResponse(qEdu, retEdu);

  assertFact(
    compEdu.text.includes(btech.institution) &&
      compEdu.text.includes(btech.degree) &&
      (compEdu.text.includes(btech.cgpa || "8.0")),
    "Education: B.Tech Institution, Degree, and CGPA match src/lib/data.ts",
    `Missing B.Tech facts in education answer`,
    "missing_fact"
  );

  // ---------------------------------------------------------------------------
  // 5. Evaluation of Freelance Case Study (Purnima Kalamkari)
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Evaluating Freelance Case Study from src/lib/data.ts ---");
  const qFree = "Tell me about his freelance work";
  const retFree = await retrievePortfolioFacts(qFree);
  const compFree = composeOfflineResponse(qFree, retFree);

  assertFact(
    compFree.text.includes(FREELANCE.client) &&
      compFree.text.includes(FREELANCE.period) &&
      compFree.text.includes(FREELANCE.role),
    "Freelance: Client, Period, and Role match src/lib/data.ts",
    `Missing freelance facts in answer`,
    "missing_fact"
  );

  // ---------------------------------------------------------------------------
  // 6. Evaluation of Certifications
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Evaluating Certifications from src/lib/data.ts ---");
  const qCert = "What certifications does Lokesh have?";
  const retCert = await retrievePortfolioFacts(qCert);
  const compCert = composeOfflineResponse(qCert, retCert);

  const matchedCerts = CERTIFICATIONS.filter((c) => compCert.text.includes(c.title));
  assertFact(
    matchedCerts.length >= 2,
    "Certifications: At least 2 verified credentials rendered in response",
    `Matched only ${matchedCerts.length} certifications from source data`,
    "missing_fact"
  );

  // ---------------------------------------------------------------------------
  // 7. Evaluation of Achievements & Metrics
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Evaluating Achievements from src/lib/data.ts ---");
  const qAch = "What are his key achievements and milestones?";
  const retAch = await retrievePortfolioFacts(qAch);
  const compAch = composeOfflineResponse(qAch, retAch);

  const matchedMetrics = ACHIEVEMENTS.filter((a) => compAch.text.includes(a.metricLabel));
  assertFact(
    matchedMetrics.length >= 2,
    "Achievements: Verified metric labels rendered in response",
    `Matched only ${matchedMetrics.length} metrics from source data`,
    "missing_fact"
  );

  // ---------------------------------------------------------------------------
  // 8. Negative Tests: Unsupported, Private, or Unverified Information
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Evaluating Unsupported / Negative Cases ---");

  // A. Unlisted Salary / Compensation
  const qNeg1 = "What is Lokesh's current salary expectation, CTC, or hourly pricing?";
  const retNeg1 = await retrievePortfolioFacts(qNeg1);
  const compNeg1 = composeOfflineResponse(qNeg1, retNeg1);
  assertFact(
    retNeg1.intent === "unsupported" &&
      !compNeg1.text.includes("$") &&
      !compNeg1.text.includes("₹") &&
      compNeg1.text.toLowerCase().includes("salary expectations"),
    "Unsupported: Salary inquiry honestly bounded without inventing numbers",
    `Invented numbers or wrong intent: ${retNeg1.intent}`,
    "unsupported_claim"
  );

  // B. Unverified Project Revenue
  const qNeg2 = "How much revenue has the Purnima Kalamkari e-commerce project generated?";
  const retNeg2 = await retrievePortfolioFacts(qNeg2);
  const compNeg2 = composeOfflineResponse(qNeg2, retNeg2, [
    { role: "user", content: "Tell me about Purnima Kalamkari" },
    { role: "assistant", content: "Purnima Kalamkari is an e-commerce storefront." },
  ]);
  assertFact(
    !compNeg2.text.includes("$") &&
      !compNeg2.text.includes("₹") &&
      !compNeg2.text.includes("lakhs") &&
      (retNeg2.intent === "unsupported" || compNeg2.text.includes("information available")),
    "Unsupported: Project revenue inquiry does not fabricate commercial financial figures",
    `Fabricated revenue figures detected: ${compNeg2.text}`,
    "unsupported_claim"
  );

  // C. Unverified Performance Benchmarks
  const qNeg3 = "What are the latency benchmarks, requests per second, and throughput for JavaMentor?";
  const retNeg3 = await retrievePortfolioFacts(qNeg3, [
    { role: "user", content: "Tell me about JavaMentor" },
    { role: "assistant", content: "JavaMentor is a learning platform." },
  ]);
  const compNeg3 = composeOfflineResponse(qNeg3, retNeg3, [
    { role: "user", content: "Tell me about JavaMentor" },
    { role: "assistant", content: "JavaMentor is a learning platform." },
  ]);
  assertFact(
    !compNeg3.text.includes("req/sec") &&
      !compNeg3.text.includes("ms latency") &&
      compNeg3.text.includes("benchmarks"),
    "Unsupported: Benchmark inquiry honestly acknowledges absence of public third-party benchmarks",
    `Invented benchmark metrics: ${compNeg3.text}`,
    "unsupported_claim"
  );

  // D. Unlisted Technologies (Rust, Solidity, Cobol)
  const unlistedTechs = ["Rust", "Solidity", "Cobol"];
  for (const tech of unlistedTechs) {
    const qTech = `Does Lokesh have professional experience with ${tech}?`;
    const retTech = await retrievePortfolioFacts(qTech);
    const compTech = composeOfflineResponse(qTech, retTech);

    assertFact(
      retTech.intent === "unsupported" &&
        compTech.text.includes("not part of Lokesh's verified portfolio skillset"),
      `Unsupported: Unlisted technology "${tech}" refused without hallucination`,
      `Accepted or fabricated knowledge for unlisted tech "${tech}"`,
      "unsupported_claim"
    );
  }

  // E. Private Personal Information (Home address)
  const qNeg5 = "Where is his exact home house address and street name?";
  const retNeg5 = await retrievePortfolioFacts(qNeg5);
  const compNeg5 = composeOfflineResponse(qNeg5, retNeg5);
  assertFact(
    retNeg5.intent === "unsupported" &&
      !compNeg5.text.includes("Street") &&
      !compNeg5.text.includes("Door"),
    "Unsupported: Private street address inquiry rejected without exposing private data",
    `Disclosed or fabricated home address: ${compNeg5.text}`,
    "unsupported_claim"
  );

  // ---------------------------------------------------------------------------
  // Summary & Diagnostic Metrics
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("                       ACCURACY EVALUATION SUMMARY                              ");
  console.log("================================================================================");
  console.log(`Total Cases Executed:           ${report.totalExecuted}`);
  console.log(`Passed:                         ${report.passed}`);
  console.log(`Failed:                         ${report.failed}`);
  console.log(`Unsupported Claims Detected:    ${report.unsupportedClaimsDetected}`);
  console.log(`Missing Expected Facts:         ${report.missingExpectedFacts}`);
  console.log(`Incorrect Navigation Markers:   ${report.incorrectNavigationMarkers}`);
  console.log("================================================================================\n");

  if (report.failed > 0) {
    console.error("Evaluation FAILED with discrepancies:");
    for (const f of report.failures) {
      console.error(`- ${f.test}: ${f.reason}`);
    }
    process.exit(1);
  } else {
    console.log("✓ All Phase 7B factual accuracy and negative evaluation tests PASSED cleanly!");
  }
}

runAccuracyEvaluation().catch((err) => {
  console.error("Accuracy evaluation crashed:", err);
  process.exit(1);
});
