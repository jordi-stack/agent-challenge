import { getAllSessions } from "../utils/research-store";
import type { ResearchSession, ProbeType } from "../types/index";

const REQUIRED_PROBES: ProbeType[] = ["scout", "analyst", "sentinel"];
const MIN_SUBSTANTIAL_LENGTH = 80;

interface CompletenessReport {
  complete: boolean;
  coverage: number;
  missing: string[];
  warnings: string[];
}

function assessCompleteness(session: ResearchSession): CompletenessReport {
  const missing: string[] = [];
  const warnings: string[] = [];
  let coveredProbes = 0;

  for (const probeType of REQUIRED_PROBES) {
    const finding = session.probeFindings.find((f) => f.probeType === probeType);

    if (!finding) {
      missing.push(`${probeType} probe never ran`);
      continue;
    }

    // Check if the finding has substantial content (not an error or empty)
    const isError =
      finding.findings.startsWith("Error:") ||
      finding.findings.includes("Unable to generate");
    const isTooShort = finding.findings.length < MIN_SUBSTANTIAL_LENGTH;

    if (isError) {
      missing.push(`${probeType} probe returned an error`);
    } else if (isTooShort) {
      warnings.push(
        `${probeType} probe output is thin (${finding.findings.length} chars)`
      );
      coveredProbes += 0.5;
    } else {
      coveredProbes++;
    }
  }

  // Check synthesis
  if (!session.report) {
    missing.push("Synthesis report was not generated");
  } else if (session.report.summary.length < MIN_SUBSTANTIAL_LENGTH) {
    warnings.push("Synthesis report is too brief to be useful");
  }

  // Check session reached completed status
  if (session.status === "failed") {
    missing.push("Session ended in failed state");
  } else if (session.status !== "completed") {
    warnings.push(`Session is still in ${session.status} state`);
  }

  const totalRequired = REQUIRED_PROBES.length + 1; // 3 probes + 1 synthesis
  const totalCovered =
    coveredProbes + (session.report && session.report.summary.length >= MIN_SUBSTANTIAL_LENGTH ? 1 : 0);
  const coverage = Math.round((totalCovered / totalRequired) * 100);

  return {
    complete: missing.length === 0 && coverage >= 75,
    coverage,
    missing,
    warnings,
  };
}

export const completenessEvaluator = {
  name: "research-completeness",
  description:
    "Evaluates whether a research session covered all necessary angles (scout, analyst, sentinel) and produced a synthesis",
  similes: ["COMPLETENESS_CHECK", "COVERAGE_EVAL"],
  validate: async (_runtime: any, message: any) => {
    const text = message?.content?.text?.toLowerCase() || "";
    return (
      text.includes("briefing") ||
      text.includes("report") ||
      text.includes("intelligence")
    );
  },
  handler: async (_runtime: any, _message: any) => {
    const sessions = getAllSessions();
    if (sessions.length === 0) return undefined;

    const latest = sessions[0];
    const report = assessCompleteness(latest);

    console.log(
      `[CompletenessEvaluator] Session ${latest.id} | Coverage: ${report.coverage}% | Complete: ${report.complete}`
    );
    if (report.missing.length > 0) {
      console.log(`[CompletenessEvaluator] Missing: ${report.missing.join("; ")}`);
    }
    if (report.warnings.length > 0) {
      console.log(`[CompletenessEvaluator] Warnings: ${report.warnings.join("; ")}`);
    }

    return undefined;
  },
  examples: [],
};
