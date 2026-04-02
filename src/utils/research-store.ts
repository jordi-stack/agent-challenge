import type {
  ResearchSession,
  ProbeFinding,
  ResearchStatus,
  ResearchReport,
  WatchlistItem,
} from "../types/index";

// In-memory store (works without SQLite dependency issues in ElizaOS context)
// Data persists for the lifetime of the process
const sessions = new Map<string, ResearchSession>();
const findings = new Map<string, ProbeFinding[]>();
const watchlist = new Map<string, WatchlistItem>();

export function createSession(id: string, topic: string): ResearchSession {
  const session: ResearchSession = {
    id,
    topic,
    status: "pending",
    probeFindings: [],
    report: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  sessions.set(id, session);
  findings.set(id, []);
  return session;
}

export function getSession(id: string): ResearchSession | null {
  return sessions.get(id) || null;
}

export function updateSessionStatus(id: string, status: ResearchStatus): void {
  const session = sessions.get(id);
  if (session) {
    session.status = status;
    if (status === "completed" || status === "failed") {
      session.completedAt = new Date().toISOString();
    }
  }
}

export function addFinding(finding: ProbeFinding): void {
  const sessionFindings = findings.get(finding.sessionId);
  if (sessionFindings) {
    sessionFindings.push(finding);
  }
  const session = sessions.get(finding.sessionId);
  if (session) {
    session.probeFindings.push(finding);
  }
}

export function getFindings(sessionId: string): ProbeFinding[] {
  return findings.get(sessionId) || [];
}

export function setReport(sessionId: string, report: ResearchReport): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.report = report;
  }
}

export function getAllSessions(): ResearchSession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addToWatchlist(item: WatchlistItem): void {
  watchlist.set(item.id, item);
}

export function getWatchlist(): WatchlistItem[] {
  return Array.from(watchlist.values());
}

export function removeFromWatchlist(id: string): void {
  watchlist.delete(id);
}

export function updateWatchlistResearch(
  id: string,
  reportId: string
): void {
  const item = watchlist.get(id);
  if (item) {
    item.lastResearched = new Date().toISOString();
    item.lastReportId = reportId;
  }
}
