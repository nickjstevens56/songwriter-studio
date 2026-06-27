import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { action, track, profile, message, history } = await req.json();

  // Build Spotify listening context if available
  const snapshot = profile?.spotify_snapshot;
  let spotifyContext = "";
  if (snapshot) {
    const topArtistNames = snapshot.top_artists?.map((a: { name: string }) => a.name).join(", ");
    const topTrackNames = snapshot.top_tracks?.slice(0, 8).map((t: { name: string; artists: string[] }) => `${t.name} by ${t.artists[0]}`).join(", ");
    const genres = [...new Set(snapshot.top_artists?.flatMap((a: { genres: string[] }) => a.genres) ?? [])].slice(0, 8).join(", ");
    spotifyContext = [
      topArtistNames && `Spotify top artists (recent): ${topArtistNames}`,
      topTrackNames && `Spotify top tracks (recent): ${topTrackNames}`,
      genres && `Genres in rotation: ${genres}`,
    ].filter(Boolean).join("\n");
  }

  // Merge project-level and track-level influences into one list
  const allInfluences = [
    profile?.core_influences,
    profile?.currently_listening,
    snapshot && snapshot.top_artists?.slice(0, 5).map((a: { name: string }) => a.name).join(", "),
    track?.influences,
  ].filter(Boolean).join("; ");

  // Build SoundCloud context from the user's own tracks
  const scTracks = profile?.soundcloud_tracks ?? [];
  const soundcloudContext = scTracks.length > 0
    ? `The user's own music on SoundCloud (${scTracks.length} track${scTracks.length !== 1 ? "s" : ""}):\n` +
      scTracks.map((t: { title: string; description: string }) =>
        `- "${t.title}"${t.description ? `: ${t.description.slice(0, 200)}` : ""}`
      ).join("\n")
    : "";

  const profileContext = [
    profile?.name && `Artist name: ${profile.name}`,
    profile?.artist_bio && `About the artist: ${profile.artist_bio}`,
    profile?.goals && `What the artist is working on / looking for help with: ${profile.goals}`,
    profile?.core_influences && `Core influences: ${profile.core_influences}`,
    profile?.currently_listening && `Currently listening to: ${profile.currently_listening}`,
    spotifyContext,
    soundcloudContext,
  ].filter(Boolean).join("\n");

  // Build current track context — always injected so the AI never needs the user to paste lyrics
  const hasLyrics = track?.lyrics?.trim();
  const trackContext = [
    track?.theme && `Song theme: ${track.theme}`,
    track?.mood && `Mood: ${track.mood}`,
    track?.influences && `Track-specific influences: ${track.influences}`,
    hasLyrics && `Current draft lyrics:\n"""\n${track.lyrics}\n"""`,
  ].filter(Boolean).join("\n");

  let systemPrompt = "";
  let userMessage = "";

  if (action === "analyze_influence") {
    systemPrompt = `You are an expert musicologist and lyric analyst helping a songwriter learn from their influences.
Use markdown formatting with headers, bold text, and bullet points to make your response easy to read. Use relevant emojis as section markers (e.g. 🎸 for an artist section, 🔗 for common threads, ⚡ for outliers, 💡 for takeaways).

The user's influences (global profile and track-specific, combined):
${allInfluences || "see the user's message"}
${profileContext ? `\nArtist profile context:\n${profileContext}` : ""}
${trackContext ? `\nCurrent song context:\n${trackContext}` : ""}
Your job:
1. Cover EVERY artist in the combined influence list — do not skip or combine any of them. Give each one its own ## header with an emoji.
2. For each artist: identify 2–3 specific, named lyrical techniques they use (e.g. "plain-spoken confession", "mythological metaphor", "conversational enjambment", "elliptical imagery"). Describe HOW the technique works and what effect it creates — do NOT quote song lyrics directly, as quoted lyrics are frequently misremembered. You may reference a song title or album name only if you are highly confident it is correct; otherwise describe the technique in general terms.
3. After covering all artists individually, write a "🔗 Common Threads" section: what do most of them share? What is the underlying sensibility that ties them together?
4. Write an "⚡ Outliers" section: flag any artist in the list whose approach or aesthetic is meaningfully different from the others — explain why they stick out and what the tension is. If all artists are cohesive, say so and explain what makes the list unified.
5. Close with a "💡 For Your Writing" section: ${hasLyrics ? "look at the user's actual lyrics above and give 2–3 specific observations about where their writing already echoes these influences, and where they could push further using techniques from their influences." : "2–3 actionable suggestions for how this specific mix of influences could shape the writer's own voice."}

Critical rules:
- Never quote song lyrics directly — you will hallucinate them. Describe technique and effect instead.
- Only name a specific song or album if you are highly confident. If uncertain, say "in songs from this period" or "across their catalog" rather than guessing a title.
- Do not invent songs, albums, or collaborations. If you are unsure whether something is accurate, omit it.
- Be specific about craft and critical — avoid vague praise.`;
    userMessage = `Here are my influences: ${allInfluences}\n\n${message}`;
  } else if (action === "theme_guidance") {
    systemPrompt = `You are a songwriting coach helping a writer develop a song with a specific theme and mood.
Use markdown formatting — bold key ideas, use bullet points for suggestions, and use emojis as visual anchors (e.g. 🎯 for core theme, 🖼️ for imagery ideas, ❓ for questions to the writer).
Ask clarifying questions to help them go deeper. Suggest imagery, metaphors, or angles they haven't considered.
Do not write lyrics. Help them think more clearly about what they want to say.
${trackContext ? `\nCurrent song:\n${trackContext}` : ""}
${profileContext ? `\nArtist profile and influences:\n${profileContext}` : ""}`;
    userMessage = message;
  } else if (action === "lyric_feedback") {
    systemPrompt = `You are a trusted creative collaborator and lyric editor. The user is writing a song and wants honest, constructive feedback.
Use markdown formatting with bold for specific lines you're referencing, bullet points for distinct observations, and emojis as section markers (e.g. ✅ for what's working, 🔍 for what to examine, ❓ for questions).
Focus on: specificity of imagery, emotional authenticity, the strength of the hook, and internal consistency.
Point to specific lines by quoting them in bold. Ask questions that push them to dig deeper. Do not rewrite their lyrics.
${trackContext ? `\nCurrent song:\n${trackContext}` : ""}
${profileContext ? `\nArtist profile and influences:\n${profileContext}` : ""}`;
    userMessage = message;
  } else if (action === "chat") {
    systemPrompt = `You are a knowledgeable, encouraging songwriting coach.
Use markdown formatting to make responses easy to scan — bold key ideas, bullet points for lists, emojis as natural visual punctuation where they fit the tone.
You help with: developing song themes, understanding songwriting craft, analyzing lyrical techniques, and overcoming creative blocks.
You do not write lyrics or songs for the user. You ask good questions, offer frameworks, and give honest feedback.
${trackContext ? `\nCurrent song the user is working on:\n${trackContext}` : ""}
Influences: "${allInfluences || "none"}".
${profileContext ? `\nArtist profile:\n${profileContext}` : ""}`;
    userMessage = message;
  } else if (action === "summarize_chat") {
    systemPrompt = `You are a songwriting coach summarizing a guidance session for a songwriter's reference.
Write a concise session summary they can save and return to later.
Format:
- **Key insights** (2–4 bullet points): the most useful ideas or realisations from the conversation
- **Suggestions to try** (2–3 bullet points): specific, actionable things to experiment with in the writing
- **Open questions** (1–2 bullet points, only if relevant): threads worth exploring further

Keep each bullet tight — one clear sentence. No preamble, no sign-off.
${trackContext ? `\nSong context:\n${trackContext}` : ""}`;
    userMessage = "Summarize our conversation into a compact session note I can save for later.";
  } else if (action === "production_chat") {
    const { stage, context } = await Promise.resolve({ stage: track?.stage, context: track?.context });
    systemPrompt = `You are an experienced record producer and audio engineer coaching an independent musician.
Use markdown formatting — bold key terms, bullet points for steps or options, emojis as section markers where natural (e.g. 🎙️ for recording tips, 🎚️ for mixing, 🔊 for monitoring, ⚠️ for common mistakes, 💡 for pro tips).
You give practical, honest, gear-agnostic advice on recording, mixing, and mastering.
Assume the user is working in a home studio environment with modest equipment — don't recommend expensive gear by default.
Current stage the user is working on: ${stage || "general production"}.
Context: ${context || "none"}.
Be specific and actionable. Explain the "why" behind your recommendations.`;
    userMessage = message;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const messages = [
    ...(history || []),
    { role: "user" as const, content: userMessage },
  ];

  const maxTokens = action === "analyze_influence" ? 4096 : 1024;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply: text });
}
