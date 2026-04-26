import pbJson from "@/data/pb.json";

export type PBRecord = {
  elapsedTime: number;
  activityId: number;
  activityName: string;
  date: string;
  distance: number;
};

export type PBData = {
  lastSync: string | null;
  processedIds: number[];
  byDistance: Record<string, PBRecord>;
};

export function getPB(distanceName: string): PBRecord | null {
  const data = pbJson as PBData;
  return data.byDistance[distanceName] ?? null;
}

export function formatPbTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPbDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
