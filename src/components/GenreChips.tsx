import { GENRE_EMOJI, GENRE_LABEL, Genre } from "@/lib/mock-data";

interface GenreChipsProps {
  active: Genre | "all";
  onChange: (g: Genre | "all") => void;
  className?: string;
}

const ORDER: (Genre | "all")[] = ["all", "afrobeats", "dancehall", "gospel", "hiphop", "rnb", "pop", "afrohouse"];

const GenreChips = ({ active, onChange, className = "" }: GenreChipsProps) => {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 ${className}`}>
      {ORDER.map((g) => {
        const isActive = active === g;
        const label = g === "all" ? "All" : GENRE_LABEL[g];
        const emoji = g === "all" ? "🎧" : GENRE_EMOJI[g];
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            }`}
            aria-pressed={isActive}
          >
            <span className="mr-1.5" aria-hidden>{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default GenreChips;
