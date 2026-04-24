interface EqualizerBarsProps {
  size?: number;
  className?: string;
  /** When false, bars are still but visible */
  playing?: boolean;
}

/** Animated 4-bar equalizer used to indicate the currently playing song. */
const EqualizerBars = ({ size = 14, className = "", playing = true }: EqualizerBarsProps) => {
  return (
    <div
      role="img"
      aria-label={playing ? "Now playing" : "Paused"}
      style={{ width: size, height: size }}
      className={`flex items-end justify-between gap-[2px] ${className}`}
    >
      {[0.4, 0.7, 0.55, 0.85].map((base, i) => (
        <span
          key={i}
          className="w-[2px] bg-current rounded-sm origin-bottom"
          style={{
            height: `${base * 100}%`,
            animation: playing
              ? `eq-bounce 0.${7 + i}s ease-in-out -${i * 0.15}s infinite alternate`
              : "none",
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bounce {
          0% { transform: scaleY(0.35); }
          100% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Now playing"] span { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EqualizerBars;
