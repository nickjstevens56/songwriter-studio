export type ProjectProfile = {
  core_influences: string;
  currently_listening: string;
  aesthetic_notes: string;
};

export type Project = {
  id: string;
  title: string;
  type: "album" | "ep" | "single";
  description: string;
  created_at: string;
  tracks: Track[];
  profile: ProjectProfile;
};

export type Track = {
  id: string;
  project_id: string;
  title: string;
  order: number;
  theme: string;
  mood: string;
  influences: string;
  lyrics: string;
  notes: string;
  created_at: string;
};

export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChecklistItem = {
  id: string;
  done: boolean;
};

export type ProductionProgress = {
  recording: Record<string, boolean>;
  mixing: Record<string, boolean>;
  mastering: Record<string, boolean>;
};

export type StageKey = "recording" | "mixing" | "mastering";
