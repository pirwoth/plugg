import { useEffect } from "react";

/**
 * Brand accent is locked to neon green for all themes.
 * This component clears any legacy localStorage overrides users may have set
 * during the brief period when the accent was customizable.
 */
const AccentLoader = () => {
  useEffect(() => {
    try {
      localStorage.removeItem("plugg.accent.v1");
      const root = document.documentElement;
      // Remove any inline overrides so the index.css tokens take effect.
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
    } catch {
      /* noop */
    }
  }, []);
  return null;
};

export default AccentLoader;
