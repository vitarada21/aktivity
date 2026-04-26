import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Chybí Strava env vars. Spusť přes: npm run sync-pb (ten už načte .env.local)",
  );
  process.exit(1);
}

const RUN_TYPES = ["Run", "TrailRun", "VirtualRun"];
const PB_FILE = "data/pb.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options, attempt = 1) {
  const res = await fetch(url, options);
  if (res.status === 429) {
    console.log(`\n⏸  Rate limit hit. Čekám 15 min a pokračuju...`);
    await sleep(15 * 60 * 1000);
    return fetchWithRetry(url, options, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} pro ${url}: ${await res.text()}`);
  }
  return res;
}

async function getAccessToken() {
  const res = await fetchWithRetry("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });
  return (await res.json()).access_token;
}

async function fetchAllActivities(token) {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetchWithRetry(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 200) break;
    page++;
  }
  return all;
}

async function fetchActivityDetail(token, id) {
  const res = await fetchWithRetry(
    `https://www.strava.com/api/v3/activities/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}

function readExistingPb() {
  if (!existsSync(PB_FILE)) {
    return { lastSync: null, processedIds: [], byDistance: {} };
  }
  try {
    const data = JSON.parse(readFileSync(PB_FILE, "utf8"));
    return {
      lastSync: data.lastSync ?? null,
      processedIds: Array.isArray(data.processedIds) ? data.processedIds : [],
      byDistance: data.byDistance ?? {},
    };
  } catch {
    return { lastSync: null, processedIds: [], byDistance: {} };
  }
}

async function main() {
  console.log("🔑 Refreshing access token...");
  const token = await getAccessToken();

  console.log("📋 Stahuju seznam aktivit...");
  const activities = await fetchAllActivities(token);
  const runs = activities.filter(
    (a) => RUN_TYPES.includes(a.sport_type) || RUN_TYPES.includes(a.type),
  );
  console.log(`Nalezeno ${runs.length} běhů z celkem ${activities.length} aktivit`);

  const existing = readExistingPb();
  const processedSet = new Set(existing.processedIds);
  const byDistance = { ...existing.byDistance };

  const todo = runs.filter((r) => !processedSet.has(r.id));
  console.log(
    `${todo.length} nových běhů ke zpracování (${runs.length - todo.length} přeskočeno z cache)`,
  );

  if (todo.length === 0) {
    console.log("✨ Cache je aktuální, nic stahovat nemusím.");
  }

  for (let i = 0; i < todo.length; i++) {
    const run = todo[i];
    const label = `${i + 1}/${todo.length}`;
    process.stdout.write(`\r⏬ ${label.padStart(7)}  ${run.name.slice(0, 50).padEnd(50)}`);

    try {
      const detail = await fetchActivityDetail(token, run.id);
      for (const eff of detail.best_efforts || []) {
        const current = byDistance[eff.name];
        if (!current || eff.elapsed_time < current.elapsedTime) {
          byDistance[eff.name] = {
            elapsedTime: eff.elapsed_time,
            activityId: run.id,
            activityName: run.name,
            date: run.start_date_local.slice(0, 10),
            distance: eff.distance,
          };
        }
      }
      processedSet.add(run.id);
    } catch (e) {
      console.error(`\n⚠️  Chyba u aktivity ${run.id}:`, e.message);
    }

    await sleep(200);

    if ((i + 1) % 50 === 0) {
      writeFileSync(
        PB_FILE,
        JSON.stringify(
          {
            lastSync: new Date().toISOString(),
            processedIds: [...processedSet],
            byDistance,
          },
          null,
          2,
        ),
      );
    }
  }

  mkdirSync("data", { recursive: true });
  writeFileSync(
    PB_FILE,
    JSON.stringify(
      {
        lastSync: new Date().toISOString(),
        processedIds: [...processedSet],
        byDistance,
      },
      null,
      2,
    ),
  );

  console.log(`\n✅ Hotovo. Uloženo do ${PB_FILE}.`);
  console.log("\n📊 Tvoje aktuální PB:");
  for (const [name, rec] of Object.entries(byDistance)) {
    const min = Math.floor(rec.elapsedTime / 60);
    const sec = rec.elapsedTime % 60;
    console.log(
      `   ${name.padEnd(18)} ${String(min).padStart(3)}:${String(sec).padStart(2, "0")}  (${rec.date})`,
    );
  }
}

main().catch((e) => {
  console.error("\n💥 Sync selhal:", e);
  process.exit(1);
});
