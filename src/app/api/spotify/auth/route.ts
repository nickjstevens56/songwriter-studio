import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Spotify not configured" }, { status: 500 });

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`;
  const scopes = "user-top-read user-read-recently-played";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: projectId,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
