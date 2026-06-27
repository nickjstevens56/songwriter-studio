import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token;
}

async function spotifyFetch(path: string, token: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ connected: false });
  }

  // Try to refresh if access token is missing
  if (!accessToken && refreshToken) {
    accessToken = (await refreshAccessToken(refreshToken)) ?? undefined;
    if (!accessToken) return NextResponse.json({ connected: false });
  }

  // Fetch all three data sources in parallel
  const [topTracks, topArtists, recentlyPlayed] = await Promise.all([
    spotifyFetch("/me/top/tracks?limit=20&time_range=short_term", accessToken!),
    spotifyFetch("/me/top/artists?limit=10&time_range=short_term", accessToken!),
    spotifyFetch("/me/player/recently-played?limit=20", accessToken!),
  ]);

  // If all fail, token is likely expired and refresh failed
  if (!topTracks && !topArtists && !recentlyPlayed) {
    return NextResponse.json({ connected: false, expired: true });
  }

  const snapshot = {
    top_tracks: (topTracks?.items ?? []).map((t: { name: string; artists: { name: string }[] }) => ({
      name: t.name,
      artists: t.artists.map((a: { name: string }) => a.name),
    })),
    top_artists: (topArtists?.items ?? []).map((a: { name: string; genres: string[] }) => ({
      name: a.name,
      genres: a.genres.slice(0, 3),
    })),
    recently_played: (recentlyPlayed?.items ?? []).map((i: { track: { name: string; artists: { name: string }[] } }) => ({
      name: i.track.name,
      artists: i.track.artists.map((a: { name: string }) => a.name),
    })),
    synced_at: new Date().toISOString(),
  };

  const response = NextResponse.json({ connected: true, snapshot });

  // Refresh the access token cookie if we had to refresh it
  if (!cookieStore.get("spotify_access_token")?.value && accessToken) {
    response.cookies.set("spotify_access_token", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3600,
      path: "/",
    });
  }

  return response;
}
