import { Genre, GENRE_LABEL, GENRE_EMOJI } from "@/lib/mock-data";

interface GenrePickerProps {
  /** Currently-selected genres */
  value: Genre[];
  onChange: (next: Genre[]) => void;
  /** Maximum number selectable. */
  max: number;
  /** Optional label override */
  label?: string;
  helper?: string;
}

const ALL_GENRES: Genre[] = ["afrobeats", "dancehall", "gospel", "hiphop", "rnb", "pop", "afrohouse"];

/**
 * Reusable chip-based genre selector with a per-component max cap.
 * Tapping a chip adds it; tapping again removes it. Once the cap is reached
 * the unselected chips dim and become disabled.
 */
const GenrePicker = ({ value, onChange, max, label, helper }: GenrePickerProps) => {
  const toggle = (g: Genre) => {
    if (value.includes(g)) {
      onChange(value.filter((x) => x !== g));
    } else if (value.length < max) {
      onChange([...value, g]);
    }
  };

  const atCap = value.length >= max;

  return (
    <div>
      <div className="flex items-baseline justify-between px-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label ?? `Genres · pick up to ${max}`}
        </label>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {value.length}/{max}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ALL_GENRES.map((g) => {
          const selected = value.includes(g);
          const disabled = !selected && atCap;
          return (
            <button
              key={g}
              type="button"
              onClick={() => toggle(g)}
              disabled={disabled}
              aria-pressed={selected}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? "bg-primary text-primary-foreground border-primary"
                  : disabled
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              <span>{GENRE_EMOJI[g]}</span>
              {GENRE_LABEL[g]}
            </button>
          );
        })}
      </div>
      {helper && <p className="text-[11px] text-muted-foreground mt-1.5 px-1">{helper}</p>}
    </div>
  );
};

export default GenrePicker;
