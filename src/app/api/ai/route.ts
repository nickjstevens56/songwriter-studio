import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { action, track, message, history } = await req.json();

  let systemPrompt = "";
  let userMessage = "";

  if (action === "analyze_influence") {
    systemPrompt = `You are an expert musicologist and lyric analyst helping songwriters understand and learn from their favorite artists.
Analyze lyrics, themes, imagery, and stylistic techniques used by the named artist.
Be specific: point to actual techniques (internal rhyme, enjambment, extended metaphor, conversational register, etc.) and explain how to incorporate them.
Do not write lyrics for the user. Guide them toward writing their own.`;
    userMessage = message;
  } else if (action === "theme_guidance") {
    systemPrompt = `You are a songwriting coach helping a writer develop a song with a specific theme and mood.
The user will tell you about their song's theme, mood, and emotional intent.
Ask clarifying questions to help them go deeper. Suggest imagery, metaphors, or angles they haven't considered.
Do not write lyrics. Help them think more clearly about what they want to say.`;
    userMessage = `My song has this theme: "${track?.theme}". The mood I'm going for is: "${track?.mood}". ${message}`;
  } else if (action === "lyric_feedback") {
    systemPrompt = `You are a trusted creative collaborator and lyric editor. The user is writing a song and wants honest, constructive feedback.
Focus on: specificity of imagery, emotional authenticity, the strength of the hook, and internal consistency.
Point to specific lines. Ask questions that push them to dig deeper. Do not rewrite their lyrics.
The writer's stated influences are: ${track?.influences || "not specified"}.
The song's theme is: "${track?.theme || "not specified"}". Mood: "${track?.mood || "not specified"}".`;
    userMessage = `Here are my lyrics so far:\n\n${track?.lyrics}\n\n${message}`;
  } else if (action === "chat") {
    systemPrompt = `You are a knowledgeable, encouraging songwriting coach.
You help with: developing song themes, understanding songwriting craft, analyzing lyrical techniques, and overcoming creative blocks.
You do not write lyrics or songs for the user. You ask good questions, offer frameworks, and give honest feedback.
Song context: Theme: "${track?.theme || "none"}". Mood: "${track?.mood || "none"}". Influences: "${track?.influences || "none"}".`;
    userMessage = message;
  } else if (action === "production_chat") {
    const { stage, context } = await Promise.resolve({ stage: track?.stage, context: track?.context });
    systemPrompt = `You are an experienced record producer and audio engineer coaching an independent musician.
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

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply: text });
}
