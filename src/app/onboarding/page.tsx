"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Music, Sparkles, Users, Headphones, Link2, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { saveUserProfile, DEFAULT_USER_PROFILE } from "@/lib/storage";
import { UserProfile, SoundCloudTrack } from "@/types";

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { label: "About you", icon: Music },
  { label: "Your goals", icon: Sparkles },
  { label: "Influences", icon: Users },
  { label: "Your work", icon: Headphones },
];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-12">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${active ? "text-amber-400" : done ? "text-zinc-400" : "text-zinc-600"}`}>
              {done ? <CheckCircle2 size={14} className="text-amber-500" /> : <Icon size={14} />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px transition-colors ${i < step ? "bg-amber-500/40" : "bg-zinc-800"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<Omit<UserProfile, "completed_onboarding" | "created_at" | "spotify_connected" | "spotify_snapshot">>({
    name: "",
    artist_bio: "",
    goals: "",
    core_influences: "",
    currently_listening: "",
    soundcloud_url: "",
    soundcloud_tracks: [],
  });
  const [scUrl, setScUrl] = useState("");
  const [scLoading, setScLoading] = useState(false);
  const [scError, setScError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() { setStep((s) => Math.min(s + 1, 4) as Step); }
  function back() { setStep((s) => Math.max(s - 1, 0) as Step); }

  function finish() {
    saveUserProfile({
      ...DEFAULT_USER_PROFILE,
      ...form,
      completed_onboarding: true,
      created_at: new Date().toISOString(),
    });
    router.push("/");
  }

  async function addScTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!scUrl.trim()) return;
    setScError("");
    setScLoading(true);
    try {
      const res = await fetch("/api/soundcloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setScError(data.error ?? "Could not fetch track."); return; }
      const track: SoundCloudTrack = {
        id: crypto.randomUUID(),
        url: scUrl.trim(),
        title: data.title,
        description: data.description,
        author: data.author,
      };
      setForm((prev) => ({ ...prev, soundcloud_tracks: [...prev.soundcloud_tracks, track] }));
      setScUrl("");
    } catch {
      setScError("Something went wrong. Check the URL and try again.");
    } finally {
      setScLoading(false);
    }
  }

  function removeScTrack(id: string) {
    setForm((prev) => ({ ...prev, soundcloud_tracks: prev.soundcloud_tracks.filter((t) => t.id !== id) }));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Songwriter Studio</h1>
          <p className="text-zinc-400 mt-1">Let&apos;s set up your artist profile.</p>
        </div>

        {step < 4 && <ProgressBar step={step} />}

        {/* Step 0: About you */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Who are you?</h2>
              <p className="text-zinc-400 text-sm">Tell us a bit about yourself as an artist. This helps the AI understand your voice and give you more relevant guidance.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Your name or artist name</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Nick, or your artist name"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Tell us about your music</label>
              <textarea
                value={form.artist_bio}
                onChange={(e) => update("artist_bio", e.target.value)}
                placeholder="What kind of music do you make? What's your story as a songwriter? How long have you been writing? What drew you to it?"
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">What are you looking for?</h2>
              <p className="text-zinc-400 text-sm">Understanding what you want to get out of this tool helps it give you more useful, targeted guidance.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">What do you want help with?</label>
              <textarea
                autoFocus
                value={form.goals}
                onChange={(e) => update("goals", e.target.value)}
                placeholder="e.g. I want to write more specifically and stop relying on vague imagery. I want to finish songs instead of leaving them half-done. I want to understand what makes my favorite writers tick and apply it to my own work."
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2: Influences */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">What inspires you?</h2>
              <p className="text-zinc-400 text-sm">Your influences shape how the AI coaches you — it'll analyze techniques from these artists and help you develop your own voice in relation to them.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Core influences</label>
              <textarea
                autoFocus
                value={form.core_influences}
                onChange={(e) => update("core_influences", e.target.value)}
                placeholder="Artists, songwriters, or albums that define how you think about music. Be specific — e.g. Joni Mitchell's Blue era, Elliott Smith's Either/Or, late Leonard Cohen."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Currently listening to</label>
              <textarea
                value={form.currently_listening}
                onChange={(e) => update("currently_listening", e.target.value)}
                placeholder="What's in heavy rotation right now? Albums, playlists, artists. This gives the AI a live picture of what you're absorbing."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 3: Existing work */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your existing work</h2>
              <p className="text-zinc-400 text-sm">Adding your existing music helps the AI understand your actual voice — not just your influences. Paste public SoundCloud track URLs and we&apos;ll pull the details automatically.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">SoundCloud profile</label>
              <div className="flex gap-2">
                <input
                  value={form.soundcloud_url}
                  onChange={(e) => update("soundcloud_url", e.target.value)}
                  placeholder="https://soundcloud.com/yourname"
                  className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Add your tracks</label>
              <form onSubmit={addScTrack} className="flex gap-2">
                <input
                  value={scUrl}
                  onChange={(e) => { setScUrl(e.target.value); setScError(""); }}
                  placeholder="https://soundcloud.com/yourname/track-name"
                  className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!scUrl.trim() || scLoading}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {scLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add
                </button>
              </form>
              {scError && <p className="text-xs text-red-400 mt-1.5">{scError}</p>}
              {form.soundcloud_tracks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.soundcloud_tracks.map((t) => (
                    <div key={t.id} className="group flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{t.title || t.url}</p>
                        {t.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{t.description}</p>}
                      </div>
                      <button onClick={() => removeScTrack(t.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {form.name ? `You're all set, ${form.name}.` : "You're all set."}
              </h2>
              <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Your profile is saved. The AI will use everything you've shared to give you coaching that's specific to your voice, your goals, and your influences. You can update it any time from your profile page.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left space-y-2 max-w-sm mx-auto">
              {form.name && <p className="text-sm text-zinc-300"><span className="text-zinc-600">Artist:</span> {form.name}</p>}
              {form.core_influences && <p className="text-sm text-zinc-300 line-clamp-1"><span className="text-zinc-600">Influences:</span> {form.core_influences}</p>}
              {form.soundcloud_tracks.length > 0 && <p className="text-sm text-zinc-300"><span className="text-zinc-600">Tracks added:</span> {form.soundcloud_tracks.length}</p>}
            </div>
            <button
              onClick={finish}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Start creating
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={back}
              className={`flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors ${step === 0 ? "invisible" : ""}`}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={next}
                className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
              >
                Skip
              </button>
              <button
                onClick={step === 3 ? next : next}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {step === 3 ? "Finish" : "Next"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
