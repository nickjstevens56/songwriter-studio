export type UserProfile = {
  name: string;
  artist_bio: string;
  goals: string;
  core_influences: string;
  currently_listening: string;
  soundcloud_url: string;
  soundcloud_tracks: SoundCloudTrack[];
  spotify_connected: boolean;
  spotify_snapshot: SpotifySnapshot | null;
  completed_onboarding: boolean;
  created_at: string;
};

export type SpotifyTrack = {
  name: string;
  artists: string[];
};

export type SpotifyArtist = {
  name: string;
  genres: string[];
};

export type SpotifySnapshot = {
  top_tracks: SpotifyTrack[];
  top_artists: SpotifyArtist[];
  recently_played: SpotifyTrack[];
  synced_at: string;
};

export type SoundCloudTrack = {
  id: string;
  url: string;
  title: string;
  description: string;
  author: string;
};

export type ProjectProfile = {
  core_influences: string;
  currently_listening: string;
  aesthetic_notes: string;
  soundcloud_url: string;
  soundcloud_tracks: SoundCloudTrack[];
  spotify_connected: boolean;
  spotify_snapshot: SpotifySnapshot | null;
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
