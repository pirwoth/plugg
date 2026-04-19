import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Heart, Mic2, ArrowRight } from "lucide-react";

interface OnboardingCarouselProps {
  open: boolean;
  onClose: () => void;
}

const slides = [
  {
    icon: Music,
    title: "Discover Ugandan music",
    body: "Trending Afrobeats, Dancehall, Gospel and more — handpicked for you.",
    accent: "from-primary/30 to-primary/5",
  },
  {
    icon: Heart,
    title: "Tip your favourite artists",
    body: "Send gifts straight to the artist via MTN MoMo or Airtel Money. (Coming back soon.)",
    accent: "from-pink-500/25 to-pink-500/5",
  },
  {
    icon: Mic2,
    title: "Become an artist",
    body: "Upload tracks, grow your audience, and see your stats in the studio.",
    accent: "from-amber-500/25 to-amber-500/5",
  },
];

const OnboardingCarousel = ({ open, onClose }: OnboardingCarouselProps) => {
  const [step, setStep] = useState(0);
  const slide = slides[step];

  if (!open) return null;
  const last = step === slides.length - 1;

  const next = () => (last ? onClose() : setStep((s) => s + 1));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] bg-background/95 backdrop-blur-sm flex flex-col"
      >
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${slide.accent} border border-border flex items-center justify-center mb-6`}>
                <slide.icon size={48} className="text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">{slide.title}</h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm mx-auto">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 pb-8 max-w-lg mx-auto w-full space-y-5">
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-primary" : "w-1.5 bg-secondary"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {last ? "Start exploring" : "Next"}
            {!last && <ArrowRight size={16} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingCarousel;
