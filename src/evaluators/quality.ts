import { getAllSessions } from "../utils/research-store";
import type { ResearchSession, ProbeFinding } from "../types/index";

const MIN_CONFIDENCE = 30;
const MIN_FINDING_LENGTH = 100;

interface QualityReport {
  score: number;
  issues: string[];
  strengths: string[];
}

function assessFindingQuality(finding: ProbeFinding): { score: number; issues: string[]; strengths: string[] } {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 50;

  // Content length check
  if (finding.findings.length < MIN_FINDING_LENGTH) {
    issues.push(`${finding.probeType} finding too short (${finding.findings.length} chars)`);
    score -= 15;
  } else if (finding.findings.length > 800) {
    strengths.push(`${finding.probeType} produced detailed analysis`);
    score += 10;
  }

  // Error detection
  if (finding.findings.startsWith("Error:") || finding.findings.includes("Unable to generate")) {
    issues.push(`${finding.probeType} returned an error response`);
    score -= 30;
  }

  // Confidence threshold
  if (finding.confidence < MIN_CONFIDENCE) {
    issues.push(`${finding.probeType} confidence below threshold (${finding.confidence}%)`);
    score -= 10;
  } else if (finding.confidence >= 70) {
    strengths.push(`${finding.probeType} high confidence (${finding.confidence}%)`);
    score += 10;
  }

  // Source citations
  if (finding.sources.length > 0) {
    strengths.push(`${finding.probeType} cited ${finding.sources.length} sources`);
    score += finding.sources.length * 3;
  } else {
    issues.push(`${finding.probeType} has no source citations`);
    score -= 5;
  }

  // Structured content markers (headers, bullet points, numbered lists)
  const hasHeaders = /^#+\s/m.test(finding.findings);
  const hasBullets = /^[-*]\s/m.test(finding.findings);
  const hasNumbered = /^\d+\.\s/m.test(finding.findings);
  if (hasHeaders || hasBullets || hasNumbered) {
    strengths.push(`${finding.probeType} output is well-structured`);
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, score)), issues, strengths };
}

function assessSessionQuality(session: ResearchSession): QualityReport {
  const allIssues: string[] = [];
  const allStrengths: string[] = [];
  const scores: number[] = [];

  for (const finding of session.probeFindings) {
    const assessment = assessFindingQuality(finding);
    scores.push(assessment.score);
    allIssues.push(...assessment.issues);
    allStrengths.push(...assessment.strengths);
  }

  // Report quality
  if (session.report) {
    const reportLen = session.report.summary.length;
    if (reportLen > 1500) {
      allStrengths.push("Synthesis report is comprehensive");
      scores.push(80);
    } else if (reportLen < 300) {
      allIssues.push("Synthesis report is too brief");
      scores.push(30);
    } else {
      scores.push(60);
    }

    if (session.report.overallConfidence >= 60) {
      allStrengths.push(`Overall confidence is solid (${session.report.overallConfidence}%)`);
    }
  }

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return { score: avgScore, issues: allIssues, strengths: allStrengths };
}

export const qualityEvaluator = {
  name: "research-quality",
  description:
    "Evaluates the quality and confidence of research findings, flagging low-confidence or potentially unreliable data",
  similes: ["QUALITY_CHECK", "CONFIDENCE_EVAL"],
  validate: async (_runtime: any, message: any) => {
    const text = message?.content?.text?.toLowerCase() || "";
    return (
      text.includes("briefing") ||
      text.includes("findings") ||
      text.includes("report") ||
      text.includes("intelligence")
    );
  },
  handler: async (_runtime: any, message: any) => {
    const sessions = getAllSessions();
    if (sessions.length === 0) return undefined;

    const latest = sessions[0];
    if (latest.status !== "completed") return undefined;

    const report = assessSessionQuality(latest);

    console.log(
      `[QualityEvaluator] Session ${latest.id} | Score: ${report.score}/100 | Issues: ${report.issues.length} | Strengths: ${report.strengths.length}`
    );
    if (report.issues.length > 0) {
      console.log(`[QualityEvaluator] Issues: ${report.issues.join("; ")}`);
    }

    return undefined;
  },
  examples: [],
};
