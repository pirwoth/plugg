import { useState } from "react";

interface ClampedBioProps {
  text: string;
  /** Approx character threshold before truncation. Defaults to 80. */
  limit?: number;
  className?: string;
}

/**
 * Shows a short preview of bio text with a soft fade and a "more" toggle.
 * If the text is shorter than the limit, it just renders inline.
 */
const ClampedBio = ({ text, limit = 80, className = "" }: ClampedBioProps) => {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text.trim();
  if (!trimmed) return null;

  const needsClamp = trimmed.length > limit;
  if (!needsClamp) {
    return <p className={`text-sm text-foreground/80 ${className}`}>{trimmed}</p>;
  }

  if (expanded) {
    return (
      <p className={`text-sm text-foreground/80 ${className}`}>
        {trimmed}{" "}
        <button
          onClick={() => setExpanded(false)}
          className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          less
        </button>
      </p>
    );
  }

  // Truncate at a word boundary near the limit for nicer fade.
  const slice = trimmed.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  const preview = (lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd();

  return (
    <div className={`relative ${className}`}>
      <p className="text-sm text-foreground/80">
        <span className="relative inline">
          {preview}
          <span
            aria-hidden
            className="bg-gradient-to-r from-transparent to-background"
            style={{ display: "inline-block", width: "2rem" }}
          />
        </span>
        …{" "}
        <button
          onClick={() => setExpanded(true)}
          className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          more
        </button>
      </p>
    </div>
  );
};

export default ClampedBio;
