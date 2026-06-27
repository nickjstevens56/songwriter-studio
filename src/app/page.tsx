"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Music, Disc3, Radio, UserCircle, LogOut } from "lucide-react";
import { Project } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getProjects, createProject } from "@/lib/db";
import Link from "next/link";

const PROJECT_TYPES = [
  { value: "album", label: "Album", icon: Disc3, desc: "Full-length release (7+ tracks)" },
  { value: "ep", label: "EP", icon: Music, desc: "Extended play (3–6 tracks)" },
  { value: "single", label: "Single", icon: Radio, desc: "One or two tracks" },
] as const;

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profileName, setProfileName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "ep" as Project["type"], description: "" });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function load() {
    const [{ data: { user } }, ps] = await Promise.all([
      supabase.auth.getUser(),
      getProjects(supabase),
    ]);
    if (!user) { router.replace("/login"); return; }
    const { data: profile } = await supabase.from("user_profiles").select("name, completed_onboarding").eq("id", user.id).single();
    if (!profile?.completed_onboarding) { router.replace("/onboarding"); return; }
    setProfileName(profile?.name ?? "");
    setProjects(ps);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createProject(supabase, form);
    setProjects(await getProjects(supabase));
    setShowNew(false);
    setForm({ title: "", type: "ep", description: "" });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Songwriter Studio</h1>
            <p className="text-zinc-400 mt-2">Build your recording project from first idea to distribution.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 rounded-lg transition-colors"
            >
              <UserCircle size={16} />
              {profileName || "Artist Profile"}
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-2.5 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {projects.length === 0 && !showNew && (
          <div className="border border-dashed border-zinc-700 rounded-2xl p-16 text-center">
            <Music size={40} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-lg">No projects yet.</p>
            <p className="text-zinc-600 mt-1">Start by creating your first album, EP, or single.</p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-6 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Create a project
            </button>
          </div>
        )}

        {showNew && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">New project</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Project title</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Letters from the Road"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {PROJECT_TYPES.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, type: value })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                        form.type === value
                          ? "border-amber-500 bg-amber-500/10 text-amber-400"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}
                    >
                      <Icon size={22} />
                      <span className="font-medium text-sm">{label}</span>
                      <span className="text-xs text-zinc-500 text-center">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Description / vision (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this project about? What do you want listeners to feel?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Create project
                </button>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="text-zinc-400 hover:text-zinc-200 px-4 py-2.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 flex items-center justify-between transition-colors"
            >
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-amber-500">
                  {project.type}
                </span>
                <h2 className="text-xl font-semibold mt-1">{project.title}</h2>
                {project.description && (
                  <p className="text-zinc-400 text-sm mt-1 line-clamp-1">{project.description}</p>
                )}
                <p className="text-zinc-600 text-xs mt-2">
                  {project.tracks.length} track{project.tracks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-xl">→</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
