"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BookOpen, MessageSquare, FileText } from "lucide-react";
import { Track, AIMessage } from "@/types";
import { updateTrack } from "@/lib/storage";

type Tab = "write" | "guidance" | "influences";

type Props = {
  track: Track;
  projectId: string;
  onUpdate: () => void;
};

const QUICK_ACTIONS = [
  { label: "Analyze my influences", action: "analyze_influence", prompt: "Analyze the lyrical style, techniques, and signature approaches of my listed influences. What makes them tick?" },
  { label: "Develop my theme", action: "theme_guidance", prompt: "Help me go deeper on my theme. What angles haven't I considered? What imagery might work?" },
  { label: "Feedback on my lyrics", action: "lyric_feedback", prompt: "Give me honest feedback on what's working and what could be stronger in my lyrics." },
];

export default function TrackWorkspace({ track, projectId, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("write");
  const [local, setLocal] = useState(track);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(track);
  }, [track.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autosave(updates: Partial<Track>) {
    const next = { ...local, ...updates };
    setLocal(next);
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(() => {
      updateTrack(projectId, track.id, updates);
      onUpdate();
    }, 800);
    setSaveTimeout(t);
  }

  async function sendMessage(messageText: string, action = "chat") {
    if (!messageText.trim() || loading) return;
    const userMsg: AIMessage = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          track: local,
          message: messageText,
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Something went wrong. Check your API key and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(qa: typeof QUICK_ACTIONS[0]) {
    setTab("guidance");
    sendMessage(qa.prompt, qa.action);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Track header */}
      <div className="border-b border-zinc-800 px-8 pt-6 pb-0">
        <h2 className="text-2xl font-bold mb-4">{track.title}</h2>
        <div className="flex gap-6 text-sm">
          {(["write", "guidance", "influences"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 border-b-2 capitalize font-medium transition-colors ${
                tab === t
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "write" && <FileText size={14} className="inline mr-1.5 -mt-0.5" />}
              {t === "guidance" && <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />}
              {t === "influences" && <BookOpen size={14} className="inline mr-1.5 -mt-0.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Write */}
      {tab === "write" && (
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">Theme / What it&apos;s about</label>
              <input
                value={local.theme}
                onChange={(e) => autosave({ theme: e.target.value })}
                placeholder="What is this song about at its core?"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">Mood / Feeling</label>
              <input
                value={local.mood}
                onChange={(e) => autosave({ mood: e.target.value })}
                placeholder="e.g. bittersweet, urgent, melancholic"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">Lyrics</label>
            <textarea
              value={local.lyrics}
              onChange={(e) => autosave({ lyrics: e.target.value })}
              placeholder="Write your lyrics here..."
              rows={18}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea
              value={local.notes}
              onChange={(e) => autosave({ notes: e.target.value })}
              placeholder="Chord ideas, structural notes, things to try..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Quick actions */}
          <div className="pt-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">AI guidance</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleQuickAction(qa)}
                  className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 hover:text-amber-400 text-zinc-400 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Sparkles size={13} />
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Guidance (AI chat) */}
      {tab === "guidance" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles size={32} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-zinc-500">Your AI songwriting coach is ready.</p>
                <p className="text-zinc-600 text-sm mt-1">Ask for theme exploration, feedback, or use the quick actions below.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.prompt, qa.action)}
                      className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 hover:text-amber-400 text-zinc-400 text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-amber-500/20 text-amber-100 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="text-zinc-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-zinc-800 px-8 py-4">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach anything..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2.5 rounded-xl transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Influences */}
      {tab === "influences" && (
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">Artists / Writers who influence this song</label>
            <textarea
              value={local.influences}
              onChange={(e) => autosave({ influences: e.target.value })}
              placeholder="e.g. Phoebe Bridgers, early Bob Dylan, Leonard Cohen — be specific about which era or albums"
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-zinc-300">Lyric analysis</span>
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Add your influences above, then ask the AI to break down what makes their writing work — and how you can apply those techniques to your own song.
            </p>
            <button
              onClick={() => {
                setTab("guidance");
                sendMessage(
                  `Analyze the lyrical style and techniques of these artists: ${local.influences || "my listed influences"}. Break down what makes their writing distinctive — specific devices, imagery patterns, structural choices — and suggest how I can incorporate those approaches into my own writing without imitating them.`,
                  "analyze_influence"
                );
              }}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Sparkles size={14} /> Analyze my influences
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-zinc-300">Research a specific artist</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const target = e.currentTarget.elements.namedItem("artist") as HTMLInputElement;
                if (!target.value.trim()) return;
                setTab("guidance");
                sendMessage(`Do a deep dive on ${target.value.trim()} as a lyricist. What are their signature techniques? How do they build imagery, develop themes, and structure their songs? What can I learn from them as a writer?`, "analyze_influence");
                target.value = "";
              }}
              className="flex gap-3"
            >
              <input
                name="artist"
                placeholder="Artist name..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Research
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
