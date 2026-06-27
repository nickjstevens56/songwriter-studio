"use client";

import React from "react";

type Props = { content: string; compact?: boolean };

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-semibold text-zinc-100">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={key++} className="italic text-zinc-300">{match[4]}</em>);
    else if (match[5]) parts.push(<code key={key++} className="bg-zinc-700/50 text-amber-300 text-xs px-1.5 py-0.5 rounded font-mono">{match[6]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function MarkdownMessage({ content, compact = false }: Props) {
  const textSize = compact ? "text-xs" : "text-sm";
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // HR
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="border-zinc-700 my-3" />);
      i++; continue;
    }

    // H1 / H2
    if (/^##?\s/.test(line)) {
      const text = line.replace(/^##?\s/, "");
      nodes.push(
        <p key={key++} className={`font-bold ${textSize} text-zinc-100 mt-4 mb-1`}>
          {parseInline(text)}
        </p>
      );
      i++; continue;
    }

    // H3
    if (/^###\s/.test(line)) {
      const text = line.replace(/^###\s/, "");
      nodes.push(
        <p key={key++} className={`font-semibold ${textSize} text-zinc-200 mt-3 mb-0.5`}>
          {parseInline(text)}
        </p>
      );
      i++; continue;
    }

    // Blockquote
    if (/^>\s/.test(line)) {
      const text = line.replace(/^>\s/, "");
      nodes.push(
        <blockquote key={key++} className="border-l-2 border-amber-500/50 pl-3 my-2 text-zinc-400 italic">
          <span className={textSize}>{parseInline(text)}</span>
        </blockquote>
      );
      i++; continue;
    }

    // Unordered list — collect consecutive list items
    if (/^[-*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[-*]\s/, "");
        items.push(
          <li key={i} className={`${textSize} leading-relaxed flex gap-2`}>
            <span className="text-amber-400 shrink-0 mt-0.5">•</span>
            <span>{parseInline(text)}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={key++} className="space-y-1 my-2 ml-1">{items}</ul>);
      continue;
    }

    // Ordered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, "");
        items.push(
          <li key={i} className={`${textSize} leading-relaxed flex gap-2`}>
            <span className="text-amber-400 shrink-0 font-medium">{num++}.</span>
            <span>{parseInline(text)}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ol key={key++} className="space-y-1 my-2 ml-1">{items}</ol>);
      continue;
    }

    // Plain paragraph
    nodes.push(
      <p key={key++} className={`${textSize} leading-relaxed mb-2`}>
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
}
