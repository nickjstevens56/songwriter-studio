"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BookOpen, MessageSquare, FileText, ExternalLink } from "lucide-react";
import MarkdownMessage from "@/components/MarkdownMessage";
import { Track, AIMessage, UserProfile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { updateTrack } from "@/lib/db";
import Link from "next/link";

type Tab = "write" | "guidance" | "influences";

type Props = {
  track: Track;
  projectId: string;
  profile: UserProfile | null;
  onUpdate: () => void;
};

const QUICK_ACTIONS = [
  { label: "Analyze my influences", action: "analyze_influence", prompt: "Analyze every artist I've listed as an influence. Cover each one individually, then identify what they share and flag any that don't quite fit with the rest." },
  { label: "Develop my theme", action: "theme_guidance", prompt: "Help me go deeper on my theme. What angles haven't I considered? What imagery might work?" },
  { label: "Feedback on my lyrics", action: "lyric_feedback", prompt: "Give me honest feedback on what's working and what could be stronger in my lyrics." },
];

export default function TrackWorkspace({ track, projectId, profile, onUpdate }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("write");
  const [local, setLocal] = useState(track);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocal(track); }, [track.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function autosave(updates: Partial<Track>) {
    const next = { ...local, ...updates };
    setLocal(next);
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(async () => {
      await updateTrack(supabase, track.id, updates);
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
          profile,
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

  const hasProjectInfluences = profile?.core_influences || profile?.currently_listening || profile?.artist_bio || profile?.goals;

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
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-amber-500/20 text-amber-100 rounded-br-sm text-sm leading-relaxed"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? msg.content : <MarkdownMessage content={msg.content} />}
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
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Artist profile (read-only) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-amber-400" />
                <span className="text-sm font-medium text-zinc-200">Artist profile</span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
              >
                Edit <ExternalLink size={11} />
              </Link>
            </div>
            {hasProjectInfluences ? (
              <div className="space-y-3">
                {profile?.artist_bio && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">About</p>
                    <p className="text-sm text-zinc-400 line-clamp-3">{profile.artist_bio}</p>
                  </div>
                )}
                {profile?.goals && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Goals</p>
                    <p className="text-sm text-zinc-400 line-clamp-2">{profile.goals}</p>
                  </div>
                )}
                {profile?.core_influences && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Core influences</p>
                    <p className="text-sm text-zinc-400">{profile.core_influences}</p>
                  </div>
                )}
                {profile?.currently_listening && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Currently listening</p>
                    <p className="text-sm text-zinc-400">{profile.currently_listening}</p>
                  </div>
                )}
                {(profile?.soundcloud_tracks?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Your work</p>
                    <p className="text-sm text-zinc-400">{profile!.soundcloud_tracks.length} SoundCloud track{profile!.soundcloud_tracks.length !== 1 ? "s" : ""} linked</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">
                Artist profile is empty.{" "}
                <Link href="/profile" className="text-amber-500 hover:text-amber-400">
                  Set it up here
                </Link>{" "}
                — it informs the AI across all your tracks.
              </p>
            )}
          </div>

          {/* Track-specific additions */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
              Additional influences for this track
            </label>
            <p className="text-xs text-zinc-600 mb-2">Layered on top of your project influences. Use this for song-specific references — a particular album, an obscure artist, a mood that only applies here.</p>
            <textarea
              value={local.influences}
              onChange={(e) => autosave({ influences: e.target.value })}
              placeholder="e.g. Springsteen's Nebraska specifically, or Sufjan's Carrie & Lowell era..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Analyze button */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-amber-400" />
              <span className="text-sm font-medium text-zinc-300">Lyric analysis</span>
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Breaks down your influences — project-wide and track-specific — and connects the techniques to what you&apos;ve written.
            </p>
            <button
              onClick={() => {
                setTab("guidance");
                sendMessage(
                  "Analyze every artist I've listed as an influence. Cover each one individually, then identify what they share and flag any that don't quite fit with the rest.",
                  "analyze_influence"
                );
              }}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Sparkles size={14} /> Analyze all influences
            </button>
          </div>

          {/* Research a specific artist */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-amber-400" />
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
