import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface HeartBurstButtonProps {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Heart toggle that emits a small particle burst the first time it goes
 * from un-liked → liked. Respects prefers-reduced-motion.
 */
const HeartBurstButton = ({ liked, onToggle, size = 18, className = "", ariaLabel = "Like" }: HeartBurstButtonProps) => {
  const [burst, setBurst] = useState(0);
  const [prevLiked, setPrevLiked] = useState(liked);

  useEffect(() => {
    if (liked && !prevLiked) setBurst((b) => b + 1);
    setPrevLiked(liked);
  }, [liked, prevLiked]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-pressed={liked}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center transition-transform active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ${
        liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <motion.span
        key={burst}
        initial={{ scale: liked ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 15 }}
        className="inline-flex"
      >
        <Heart size={size} fill={liked ? "currentColor" : "none"} />
      </motion.span>

      <AnimatePresence>
        {burst > 0 && liked && (
          <span key={burst} className="absolute inset-0 pointer-events-none motion-reduce:hidden">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.span
                key={deg}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos((deg * Math.PI) / 180) * 18,
                  y: Math.sin((deg * Math.PI) / 180) * 18,
                  opacity: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default HeartBurstButton;
