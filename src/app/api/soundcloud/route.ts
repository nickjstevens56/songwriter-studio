import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || !url.includes("soundcloud.com")) {
    return NextResponse.json({ error: "Invalid SoundCloud URL" }, { status: 400 });
  }

  const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  const res = await fetch(oembedUrl, {
    headers: { "User-Agent": "songwriter-studio/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch track. Make sure the URL is a public SoundCloud track or profile." }, { status: 400 });
  }

  const data = await res.json();

  return NextResponse.json({
    title: data.title ?? "",
    description: data.description ?? "",
    author: data.author_name ?? "",
  });
}
