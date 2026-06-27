import { Project, Track, ProductionProgress, StageKey } from "@/types";

const PROJECTS_KEY = "songwriter_projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function createProject(data: Pick<Project, "title" | "type" | "description">): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    ...data,
    tracks: [],
    created_at: new Date().toISOString(),
  };
  const projects = getProjects();
  saveProjects([...projects, project]);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects().map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveProjects(projects);
}

export function createTrack(projectId: string, title: string): Track {
  const projects = getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");

  const track: Track = {
    id: crypto.randomUUID(),
    project_id: projectId,
    title,
    order: project.tracks.length,
    theme: "",
    mood: "",
    influences: "",
    lyrics: "",
    notes: "",
    created_at: new Date().toISOString(),
  };

  project.tracks.push(track);
  saveProjects(projects);
  return track;
}

export function updateTrack(projectId: string, trackId: string, updates: Partial<Track>): void {
  const projects = getProjects().map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      tracks: p.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    };
  });
  saveProjects(projects);
}

const PRODUCTION_KEY = "songwriter_production";

export function getProductionProgress(projectId: string): ProductionProgress {
  if (typeof window === "undefined") return { recording: {}, mixing: {}, mastering: {} };
  const raw = localStorage.getItem(`${PRODUCTION_KEY}_${projectId}`);
  return raw ? JSON.parse(raw) : { recording: {}, mixing: {}, mastering: {} };
}

export function setChecklistItem(projectId: string, stage: StageKey, itemId: string, done: boolean): void {
  const progress = getProductionProgress(projectId);
  progress[stage][itemId] = done;
  localStorage.setItem(`${PRODUCTION_KEY}_${projectId}`, JSON.stringify(progress));
}

export function deleteTrack(projectId: string, trackId: string): void {
  const projects = getProjects().map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) };
  });
  saveProjects(projects);
}
