import Link from "next/link";

export function TopNavigation() {
  const aiCoachUrl =
    process.env.NEXT_PUBLIC_AI_COACH_URL || "https://ai-coach.streamlit.app";

  return (
    <nav className="flex justify-center gap-3 mb-8">
      <Link
        href="/"
        className="px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border-2 bg-foreground text-white border-foreground"
      >
        AKTIVITY
      </Link>
      <a
        href={aiCoachUrl}
        className="px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border-2 bg-white text-foreground border-foreground/30 hover:border-foreground transition-all"
      >
        AI COACH
      </a>
    </nav>
  );
}
