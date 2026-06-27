"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getUserProfile, updateUserProfile } from "@/lib/storage";
import { UserProfile, SoundCloudTrack } from "@/types";

type Field = { key: keyof UserProfile; label: string; placeholder: string; hint: string; rows: number };

const FIELDS: Field[] = [
  { key: "name", label: "Artist name", placeholder: "Your name or artist name", hint: "", rows: 1 },
  { key: "artist_bio", label: "About you", placeholder: "What kind of music do you make? Your background as a songwriter.", hint: "Used by the AI to understand your voice and tailor all feedback to who you are as an artist.", rows: 4 },
  { key: "goals", label: "What you're looking for", placeholder: "What do you want to get better at? What problems are you trying to solve?", hint: "Helps the AI focus its coaching on what actually matters to you.", rows: 3 },
  { key: "core_influences", label: "Core influences", placeholder: "Artists, albums, or eras that shape how you think about music.", hint: "The AI analyzes these to help you understand techniques and apply them to your own writing.", rows: 3 },
  { key: "currently_listening", label: "Currently listening to", placeholder: "What's in heavy rotation right now?", hint: "Gives the AI a live picture of what you're absorbing.", rows: 2 },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [scUrl, setScUrl] = useState("");
  const [scLoading, setScLoading] = useState(false);
  const [scError, setScError] = useState("");

  useEffect(() => {
    const p = getUserProfile();
    if (p) setProfile(p);
  }, []);

  function handleChange(key: keyof UserProfile, value: string) {
    if (!profile) return;
    const next = { ...profile, [key]: value };
    setProfile(next);
    setSaved(false);
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(() => {
      updateUserProfile({ [key]: value });
      setSaved(true);
    }, 600);
    setSaveTimeout(t);
  }

  async function addScTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!scUrl.trim() || !profile) return;
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
      const updated = [...(profile.soundcloud_tracks ?? []), track];
      setProfile((prev) => prev ? { ...prev, soundcloud_tracks: updated } : prev);
      updateUserProfile({ soundcloud_tracks: updated });
      setScUrl("");
    } catch {
      setScError("Something went wrong. Check the URL and try again.");
    } finally {
      setScLoading(false);
    }
  }

  function removeScTrack(id: string) {
    if (!profile) return;
    const updated = profile.soundcloud_tracks.filter((t) => t.id !== id);
    setProfile((prev) => prev ? { ...prev, soundcloud_tracks: updated } : prev);
    updateUserProfile({ soundcloud_tracks: updated });
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-semibold">Artist Profile</h1>
        </div>
        <span className={`text-xs transition-opacity ${saved ? "text-emerald-400 opacity-100" : "opacity-0"}`}>Saved</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <p className="text-zinc-400 text-sm leading-relaxed">
          This is your global artist profile. Everything here informs the AI across all your projects — it understands who you are, what you&apos;re working toward, and what shapes your writing.
        </p>

        {/* Text fields */}
        {FIELDS.map(({ key, label, placeholder, hint, rows }) => (
          <div key={key as string}>
            <label className="block text-sm font-medium text-zinc-200 mb-1">{label}</label>
            {hint && <p className="text-xs text-zinc-500 mb-2">{hint}</p>}
            {rows === 1 ? (
              <input
                value={(profile[key] as string) ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
            ) : (
              <textarea
                value={(profile[key] as string) ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            )}
          </div>
        ))}

        <hr className="border-zinc-800" />

        {/* SoundCloud */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">SoundCloud profile</label>
            <p className="text-xs text-zinc-500 mb-2">Your SoundCloud page, used as a reference across the app.</p>
            <div className="flex gap-2">
              <input
                value={profile.soundcloud_url ?? ""}
                onChange={(e) => handleChange("soundcloud_url", e.target.value)}
                placeholder="https://soundcloud.com/yourname"
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
              {profile.soundcloud_url && (
                <a href={profile.soundcloud_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center border border-zinc-700 px-3 rounded-xl text-zinc-400 hover:text-orange-400 transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">Your tracks</label>
            <p className="text-xs text-zinc-500 mb-2">Paste public SoundCloud track URLs — the AI reads the titles and descriptions to understand your own musical voice.</p>
            <form onSubmit={addScTrack} className="flex gap-2">
              <input
                value={scUrl}
                onChange={(e) => { setScUrl(e.target.value); setScError(""); }}
                placeholder="https://soundcloud.com/yourname/track-name"
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
              />
              <button type="submit" disabled={!scUrl.trim() || scLoading}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                {scLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
              </button>
            </form>
            {scError && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {scError}</p>}
            {(profile.soundcloud_tracks ?? []).length > 0 && (
              <div className="mt-3 space-y-2">
                {profile.soundcloud_tracks.map((track) => (
                  <div key={track.id} className="group flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <a href={track.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-zinc-200 hover:text-orange-400 transition-colors truncate block">
                        {track.title || track.url}
                      </a>
                      {track.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{track.description}</p>}
                    </div>
                    <button onClick={() => removeScTrack(track.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
