"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, GripVertical, Sliders, Users } from "lucide-react";
import { Project, Track, UserProfile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getProject, createTrack, deleteTrack, getUserProfile } from "@/lib/db";
import Link from "next/link";
import TrackWorkspace from "@/components/TrackWorkspace";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [addingTrack, setAddingTrack] = useState(false);

  const supabase = createClient();

  async function reload() {
    const p = await getProject(supabase, id);
    if (!p) { router.push("/"); return; }
    setProject(p);
    if (activeTrack) {
      const refreshed = p.tracks.find((t) => t.id === activeTrack.id);
      setActiveTrack(refreshed ?? null);
    }
  }

  useEffect(() => {
    Promise.all([reload(), getUserProfile(supabase)]).then(([, profile]) => {
      setUserProfile(profile);
    });
  }, [id]);

  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    await createTrack(supabase, id, newTrackTitle.trim());
    setNewTrackTitle("");
    setAddingTrack(false);
    reload();
  }

  async function handleDeleteTrack(trackId: string) {
    if (!confirm("Delete this track?")) return;
    await deleteTrack(supabase, trackId);
    if (activeTrack?.id === trackId) setActiveTrack(null);
    reload();
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-amber-500">{project.type}</span>
            <h1 className="text-lg font-semibold leading-tight">{project.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
          >
            <Users size={14} /> Artist Profile
          </Link>
          <Link
            href={`/projects/${id}/produce`}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
          >
            <Sliders size={14} /> Production Guide
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Track list sidebar */}
        <aside className="w-64 border-r border-zinc-800 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">Tracks</span>
            <button
              onClick={() => setAddingTrack(true)}
              className="text-zinc-400 hover:text-amber-400 transition-colors"
              title="Add track"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {project.tracks.map((track, i) => (
              <div
                key={track.id}
                className={`group flex items-center gap-2 px-3 py-3 cursor-pointer border-b border-zinc-800/50 transition-colors ${
                  activeTrack?.id === track.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
                onClick={() => setActiveTrack(track)}
              >
                <GripVertical size={14} className="text-zinc-700 shrink-0" />
                <span className="text-xs text-zinc-600 w-4 shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{track.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTrack(track.id); }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {addingTrack && (
              <form onSubmit={handleAddTrack} className="p-3 border-b border-zinc-800 space-y-2">
                <input
                  autoFocus
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder="Track title..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingTrack(false); setNewTrackTitle(""); }}
                    className="flex-1 text-zinc-500 hover:text-zinc-300 text-xs py-1.5 rounded border border-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {project.tracks.length === 0 && !addingTrack && (
              <div className="p-6 text-center text-zinc-600 text-sm">
                No tracks yet.
                <br />
                <button onClick={() => setAddingTrack(true)} className="text-amber-500 hover:text-amber-400 mt-2 block mx-auto">
                  Add your first track
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main workspace */}
        <main className="flex-1 overflow-y-auto">
          {activeTrack ? (
            <TrackWorkspace
              track={activeTrack}
              projectId={id}
              profile={userProfile}
              onUpdate={reload}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center">
                <p className="text-lg">Select a track to start writing</p>
                <p className="text-sm mt-1">or add a new track from the sidebar</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
