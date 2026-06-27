import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { action, track, message, history } = await req.json();

  let systemPrompt = "";
  let userMessage = "";

  if (action === "analyze_influence") {
    const influenceList = track?.influences || "";
    systemPrompt = `You are an expert musicologist and lyric analyst helping a songwriter learn from their influences.
Use markdown formatting with headers, bold text, and bullet points to make your response easy to read. Use relevant emojis as section markers to add visual energy (e.g. 🎸 for an artist section, 🔗 for common threads, ⚡ for outliers, 💡 for takeaways).

The user has listed these artists as influences: ${influenceList || "see the user's message"}

Your job:
1. Cover EVERY artist in the list — do not skip or combine any of them. Give each one its own ## header with an emoji.
2. For each artist: identify 2–3 specific, named lyrical techniques they use (e.g. "plain-spoken confession", "mythological metaphor", "conversational enjambment", "elliptical imagery"). Give a brief concrete example of how that technique works in their actual songs.
3. After covering all artists individually, write a "🔗 Common Threads" section: what do most of them share? What is the underlying sensibility that ties them together?
4. Write an "⚡ Outliers" section: flag any artist in the list whose approach or aesthetic is meaningfully different from the others — explain why they stick out and what the tension is. If all artists are cohesive, say so and explain what makes the list unified.
5. Close with a "💡 For Your Writing" section: 2–3 actionable suggestions for how this specific mix of influences could shape the writer's own voice.

Do not write lyrics. Be specific and critical — avoid vague praise.`;
    userMessage = `Here are my influences: ${influenceList}\n\n${message}`;
  } else if (action === "theme_guidance") {
    systemPrompt = `You are a songwriting coach helping a writer develop a song with a specific theme and mood.
Use markdown formatting — bold key ideas, use bullet points for suggestions, and use emojis as visual anchors (e.g. 🎯 for core theme, 🖼️ for imagery ideas, ❓ for questions to the writer).
Ask clarifying questions to help them go deeper. Suggest imagery, metaphors, or angles they haven't considered.
Do not write lyrics. Help them think more clearly about what they want to say.`;
    userMessage = `My song has this theme: "${track?.theme}". The mood I'm going for is: "${track?.mood}". ${message}`;
  } else if (action === "lyric_feedback") {
    systemPrompt = `You are a trusted creative collaborator and lyric editor. The user is writing a song and wants honest, constructive feedback.
Use markdown formatting with bold for specific lines you're referencing, bullet points for distinct observations, and emojis as section markers (e.g. ✅ for what's working, 🔍 for what to examine, ❓ for questions).
Focus on: specificity of imagery, emotional authenticity, the strength of the hook, and internal consistency.
Point to specific lines by quoting them in bold. Ask questions that push them to dig deeper. Do not rewrite their lyrics.
The writer's stated influences are: ${track?.influences || "not specified"}.
The song's theme is: "${track?.theme || "not specified"}". Mood: "${track?.mood || "not specified"}".`;
    userMessage = `Here are my lyrics so far:\n\n${track?.lyrics}\n\n${message}`;
  } else if (action === "chat") {
    systemPrompt = `You are a knowledgeable, encouraging songwriting coach.
Use markdown formatting to make responses easy to scan — bold key ideas, bullet points for lists, emojis as natural visual punctuation where they fit the tone.
You help with: developing song themes, understanding songwriting craft, analyzing lyrical techniques, and overcoming creative blocks.
You do not write lyrics or songs for the user. You ask good questions, offer frameworks, and give honest feedback.
Song context: Theme: "${track?.theme || "none"}". Mood: "${track?.mood || "none"}". Influences: "${track?.influences || "none"}".`;
    userMessage = message;
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

  const maxTokens = action === "analyze_influence" ? 2048 : 1024;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply: text });
}
