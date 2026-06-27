"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Users, Headphones, Palette, Music2, RefreshCw, Unlink, ExternalLink, AlertCircle, CheckCircle2, Link2 } from "lucide-react";
import Link from "next/link";
import { getProject, updateProfile } from "@/lib/storage";
import { Project, ProjectProfile, SpotifySnapshot } from "@/types";

type WritableField = "core_influences" | "currently_listening" | "aesthetic_notes" | "soundcloud_url";

const TEXT_FIELDS: {
  key: WritableField;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "core_influences",
    label: "Core influences",
    icon: Users,
    placeholder: "e.g. Joni Mitchell, Elliott Smith, Gillian Welch — be specific about eras or albums",
    hint: "Artists whose writing, sound, or approach shapes how you think about this project.",
    rows: 3,
  },
  {
    key: "currently_listening",
    label: "Currently listening to",
    icon: Headphones,
    placeholder: "e.g. Adrianne Lenker – Bright Future, Bill Callahan – Apocalypse",
    hint: "What's in rotation right now. Your Spotify data below fills this in automatically if connected.",
    rows: 2,
  },
  {
    key: "aesthetic_notes",
    label: "Aesthetic & vibe",
    icon: Palette,
    placeholder: "e.g. Late-night, sparse arrangements, confessional but not self-pitying.",
    hint: "Free-form mood board — the feeling you're chasing, what you want the project to sound like.",
    rows: 3,
  },
];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectProfile>({
    core_influences: "",
    currently_listening: "",
    aesthetic_notes: "",
    soundcloud_url: "",
    spotify_connected: false,
    spotify_snapshot: null,
  });
  const [saved, setSaved] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<"idle" | "connected" | "error" | "denied">("idle");

  const fetchSpotifyData = useCallback(async () => {
    setSpotifyLoading(true);
    try {
      const res = await fetch("/api/spotify/data");
      const data = await res.json();
      if (data.connected && data.snapshot) {
        const updates = { spotify_connected: true, spotify_snapshot: data.snapshot as SpotifySnapshot };
        setForm((prev) => ({ ...prev, ...updates }));
        updateProfile(id, updates);
        setSpotifyStatus("connected");
      } else {
        const updates = { spotify_connected: false, spotify_snapshot: null };
        setForm((prev) => ({ ...prev, ...updates }));
        updateProfile(id, updates);
        setSpotifyStatus("idle");
      }
    } catch {
      setSpotifyStatus("error");
    } finally {
      setSpotifyLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push("/"); return; }
    setProject(p);
    const profile = p.profile ?? { core_influences: "", currently_listening: "", aesthetic_notes: "", soundcloud_url: "", spotify_connected: false, spotify_snapshot: null };
    setForm(profile);
    if (profile.spotify_connected) setSpotifyStatus("connected");

    const spotifyParam = searchParams.get("spotify");
    if (spotifyParam === "connected") fetchSpotifyData();
    else if (spotifyParam === "denied") setSpotifyStatus("denied");
    else if (spotifyParam === "error") setSpotifyStatus("error");
  }, [id, searchParams, fetchSpotifyData]);

  function handleChange(key: WritableField, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setSaved(false);
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(() => {
      updateProfile(id, { [key]: value });
      setSaved(true);
    }, 600);
    setSaveTimeout(t);
  }

  async function handleDisconnect() {
    await fetch("/api/spotify/disconnect", { method: "POST" });
    const updates = { spotify_connected: false, spotify_snapshot: null };
    setForm((prev) => ({ ...prev, ...updates }));
    updateProfile(id, updates);
    setSpotifyStatus("idle");
  }

  const spotifyConfigured = !!process.env.NEXT_PUBLIC_SPOTIFY_ENABLED;

  if (!project) return null;

  const snapshot = form.spotify_snapshot;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${id}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs text-zinc-500">{project.title}</p>
            <h1 className="text-lg font-semibold leading-tight">Project Influences</h1>
          </div>
        </div>
        <span className={`text-xs transition-opacity ${saved ? "text-emerald-400 opacity-100" : "opacity-0"}`}>
          Saved
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Manual text fields */}
        <div className="space-y-7">
          {TEXT_FIELDS.map(({ key, label, icon: Icon, placeholder, hint, rows }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={15} className="text-amber-400" />
                <label className="text-sm font-medium text-zinc-200">{label}</label>
              </div>
              <p className="text-xs text-zinc-500 mb-2">{hint}</p>
              <textarea
                value={form[key] as string}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="border-zinc-800" />

        {/* Spotify */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Music2 size={15} className="text-green-400" />
            <span className="text-sm font-medium text-zinc-200">Spotify</span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Connect your Spotify account to automatically pull in your top tracks and recently played music. This gives the AI a live picture of your listening and informs the songwriting guidance.
          </p>

          {!form.spotify_connected ? (
            <div className="space-y-3">
              <a
                href={`/api/spotify/auth?projectId=${id}`}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Music2 size={15} /> Connect Spotify
              </a>
              {spotifyStatus === "denied" && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5"><AlertCircle size={13} /> Authorization was cancelled.</p>
              )}
              {spotifyStatus === "error" && (
                <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={13} /> Something went wrong. Check that your Spotify credentials are set in Vercel.</p>
              )}
              {!spotifyConfigured && (
                <p className="text-xs text-amber-500/80 flex items-center gap-1.5 mt-1">
                  <AlertCircle size={13} /> Spotify credentials not yet configured in Vercel environment variables.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle2 size={15} /> Connected
                </span>
                <button
                  onClick={() => fetchSpotifyData()}
                  disabled={spotifyLoading}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <RefreshCw size={12} className={spotifyLoading ? "animate-spin" : ""} />
                  {spotifyLoading ? "Syncing…" : "Refresh"}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors ml-auto"
                >
                  <Unlink size={12} /> Disconnect
                </button>
              </div>

              {snapshot && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                  {snapshot.top_tracks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Top tracks (last 4 weeks)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.top_tracks.slice(0, 10).map((t, i) => (
                          <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                            {t.name} <span className="text-zinc-600">· {t.artists[0]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.top_artists.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Top artists</p>
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.top_artists.map((a, i) => (
                          <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.top_artists.flatMap(a => a.genres).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Genres in rotation</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set(snapshot.top_artists.flatMap(a => a.genres))].slice(0, 12).map((g, i) => (
                          <span key={i} className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded-md">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-zinc-600">
                    Last synced {new Date(snapshot.synced_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SoundCloud */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link2 size={15} className="text-orange-400" />
            <span className="text-sm font-medium text-zinc-200">SoundCloud</span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">
            Add your SoundCloud profile URL as a reference. This is stored with your project and included as context for the AI.
          </p>
          <div className="flex gap-2">
            <input
              value={form.soundcloud_url}
              onChange={(e) => handleChange("soundcloud_url", e.target.value)}
              placeholder="https://soundcloud.com/yourname"
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
            />
            {form.soundcloud_url && (
              <a
                href={form.soundcloud_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-orange-400 border border-zinc-700 px-3 py-2 rounded-xl transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* How it gets used */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">How this informs the AI</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2"><span className="text-amber-400">•</span> Core influences shape lyric feedback and technique analysis</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Aesthetic notes guide theme and imagery suggestions</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Spotify top tracks and genres give the AI a live picture of what you&apos;re absorbing right now</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> All of this combines with per-track influences for fully contextual coaching</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
