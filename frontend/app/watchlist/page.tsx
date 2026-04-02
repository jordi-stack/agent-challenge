"use client";

import { useState } from "react";
import { Eye, Plus, Trash2, RefreshCw, Clock, ExternalLink } from "lucide-react";
import { useLocalStorage } from "../lib/use-local-storage";
import { FloatingCard } from "../components/floating-card";
import { EmptyState } from "../components/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface WatchItem {
  id: string;
  name: string;
  lastResearched: string | null;
  confidence: number | null;
}

const DEFAULT_ITEMS: WatchItem[] = [
  { id: "1", name: "Nosana", lastResearched: "2026-03-30T01:00:00.000Z", confidence: 82 },
  { id: "2", name: "Jupiter DEX", lastResearched: null, confidence: null },
];

export default function WatchlistPage() {
  const [items, setItems] = useLocalStorage<WatchItem[]>("probe-watchlist", DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newItem.trim(), lastResearched: null, confidence: null },
    ]);
    setNewItem("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Eye className="w-7 h-7 text-[var(--accent)]" />
          Watchlist
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Track Web3 projects and get periodic intelligence updates
        </p>
      </div>

      {/* Add new */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add a project to watch..."
          className="flex-1 glass-card !rounded-full px-5 py-3 text-sm text-white placeholder-[var(--muted)] outline-none focus:!border-[var(--accent)] transition-colors"
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Eye className="w-6 h-6 text-[var(--accent)]" />}
          title="No Projects Tracked"
          description="Add Web3 projects to your watchlist to monitor them over time."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <FloatingCard>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {item.lastResearched
                          ? `Researched ${new Date(item.lastResearched).toLocaleDateString()}`
                          : "Not yet researched"}
                        {item.confidence && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px]">
                            {item.confidence}%
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/?topic=${encodeURIComponent(item.name)}`}
                      className="p-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                      title="Research this project"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-[var(--muted)] hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </FloatingCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
