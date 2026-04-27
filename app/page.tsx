import {
  getActivities,
  getActivitiesSince,
  type StravaActivity,
} from "@/lib/strava";
import Link from "next/link";
import {
  WavesIcon,
  ShoeIcon,
  BikeIcon,
  DumbbellIcon,
} from "@/components/icons";
import { YearProgress } from "@/components/YearProgress";
import { RouteOutline } from "@/components/RouteOutline";
import { ShareModal } from "@/components/ShareModal";
import { getGradientColorAt, getYearProgress } from "@/lib/year-progress";

type SportCategory = "run" | "ride" | "swim" | "weights";

const SPORT_CATEGORY_TYPES: Record<SportCategory, string[]> = {
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

type CategoryStats = {
  count: number;
  distanceMeters: number;
  movingSeconds: number;
  elevationMeters: number;
};

function categorizeActivity(a: StravaActivity): SportCategory | null {
  for (const [cat, types] of Object.entries(SPORT_CATEGORY_TYPES) as [
    SportCategory,
    string[],
  ][]) {
    if (types.includes(a.sport_type) || types.includes(a.type)) return cat;
  }
  return null;
}

function aggregateMonthStats(
  activities: StravaActivity[],
): Record<SportCategory, CategoryStats> {
  const stats: Record<SportCategory, CategoryStats> = {
    run: { count: 0, distanceMeters: 0, movingSeconds: 0, elevationMeters: 0 },
    ride: { count: 0, distanceMeters: 0, movingSeconds: 0, elevationMeters: 0 },
    swim: { count: 0, distanceMeters: 0, movingSeconds: 0, elevationMeters: 0 },
    weights: {
      count: 0,
      distanceMeters: 0,
      movingSeconds: 0,
      elevationMeters: 0,
    },
  };

  for (const a of activities) {
    const cat = categorizeActivity(a);
    if (!cat) continue;
    stats[cat].count++;
    stats[cat].distanceMeters += a.distance;
    stats[cat].movingSeconds += a.moving_time;
    stats[cat].elevationMeters += a.total_elevation_gain;
  }

  return stats;
}

function formatNumberCs(n: number, decimals = 0): string {
  return n
    .toLocaleString("cs-CZ", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    .replace(/ /g, " ");
}

type StatRowConfig = {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
};

function buildStatRows(
  stats: Record<SportCategory, CategoryStats>,
): StatRowConfig[] {
  return [
    {
      icon: <WavesIcon />,
      value: formatNumberCs(stats.swim.distanceMeters, 0),
      unit: "m",
      label: "Plavání",
    },
    {
      icon: <ShoeIcon />,
      value: formatNumberCs(stats.run.distanceMeters / 1000, 0),
      unit: "km",
      label: "Běhání",
    },
    {
      icon: <BikeIcon />,
      value: formatNumberCs(stats.ride.distanceMeters / 1000, 0),
      unit: "km",
      label: "Kolo",
    },
    {
      icon: <DumbbellIcon />,
      value: String(stats.weights.count),
      unit: "x",
      label: "Posilování",
    },
  ];
}

function StatRow({ row }: { row: StatRowConfig }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 lg:gap-4">
      <div className="text-foreground shrink-0 [&>svg]:w-9 [&>svg]:h-9 sm:[&>svg]:w-10 sm:[&>svg]:h-10 lg:[&>svg]:w-12 lg:[&>svg]:h-12">
        {row.icon}
      </div>
      <div className="flex items-baseline gap-1 sm:gap-1.5 whitespace-nowrap">
        <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tight leading-none tabular-nums">
          {row.value}
        </span>
        <span className="text-xs sm:text-sm lg:text-base xl:text-lg text-foreground/60">
          {row.unit}
        </span>
      </div>
    </div>
  );
}

function formatTotalMovingTime(activities: StravaActivity[]): string {
  const totalSeconds = activities.reduce((acc, a) => acc + a.moving_time, 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

function currentMonthLabel(): string {
  const now = new Date();
  const month = now
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  return `${now.getFullYear()}/${month}`;
}

const SPORT_LABEL: Record<SportCategory, string> = {
  run: "Běhání",
  ride: "Kolo",
  swim: "Plavání",
  weights: "Posilování",
};

const SPORT_TILE_ICON: Record<SportCategory, React.ReactNode> = {
  run: <ShoeIcon size={28} />,
  ride: <BikeIcon size={28} />,
  swim: <WavesIcon size={28} />,
  weights: <DumbbellIcon size={28} />,
};

function FilterBar({ active }: { active: SportCategory | "all" }) {
  const items: { key: SportCategory | "all"; label: string }[] = [
    { key: "all", label: "Vše" },
    ...(Object.keys(SPORT_LABEL) as SportCategory[]).map((k) => ({
      key: k,
      label: SPORT_LABEL[k],
    })),
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {items.map((item) => {
        const isActive = item.key === active;
        const href = item.key === "all" ? "/" : `/?filter=${item.key}`;
        return (
          <Link
            key={item.key}
            href={href}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider rounded-lg border-2 transition-all duration-200 ${
              isActive
                ? "bg-foreground text-white border-foreground"
                : "bg-white text-foreground border-foreground/30 hover:border-foreground hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function formatDistance(meters: number, sport: SportCategory | null): string {
  if (sport === "swim") return `${formatNumberCs(meters, 0)} m`;
  return `${formatNumberCs(meters / 1000, 2)} km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function formatPace(metersPerSec: number, sportType: string): string {
  if (metersPerSec === 0) return "—";
  const isRideLike =
    sportType.toLowerCase().includes("ride") ||
    sportType.toLowerCase().includes("ski");
  if (isRideLike) {
    return `${(metersPerSec * 3.6).toFixed(1)} km/h`;
  }
  const secPerKm = 1000 / metersPerSec;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function ActivityTile({ activity }: { activity: StravaActivity }) {
  const cat = categorizeActivity(activity);
  const icon = cat ? SPORT_TILE_ICON[cat] : null;
  const showDistance = cat !== "weights";
  const polyline = activity.map?.summary_polyline ?? null;

  return (
    <a
      href={`https://www.strava.com/activities/${activity.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border-2 border-foreground/30 hover:border-foreground rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-foreground">{icon}</div>
        <span className="text-xs uppercase tracking-wider text-foreground/50">
          {formatDateShort(activity.start_date_local)}
        </span>
      </div>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground mb-5 line-clamp-2 leading-snug">
            {activity.name}
          </h3>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            {showDistance && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-0.5">
                  Vzdálenost
                </div>
                <div className="text-base font-bold tabular-nums">
                  {formatDistance(activity.distance, cat)}
                </div>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-0.5">
                Čas
              </div>
              <div className="text-base font-medium tabular-nums">
                {formatDuration(activity.moving_time)}
              </div>
            </div>
            {showDistance && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-0.5">
                  Tempo
                </div>
                <div className="text-base font-bold tabular-nums">
                  {formatPace(activity.average_speed, activity.sport_type)}
                </div>
              </div>
            )}
            {showDistance && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-0.5">
                  Převýšení
                </div>
                <div className="text-base font-medium tabular-nums">
                  {Math.round(activity.total_elevation_gain)} m
                </div>
              </div>
            )}
          </div>
        </div>
        {polyline && (
          <RouteOutline
            polyline={polyline}
            size={128}
            className="text-foreground shrink-0"
          />
        )}
      </div>
    </a>
  );
}

function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="border border-foreground/15 p-8 text-center">
      <p className="font-medium mb-2">{message}</p>
      {hint && <p className="text-sm text-foreground/60">{hint}</p>}
    </div>
  );
}

function isSportCategory(value: string | undefined): value is SportCategory {
  return (
    value === "run" || value === "ride" || value === "swim" || value === "weights"
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter: SportCategory | "all" = isSportCategory(filter)
    ? filter
    : "all";

  let recent: StravaActivity[] = [];
  let monthActivities: StravaActivity[] = [];
  let error: string | null = null;

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthEpoch = Math.floor(startOfMonth.getTime() / 1000);

    [recent, monthActivities] = await Promise.all([
      getActivities(100),
      getActivitiesSince(startOfMonthEpoch),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Neznámá chyba";
  }

  const monthStats = aggregateMonthStats(monthActivities);
  const statRows = buildStatRows(monthStats);
  const monthLabelColor = getGradientColorAt(getYearProgress().progress);

  const filteredRecent =
    activeFilter === "all"
      ? recent
      : recent.filter((a) => categorizeActivity(a) === activeFilter);

  return (
    <>
      <YearProgress />
      <aside className="hidden md:flex fixed right-0 top-0 bottom-0 w-16 lg:w-20 flex-col items-center py-8 z-10 bg-white">
        <div className="text-[10px] tracking-[0.25em] font-medium uppercase text-foreground/70 [writing-mode:vertical-rl] whitespace-nowrap">
          <span className="text-accent">Next Race:</span> České Budějovice RUNCZECH — 30.5.2026
        </div>
      </aside>
      <main className="min-h-screen bg-background md:pl-16 md:pr-16 lg:pl-20 lg:pr-20">
        <div className="px-4 sm:px-8 lg:px-14 py-6 sm:py-10 lg:py-14">
          <div className="text-center text-2xl sm:text-3xl uppercase tracking-[0.3em] font-medium text-foreground/60 mb-2 sm:mb-3">
            Vít Rada
          </div>
          <h1 className="text-black font-black tracking-tighter leading-[0.9] text-[clamp(2.5rem,10vw,8rem)] mb-4 sm:mb-6 text-center overflow-hidden">
            <span className="inline-block origin-center scale-x-[1.2] sm:scale-x-[1.4] lg:scale-x-[1.55] xl:scale-x-[1.65]">
              AKTIVITY
            </span>
          </h1>

          {error && (
            <EmptyState
              message="Nepodařilo se načíst aktivity ze Stravy."
              hint={
                <>
                  {error}
                  <br />
                  <Link className="underline" href="/setup">
                    Otevři /setup pro propojení.
                  </Link>
                </>
              }
            />
          )}

          {!error && (
            <section className="mb-16 sm:mb-20">
              <h2
                className="font-black tracking-tight leading-none text-[clamp(2rem,8vw,6rem)] mb-6 sm:mb-8 text-center"
                style={{ color: monthLabelColor }}
              >
                {currentMonthLabel()}
              </h2>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-x-4 gap-y-6 sm:gap-x-6 lg:gap-x-10 xl:gap-x-12 w-full">
                {statRows.map((row) => (
                  <StatRow key={row.label} row={row} />
                ))}
              </div>
              <div className="mt-8 sm:mt-10 text-center">
                <div className="text-xs sm:text-sm uppercase tracking-[0.25em] font-medium text-foreground/60 mb-2">
                  Moving time
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight tabular-nums">
                  {formatTotalMovingTime(monthActivities)}
                </div>
              </div>
            </section>
          )}

          <div className="h-1.5 bg-foreground rounded-full mb-10" />

          {!error && recent.length === 0 && (
            <EmptyState message="Zatím tu nejsou žádné aktivity." />
          )}

          {!error && recent.length > 0 && (
            <section>
              <FilterBar active={activeFilter} />
              {filteredRecent.length === 0 ? (
                <EmptyState
                  message={`Žádná aktivita typu „${SPORT_LABEL[activeFilter as SportCategory]}" mezi posledními ${recent.length}.`}
                  hint={
                    <Link className="underline" href="/">
                      Zobrazit vše
                    </Link>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRecent.map((a) => (
                    <ActivityTile key={a.id} activity={a} />
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="flex justify-center mt-16">
            <ShareModal />
          </div>
        </div>
      </main>
    </>
  );
}
