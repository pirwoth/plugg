import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageCropperProps {
  open: boolean;
  src: string | null;
  /** width / height of the crop window. 1 = square (avatar), e.g. 3 = wide banner */
  aspect?: number;
  /** "circle" shows a circular mask (avatars), "rect" a rectangle (covers) */
  shape?: "circle" | "rect";
  /** output pixel width — height is derived from aspect */
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

/**
 * Lightweight in-browser cropper. The user drags the image and pinches/scrolls
 * to zoom inside a fixed-size viewport, then we draw the visible region onto
 * a hidden canvas at the requested output size.
 */
const ImageCropper = ({
  open,
  src,
  aspect = 1,
  shape = "circle",
  outputWidth = 512,
  onCancel,
  onConfirm,
}: ImageCropperProps) => {
  const VIEWPORT_W = 280;
  const VIEWPORT_H = Math.round(VIEWPORT_W / aspect);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  // reset when src changes
  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    // smallest scale that still covers the viewport
    const cover = Math.max(VIEWPORT_W / img.naturalWidth, VIEWPORT_H / img.naturalHeight);
    setMinScale(cover);
    setScale(cover);
    setPos({ x: 0, y: 0 });
  };

  const clampPos = (x: number, y: number, s: number) => {
    const w = natural.w * s;
    const h = natural.h * s;
    const maxX = Math.max(0, (w - VIEWPORT_W) / 2);
    const maxY = Math.max(0, (h - VIEWPORT_H) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: pos.x, y: pos.y, startX: e.clientX, startY: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = dragRef.current.x + (e.clientX - dragRef.current.startX);
    const ny = dragRef.current.y + (e.clientY - dragRef.current.startY);
    setPos(clampPos(nx, ny, scale));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Touch pinch-zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = Math.min(5, Math.max(minScale, pinchRef.current.scale * (dist / pinchRef.current.dist)));
      setScale(next);
      setPos((p) => clampPos(p.x, p.y, next));
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const next = Math.min(5, Math.max(minScale, scale * (e.deltaY < 0 ? 1.05 : 0.95)));
    setScale(next);
    setPos((p) => clampPos(p.x, p.y, next));
  };

  const handleZoom = (delta: number) => {
    const next = Math.min(5, Math.max(minScale, scale + delta));
    setScale(next);
    setPos((p) => clampPos(p.x, p.y, next));
  };

  const handleReset = () => {
    setScale(minScale);
    setPos({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    if (!src || !natural.w) return;
    const outW = outputWidth;
    const outH = Math.round(outputWidth / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The viewport shows a region of the image. Compute its top-left in image coords.
    const drawnW = natural.w * scale;
    const drawnH = natural.h * scale;
    // top-left of the drawn image relative to viewport center
    const left = -drawnW / 2 + pos.x + VIEWPORT_W / 2;
    const top = -drawnH / 2 + pos.y + VIEWPORT_H / 2;
    // crop window in image (natural) coords
    const sx = (-left) / scale;
    const sy = (-top) / scale;
    const sw = VIEWPORT_W / scale;
    const sh = VIEWPORT_H / scale;

    const img = imgRef.current;
    if (!img) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onConfirm(dataUrl);
  };

  if (!open || !src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-sm flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={onCancel}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <p className="text-sm font-semibold text-foreground">Adjust photo</p>
          <button
            onClick={handleConfirm}
            className="p-1 text-primary hover:opacity-80"
            aria-label="Confirm"
          >
            <Check size={22} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
            className={`relative overflow-hidden bg-secondary touch-none select-none cursor-grab active:cursor-grabbing ${
              shape === "circle" ? "rounded-full" : "rounded-xl"
            }`}
          >
            <img
              alt="Image to crop"
              ref={imgRef}
              src={src}
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: natural.w * scale,
                height: natural.h * scale,
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                maxWidth: "none",
                pointerEvents: "none",
              }}
            />
            <div
              className={`pointer-events-none absolute inset-0 border-2 border-primary/60 ${
                shape === "circle" ? "rounded-full" : "rounded-xl"
              }`}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Drag to reposition · pinch or scroll to zoom
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoom(-0.1)}
              className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min={minScale}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => {
                const next = Number(e.target.value);
                setScale(next);
                setPos((p) => clampPos(p.x, p.y, next));
              }}
              className="w-48 accent-primary"
              aria-label="Zoom"
            />
            <button
              onClick={() => handleZoom(0.1)}
              className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70"
              aria-label="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-6 max-w-md mx-auto w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-full border border-border text-foreground text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
          >
            Use photo
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageCropper;
