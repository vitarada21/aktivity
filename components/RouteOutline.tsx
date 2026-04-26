import { polylineToSvgPath } from "@/lib/polyline";

type Props = {
  polyline: string | null | undefined;
  size?: number;
  className?: string;
};

export function RouteOutline({ polyline, size = 96, className }: Props) {
  if (!polyline) return null;
  const path = polylineToSvgPath(polyline, size, size, 6);
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
