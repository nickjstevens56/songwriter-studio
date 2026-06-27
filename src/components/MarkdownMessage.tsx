"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownMessage({ content, compact = false }: { content: string; compact?: boolean }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <p className={`font-bold ${compact ? "text-xs" : "text-sm"} text-zinc-100 mt-3 mb-1`}>{children}</p>,
        h2: ({ children }) => <p className={`font-bold ${compact ? "text-xs" : "text-sm"} text-zinc-100 mt-3 mb-1`}>{children}</p>,
        h3: ({ children }) => <p className={`font-semibold ${compact ? "text-xs" : "text-sm"} text-zinc-200 mt-2 mb-0.5`}>{children}</p>,
        p: ({ children }) => <p className={`${compact ? "text-xs" : "text-sm"} leading-relaxed mb-2 last:mb-0`}>{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
        ul: ({ children }) => <ul className="space-y-1 my-2 ml-1">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1 my-2 ml-1 list-decimal list-inside">{children}</ol>,
        li: ({ children }) => (
          <li className={`${compact ? "text-xs" : "text-sm"} leading-relaxed flex gap-2`}>
            <span className="text-amber-400 shrink-0 mt-0.5">•</span>
            <span>{children}</span>
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-amber-500/50 pl-3 my-2 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-zinc-700/50 text-amber-300 text-xs px-1.5 py-0.5 rounded font-mono">
            {children}
          </code>
        ),
        hr: () => <hr className="border-zinc-700 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
