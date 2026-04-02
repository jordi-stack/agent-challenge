"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-white mb-2 mt-3">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-3">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm text-[var(--foreground)] mb-3 space-y-1 list-none">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm text-[var(--foreground)] mb-3 space-y-1 list-decimal pl-4">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex gap-2">
            <span className="text-[var(--accent)] mt-1.5 flex-shrink-0">
              <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor" /></svg>
            </span>
            <span>{children}</span>
          </li>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-4 mb-3 overflow-x-auto">
                <code className="text-xs text-[var(--foreground)] font-mono">{children}</code>
              </pre>
            );
          }
          return (
            <code className="text-xs bg-[var(--card-border)] px-1.5 py-0.5 rounded text-[var(--accent)] font-mono">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--accent)] pl-4 py-1 mb-3 opacity-80">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="text-xs border border-[var(--card-border)] rounded-lg w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 bg-[var(--card)] text-white font-medium border-b border-[var(--card-border)]">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-[var(--foreground)] border-b border-[var(--card-border)]">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
