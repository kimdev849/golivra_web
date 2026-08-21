import { useState, useRef, useCallback, useEffect } from "react";

type Props = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export function GalleryViewer({ images, initialIndex, onClose, onIndexChange }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastTap = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback((newIndex: number) => {
    setIndex(newIndex);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    onIndexChange?.(newIndex);
  }, [onIndexChange]);

  const goNext = useCallback(() => {
    if (index < images.length - 1) navigate(index + 1);
    else navigate(0);
  }, [index, images.length, navigate]);

  const goPrev = useCallback(() => {
    if (index > 0) navigate(index - 1);
    else navigate(images.length - 1);
  }, [index, images.length, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Touch/mouse handlers for swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale > 1) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, tx: translateX, ty: translateY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: 0, ty: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (scale > 1) {
      setTranslateX(dragStart.current.tx + dx);
      setTranslateY(dragStart.current.ty + dy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const dx = e.clientX - dragStart.current.x;

    if (scale > 1) {
      // Snap back if dragged too far
      if (Math.abs(translateX) > 100) {
        setTranslateX(0);
        setTranslateY(0);
      }
      return;
    }

    // Swipe detection (min 50px)
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // Double-tap to toggle zoom
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (scale > 1) {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
      } else {
        setScale(2.5);
        // Zoom toward tap position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          setTranslateX(-x * 1.5);
          setTranslateY(-y * 1.5);
        }
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((prev) => Math.max(1, Math.min(5, prev + delta)));
    if (scale + delta <= 1) {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        <span className="text-white/80 text-sm font-semibold">
          {index + 1} / {images.length}
        </span>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-bold hover:bg-white/20 transition">
          ×
        </button>
      </div>

      {/* Main image area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleTap}
        onWheel={handleWheel}
      >
        <img
          src={images[index]}
          alt=""
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
          draggable={false}
        />
      </div>

      {/* Arrow buttons (desktop) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white text-lg hover:bg-white/20 transition z-10"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white text-lg hover:bg-white/20 transition z-10"
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 py-4 px-4 overflow-x-auto no-scrollbar">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); navigate(i); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                i === index ? "border-white" : "border-white/30 opacity-60"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom hint */}
      <p className="text-white/40 text-[11px] text-center pb-3">
        Double-cliquez pour zoomer · Glissez pour naviguer
      </p>
    </div>
  );
}
