export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date_local: string;
  average_speed: number;
  kudos_count: number;
  map?: {
    id?: string;
    summary_polyline?: string | null;
  };
};

type TokenResponse = {
  access_token: string;
  expires_at: number;
  refresh_token: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;
const activitiesCache = new Map<
  string,
  { data: StravaActivity[]; expiresAt: number }
>();

function cacheGet(key: string): StravaActivity[] | null {
  const entry = activitiesCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    activitiesCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: StravaActivity[]) {
  activitiesCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() / 1000 + 60) {
    return cachedToken.token;
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Strava env vars chybí. Spusť nejdřív /setup nebo zkontroluj .env.local",
    );
  }

  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token refresh selhal: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = { token: data.access_token, expiresAt: data.expires_at };
  return data.access_token;
}

export async function getActivities(perPage = 30): Promise<StravaActivity[]> {
  const key = `recent:${perPage}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const token = await getAccessToken();
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Strava activities fetch selhal: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as StravaActivity[];
  cacheSet(key, data);
  return data;
}

export async function getActivitiesSince(
  afterEpochSeconds: number,
): Promise<StravaActivity[]> {
  const key = `since:${afterEpochSeconds}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const token = await getAccessToken();
  const all: StravaActivity[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${afterEpochSeconds}&per_page=${perPage}&page=${page}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(
        `Strava activities fetch selhal: ${res.status} ${await res.text()}`,
      );
    }

    const batch = (await res.json()) as StravaActivity[];
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
    if (page > 10) break;
  }

  cacheSet(key, all);
  return all;
}
