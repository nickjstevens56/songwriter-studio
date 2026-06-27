"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import MarkdownMessage from "@/components/MarkdownMessage";
import { AIMessage, StageKey } from "@/types";

const STAGE_PROMPTS: Record<StageKey, { label: string; prompts: string[] }> = {
  recording: {
    label: "Recording coach",
    prompts: [
      "How do I treat my home studio on a budget?",
      "What's the best mic position for acoustic guitar?",
      "How do I get a good vocal sound in a bedroom?",
      "What gain staging mistakes should I avoid?",
    ],
  },
  mixing: {
    label: "Mix engineer",
    prompts: [
      "Why does my mix sound muddy?",
      "How do I make vocals sit forward in the mix?",
      "What's the best order for EQ and compression?",
      "How should I use parallel compression on drums?",
    ],
  },
  mastering: {
    label: "Mastering engineer",
    prompts: [
      "What LUFS should I target for Spotify?",
      "When should I hire a mastering engineer?",
      "What's the difference between limiting and clipping?",
      "How do I know if my mix is ready to master?",
    ],
  },
};

type Props = {
  stage: StageKey;
  projectTitle: string;
};

export default function ProductionChat({ stage, projectTitle }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const info = STAGE_PROMPTS[stage];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: AIMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "production_chat",
          track: { stage, context: `Project: ${projectTitle}` },
          message: text,
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Check your API key and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles size={14} className="text-amber-400" />
        <span className="text-sm font-medium text-zinc-300">{info.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 mb-3">Common questions</p>
            {info.prompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full text-left text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 ${
                msg.role === "user"
                  ? "bg-amber-500/20 text-amber-100 rounded-br-sm text-xs leading-relaxed"
                  : "bg-zinc-800 text-zinc-300 rounded-bl-sm"
              }`}
            >
              {msg.role === "user" ? msg.content : <MarkdownMessage content={msg.content} compact />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-xl rounded-bl-sm px-3 py-2">
              <Loader2 size={13} className="text-zinc-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-zinc-800 p-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about production..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2 rounded-lg transition-colors"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </>
  );
}
