"use client";

import { useState } from "react";
import { History, Search, Clock, FileText } from "lucide-react";
import { FloatingCard } from "../components/floating-card";
import { ReportDrawer } from "../components/report-drawer";
import { EmptyState } from "../components/empty-state";
import { useLocalStorage } from "../lib/use-local-storage";
import { motion } from "framer-motion";

interface ResearchEntry {
  id: string;
  topic: string;
  status: string;
  confidence: number;
  createdAt: string;
  report: string;
}

const PROBES = [
  { label: "SCOUT", color: "#22d3ee" },
  { label: "ANALYST", color: "#a78bfa" },
  { label: "SENTINEL", color: "#f59e0b" },
];

export default function HistoryPage() {
  const [entries] = useLocalStorage<ResearchEntry[]>("probe-history", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerEntry, setDrawerEntry] = useState<ResearchEntry | null>(null);

  const filtered = entries.filter((e) =>
    e.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <History className="w-7 h-7 text-[var(--accent)]" />
          Research History
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Your Web3 intelligence archive
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center glass-card !rounded-full px-4 py-3">
        <Search className="w-4 h-4 text-[var(--muted)] mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search research history..."
          className="flex-1 bg-transparent text-white placeholder-[var(--muted)] outline-none text-sm"
        />
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6 text-[var(--accent)]" />}
          title="No Research Yet"
          description="Start researching Web3 topics to build your intelligence archive."
          ctaLabel="Start Research"
          ctaHref="/"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <FloatingCard>
                <button
                  onClick={() => setDrawerEntry(entry)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">{entry.topic}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex-shrink-0 ml-2">
                      {entry.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] opacity-70 line-clamp-2 mb-3">
                    {entry.report.replace(/[#*_\[\]]/g, "").slice(0, 120)}...
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.createdAt.split("T")[0]}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      {PROBES.map((p) => (
                        <div key={p.label} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      ))}
                    </div>
                  </div>
                </button>
              </FloatingCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Drawer */}
      {drawerEntry && (
        <ReportDrawer
          open={!!drawerEntry}
          onClose={() => setDrawerEntry(null)}
          title={drawerEntry.topic}
          content={drawerEntry.report}
          confidence={drawerEntry.confidence}
          probes={PROBES}
        />
      )}
    </div>
  );
}
