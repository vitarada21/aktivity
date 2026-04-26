import { ImageResponse } from "next/og";
import { getActivitiesSince, type StravaActivity } from "@/lib/strava";
import { getGradientColorAt, getGradientCss } from "@/lib/year-progress";

export const runtime = "nodejs";

const SPORT_TYPES: Record<string, string[]> = {
  run: ["Run", "TrailRun", "VirtualRun"],
  ride: [
    "Ride",
    "MountainBikeRide",
    "GravelRide",
    "EBikeRide",
    "EMountainBikeRide",
    "VirtualRide",
  ],
  swim: ["Swim"],
  weights: ["WeightTraining", "Workout"],
};

function categorize(a: StravaActivity): string | null {
  for (const [cat, types] of Object.entries(SPORT_TYPES)) {
    if (types.includes(a.sport_type) || types.includes(a.type)) return cat;
  }
  return null;
}

function aggregate(activities: StravaActivity[]) {
  const stats = {
    run: { count: 0, distance: 0 },
    ride: { count: 0, distance: 0 },
    swim: { count: 0, distance: 0 },
    weights: { count: 0, distance: 0 },
  };
  for (const a of activities) {
    const cat = categorize(a);
    if (!cat) continue;
    stats[cat as keyof typeof stats].count++;
    stats[cat as keyof typeof stats].distance += a.distance;
  }
  return stats;
}

const fmtCs = (n: number) =>
  Math.round(n).toLocaleString("cs-CZ").replace(/ /g, " ");

const ICON_STROKE = "#0a0a0a";

const SwimSvg = (
  <svg
    width="120"
    height="120"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_STROKE}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </svg>
);

const RunSvg = (
  <svg
    width="120"
    height="120"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_STROKE}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 20H5c-1.1 0-2-.9-2-2v-3c0-.6.4-1 1-1h2l1.5-3h3l1 2h3l4-2 4 2v5c0 1.1-.9 2-2 2z" />
    <path d="M7 14v6" />
    <path d="M11 14l1 6" />
    <path d="M15 14l1 6" />
  </svg>
);

const BikeSvg = (
  <svg
    width="120"
    height="120"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_STROKE}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
  </svg>
);

const DumbbellSvg = (
  <svg
    width="120"
    height="120"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_STROKE}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.4 14.4 9.6 9.6" />
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
    <path d="m21.5 21.5-1.4-1.4" />
    <path d="M3.9 3.9 2.5 2.5" />
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
  </svg>
);

function StatRow({
  icon,
  value,
  unit,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
      <div style={{ display: "flex", width: 120, height: 120 }}>{icon}</div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          flex: 1,
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 500,
            color: "#0a0a0a",
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 56, color: "#666" }}>{unit}</div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fontSizeOverride = url.searchParams.get("fontSize");
  const now = new Date();
  const startOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  const startEpoch = Math.floor(startOfPrev.getTime() / 1000);
  const endEpoch = Math.floor(startOfCurrent.getTime() / 1000);

  let activities: StravaActivity[] = [];
  try {
    const all = await getActivitiesSince(startEpoch);
    activities = all.filter(
      (a) => Math.floor(new Date(a.start_date_local).getTime() / 1000) < endEpoch,
    );
  } catch (e) {
    console.error("Snapshot fetch failed:", e);
  }
  const stats = aggregate(activities);

  const yearStart = new Date(startOfPrev.getFullYear(), 0, 1);
  const yearEnd = new Date(startOfPrev.getFullYear() + 1, 0, 1);
  const progress =
    (startOfCurrent.getTime() - yearStart.getTime()) /
    (yearEnd.getTime() - yearStart.getTime());
  const accent = getGradientColorAt(progress);
  const monthAbbr = startOfPrev
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const year = startOfPrev.getFullYear();
  const monthLabel = `${year}/${monthAbbr}`;

  const W = 1080;
  const H = 1920;
  const CONTENT_W = W - 200;
 // VELIKOST MMĚSÍCE A ROKU
  const charRatio = (c: string) => {
    if (c >= "0" && c <= "9") return 0.65;
    if (c === "/") return 0.65;
    if (c >= "A" && c <= "Z") return 0.65;
    return 0.65;
  };
  const sumRatio = monthLabel
    .split("")
    .reduce((acc, c) => acc + charRatio(c), 0);
  const autoFontSize = Math.floor(CONTENT_W / sumRatio);
  const monthFontSize = fontSizeOverride
    ? Math.max(50, Math.min(500, parseInt(fontSizeOverride, 10) || autoFontSize))
    : autoFontSize;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          padding: "120px 100px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 80,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 28,
              letterSpacing: 6,
              color: "#666",
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            YEAR PROGRESS {year}
          </div>
          <div
            style={{
              width: "100%",
              height: 16,
              background: getGradientCss("to right"),
              position: "relative",
              display: "flex",
              borderRadius: 8,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${progress * 100}%`,
                top: -12,
                width: 40,
                height: 40,
                marginLeft: -20,
                borderRadius: 20,
                backgroundColor: "#0a0a0a",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              fontSize: monthFontSize,
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
              display: "flex",
              justifyContent: "center",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {monthLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 50,
            marginBottom: 100,
          }}
        >
          <StatRow icon={SwimSvg} value={fmtCs(stats.swim.distance)} unit="m" />
          <StatRow
            icon={RunSvg}
            value={fmtCs(stats.run.distance / 1000)}
            unit="km"
          />
          <StatRow
            icon={BikeSvg}
            value={fmtCs(stats.ride.distance / 1000)}
            unit="km"
          />
          <StatRow
            icon={DumbbellSvg}
            value={String(stats.weights.count)}
            unit="x"
          />
        </div>

        <div
          style={{
            width: "100%",
            height: 10,
            backgroundColor: "#0a0a0a",
            borderRadius: 5,
            marginBottom: 60,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
              letterSpacing: -3,
              marginBottom: 30,
              display: "flex",
            }}
          >
            NEXT RACE
          </div>
          <div
            style={{
              fontSize: 60,
              color: "#0a0a0a",
              lineHeight: 1.2,
              display: "flex",
            }}
          >
            České Budějovice RUNCZECH
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: "#0a0a0a",
              marginTop: 8,
              display: "flex",
            }}
          >
            30. 5. 2026
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Content-Disposition": `attachment; filename="aktivity-${year}-${monthAbbr}.png"`,
      },
    },
  );
}
