import { SupabaseClient } from "@supabase/supabase-js";
import { UserProfile, Project, Track, ProjectProfile, ProductionProgress, StageKey } from "@/types";

const EMPTY_PROFILE: ProjectProfile = {
  core_influences: "",
  currently_listening: "",
  aesthetic_notes: "",
  soundcloud_url: "",
  soundcloud_tracks: [],
  spotify_connected: false,
  spotify_snapshot: null,
};

// ─── User Profile ─────────────────────────────────────────────

export async function getUserProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!data) return null;
  return {
    name: data.name ?? "",
    artist_bio: data.artist_bio ?? "",
    goals: data.goals ?? "",
    core_influences: data.core_influences ?? "",
    currently_listening: data.currently_listening ?? "",
    soundcloud_url: data.soundcloud_url ?? "",
    soundcloud_tracks: data.soundcloud_tracks ?? [],
    spotify_connected: data.spotify_connected ?? false,
    spotify_snapshot: data.spotify_snapshot ?? null,
    completed_onboarding: data.completed_onboarding ?? false,
    created_at: data.created_at,
  };
}

export async function updateUserProfile(supabase: SupabaseClient, updates: Partial<UserProfile>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_profiles").update(updates).eq("id", user.id);
}

// ─── Projects ─────────────────────────────────────────────────

export async function getProjects(supabase: SupabaseClient): Promise<Project[]> {
  const { data } = await supabase
    .from("projects")
    .select("*, tracks(*)")
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToProject);
}

export async function getProject(supabase: SupabaseClient, id: string): Promise<Project | null> {
  const { data } = await supabase
    .from("projects")
    .select("*, tracks(*)")
    .eq("id", id)
    .single();
  return data ? rowToProject(data) : null;
}

export async function createProject(
  supabase: SupabaseClient,
  input: Pick<Project, "title" | "type" | "description">
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, user_id: user!.id })
    .select("*, tracks(*)")
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function deleteProject(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("projects").delete().eq("id", id);
}

// ─── Tracks ───────────────────────────────────────────────────

export async function createTrack(supabase: SupabaseClient, projectId: string, title: string): Promise<Track> {
  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { data, error } = await supabase
    .from("tracks")
    .insert({ project_id: projectId, user_id: user!.id, title, sort_order: count ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return rowToTrack(data);
}

export async function updateTrack(
  supabase: SupabaseClient,
  trackId: string,
  updates: Partial<Track>
): Promise<void> {
  const { title, theme, mood, influences, lyrics, notes, order } = updates;
  const dbUpdates: Record<string, unknown> = { title, theme, mood, influences, lyrics, notes };
  if (order !== undefined) dbUpdates.sort_order = order;
  await supabase.from("tracks").update(dbUpdates).eq("id", trackId);
}

export async function deleteTrack(supabase: SupabaseClient, trackId: string): Promise<void> {
  await supabase.from("tracks").delete().eq("id", trackId);
}

// ─── Production Progress ──────────────────────────────────────

export async function getProductionProgress(supabase: SupabaseClient, projectId: string): Promise<ProductionProgress> {
  const { data } = await supabase
    .from("production_progress")
    .select("*")
    .eq("project_id", projectId);
  const progress: ProductionProgress = { recording: {}, mixing: {}, mastering: {} };
  for (const row of data ?? []) {
    progress[row.stage as StageKey][row.item_id] = row.done;
  }
  return progress;
}

export async function setChecklistItem(
  supabase: SupabaseClient,
  projectId: string,
  stage: StageKey,
  itemId: string,
  done: boolean
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("production_progress").upsert(
    { project_id: projectId, user_id: user!.id, stage, item_id: itemId, done },
    { onConflict: "project_id,stage,item_id" }
  );
}

// ─── Row mappers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description ?? "",
    created_at: row.created_at,
    tracks: (row.tracks ?? []).map(rowToTrack).sort((a: Track, b: Track) => a.order - b.order),
    profile: EMPTY_PROFILE,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTrack(row: any): Track {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    order: row.sort_order ?? 0,
    theme: row.theme ?? "",
    mood: row.mood ?? "",
    influences: row.influences ?? "",
    lyrics: row.lyrics ?? "",
    notes: row.notes ?? "",
    created_at: row.created_at,
  };
}
