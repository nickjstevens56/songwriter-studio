import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const projectId = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (error || !code || !projectId) {
    return NextResponse.redirect(`${appUrl}/projects/${projectId}/profile?spotify=denied`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/spotify/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/projects/${projectId}/profile?spotify=error`);
  }

  const tokens = await tokenRes.json();

  const response = NextResponse.redirect(`${appUrl}/projects/${projectId}/profile?spotify=connected`);

  // Store tokens in httpOnly cookies (1 hour for access, 30 days for refresh)
  response.cookies.set("spotify_access_token", tokens.access_token, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
    path: "/",
  });
  response.cookies.set("spotify_refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
