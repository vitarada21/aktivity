import { getGradientCss, getYearProgress } from "@/lib/year-progress";

export function YearProgress() {
  const { progress, year } = getYearProgress();
  const percent = Math.round(progress * 100);
  const dotTopPercent = progress * 100;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 lg:w-20 flex-col items-center py-8 z-10 bg-white">
      <div className="text-[10px] tracking-[0.25em] font-medium uppercase text-foreground/70 [writing-mode:vertical-rl] rotate-180 mb-4">
        Year Progress {year}
      </div>

      <div
        className="relative flex-1 w-2 rounded-full overflow-visible"
        style={{ background: getGradientCss("to bottom") }}
      >
        <div
          className="absolute w-[18px] h-[18px] rounded-full bg-foreground"
          style={{ top: `calc(${dotTopPercent}% - 9px)`, left: "-5px" }}
          aria-hidden="true"
        />
      </div>

      <div className="text-[10px] tracking-[0.25em] font-medium uppercase text-foreground/70 mt-4">
        {percent}%
      </div>
    </aside>
  );
}
