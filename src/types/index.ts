export type ProbeType = "scout" | "analyst" | "sentinel";

export type ResearchStatus =
  | "pending"
  | "probes_dispatched"
  | "scout_complete"
  | "analyst_complete"
  | "sentinel_complete"
  | "synthesizing"
  | "completed"
  | "failed";

export interface ProbeQuery {
  probeType: ProbeType;
  query: string;
  systemPrompt: string;
}

export interface ProbeFinding {
  id: string;
  sessionId: string;
  probeType: ProbeType;
  query: string;
  findings: string;
  sources: string[];
  confidence: number;
  createdAt: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  status: ResearchStatus;
  probeFindings: ProbeFinding[];
  report: ResearchReport | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ResearchReport {
  summary: string;
  sections: ReportSection[];
  overallConfidence: number;
  metadata: {
    topic: string;
    probesUsed: ProbeType[];
    totalSources: number;
    generatedAt: string;
  };
}

export interface ReportSection {
  title: string;
  source: ProbeType;
  content: string;
  confidence: number;
  keyFindings: string[];
}

export interface InfraMetrics {
  uptime: number;
  requestCount: number;
  avgLatency: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  model: string;
  endpoint: string;
  nodeEnv: string;
  startedAt: string;
}

export interface WatchlistItem {
  id: string;
  projectName: string;
  lastResearched: string | null;
  lastReportId: string | null;
  createdAt: string;
}
