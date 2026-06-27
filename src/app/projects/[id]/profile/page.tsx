"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Headphones, Palette } from "lucide-react";
import Link from "next/link";
import { getProject, updateProfile } from "@/lib/storage";
import { Project } from "@/types";

type Profile = Project["profile"];

const FIELDS: {
  key: keyof Profile;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "core_influences",
    label: "Core influences",
    icon: Users,
    placeholder: "e.g. Joni Mitchell, Elliott Smith, Gillian Welch — be specific about eras or albums where it helps",
    hint: "Artists whose writing, sound, or approach shapes how you think about this project.",
  },
  {
    key: "currently_listening",
    label: "Currently listening to",
    icon: Headphones,
    placeholder: "e.g. Adrianne Lenker – Bright Future, Bill Callahan – Apocalypse, early Sufjan Stevens",
    hint: "What's in rotation right now — albums, songs, or artists that are feeding this project.",
  },
  {
    key: "aesthetic_notes",
    label: "Aesthetic & vibe",
    icon: Palette,
    placeholder: "e.g. Late-night, sparse arrangements, confessional but not self-pitying. Think: Tom Waits meets Carole King.",
    hint: "Free-form: mood board in words, the feeling you're chasing, what you want the project to sound like and feel like.",
  },
];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState<Profile>({ core_influences: "", currently_listening: "", aesthetic_notes: "" });
  const [saved, setSaved] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push("/"); return; }
    setProject(p);
    setForm(p.profile ?? { core_influences: "", currently_listening: "", aesthetic_notes: "" });
  }, [id]);

  function handleChange(key: keyof Profile, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setSaved(false);
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(() => {
      updateProfile(id, next);
      setSaved(true);
    }, 600);
    setSaveTimeout(t);
  }

  if (!project) return null;

  const hasContent = Object.values(form).some((v) => v.trim());

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

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-zinc-400 leading-relaxed">
            Set your project-wide influences here. These inform the AI across all tracks — every coaching response, lyric analysis, and feedback session starts from this foundation. You can add track-specific influences on top of these from within each track.
          </p>
        </div>

        {FIELDS.map(({ key, label, icon: Icon, placeholder, hint }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={15} className="text-amber-400" />
              <label className="text-sm font-medium text-zinc-200">{label}</label>
            </div>
            <p className="text-xs text-zinc-500 mb-2">{hint}</p>
            <textarea
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-colors"
            />
          </div>
        ))}

        {hasContent && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">How this gets used</p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2"><span className="text-amber-400">•</span> Lyric feedback references your core influences when pointing out techniques</li>
              <li className="flex gap-2"><span className="text-amber-400">•</span> Theme guidance uses your aesthetic notes to suggest relevant imagery</li>
              <li className="flex gap-2"><span className="text-amber-400">•</span> Influence analysis covers everyone here plus any track-specific additions</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
