import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, SyntheticEvent } from 'react';
import { IoClose } from 'react-icons/io5';

const MAX_SCALE = 5;
// Pinching below 1x rubber-bands down to this, then snaps back on release
const MIN_RUBBER_BAND_SCALE = 0.5;
const SETTLE_DURATION = 200;
// At 1x, a vertical drag past this distance (or a fast flick, in px/s) dismisses
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1000;
// Only pointer moves this recent count towards the flick velocity
const VELOCITY_WINDOW_MS = 100;
// Movement under this still counts as a tap
const TAP_SLOP = 5;
const DOUBLE_CLICK_SCALE = 2.5;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Point = { x: number; y: number };
type Pinch = { distance: number; mid: Point };

interface ZoomableImageProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  // A smaller, already-cached version of the same image shown until `source` loads
  placeholder?: string;
  alt?: string;
}

// Full-window image with pinch/wheel to zoom, pan, and swipe to dismiss at 1x.
// The viewer mounts fresh on every open, so zoom and load state never carry over.
export function ZoomableImage({ isOpen, ...props }: ZoomableImageProps) {
  if (!isOpen) return null;
  return <ZoomableImageViewer {...props} />;
}

function ZoomableImageViewer({ onClose, source, placeholder, alt }: Omit<ZoomableImageProps, 'isOpen'>) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Only mounts after a click, so window is always available
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Kept out of React state so pointer moves write straight to the DOM without re-rendering
  const transform = useRef({ scale: 1, x: 0, y: 0, dismissY: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({
    didPinch: false,
    moved: false,
    startedOnBackdrop: false,
    start: { x: 0, y: 0 } as Point,
    lastPinch: null as Pinch | null,
    samples: [] as { y: number; time: number }[],
  });

  // Size of the image as drawn at 1x with object-contain, used to keep panning within its edges.
  // Until the image loads, fall back to the window size.
  const fitScale = imageSize ? Math.min(viewport.width / imageSize.width, viewport.height / imageSize.height) : 1;
  const fitWidth = imageSize ? imageSize.width * fitScale : viewport.width;
  const fitHeight = imageSize ? imageSize.height * fitScale : viewport.height;

  const getMaxTranslate = (forScale: number) => ({
    x: Math.max(0, (fitWidth * forScale - viewport.width) / 2),
    y: Math.max(0, (fitHeight * forScale - viewport.height) / 2),
  });

  const applyTransform = (animate = false) => {
    const { scale, x, y, dismissY } = transform.current;
    if (imageRef.current) {
      imageRef.current.style.transition = animate ? `transform ${SETTLE_DURATION}ms ease-out` : 'none';
      imageRef.current.style.transform = `translate(${x}px, ${y + dismissY}px) scale(${scale})`;
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = animate ? `opacity ${SETTLE_DURATION}ms ease-out` : 'none';
      backdropRef.current.style.opacity = String(clamp(1 - Math.abs(dismissY) / (viewport.height / 2), 0, 1));
    }
  };

  // Keep the point under the cursor/fingers in place (focal point relative to the center)
  const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
    const t = transform.current;
    const factor = nextScale / t.scale;
    const focalX = clientX - viewport.width / 2;
    const focalY = clientY - viewport.height / 2;
    t.x = focalX - (focalX - t.x) * factor;
    t.y = focalY - (focalY - t.y) * factor;
    t.scale = nextScale;
  };

  const clampTranslate = () => {
    const t = transform.current;
    const max = getMaxTranslate(t.scale);
    t.x = clamp(t.x, -max.x, max.x);
    t.y = clamp(t.y, -max.y, max.y);
  };

  // Snap back to 1x, or keep the zoomed image covering the screen up to its edges
  const settle = () => {
    const t = transform.current;
    if (t.scale <= 1) {
      t.scale = 1;
      t.x = 0;
      t.y = 0;
      return;
    }
    clampTranslate();
  };

  const getPinch = (): Pinch => {
    const [a, b] = Array.from(pointers.current.values());
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const g = gesture.current;
    if (pointers.current.size === 0) {
      g.didPinch = false;
      g.moved = false;
      g.startedOnBackdrop = e.target === e.currentTarget;
      g.start = { x: e.clientX, y: e.clientY };
      g.samples = [];
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // Fingers drifting at the start of a pinch can count as a dismiss drag, so undo it
      g.didPinch = true;
      g.lastPinch = getPinch();
      transform.current.dismissY = 0;
      applyTransform();
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const g = gesture.current;
    const t = transform.current;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) > TAP_SLOP) {
      g.moved = true;
    }

    if (pointers.current.size >= 2) {
      const pinch = getPinch();
      if (g.lastPinch) {
        t.x += pinch.mid.x - g.lastPinch.mid.x;
        t.y += pinch.mid.y - g.lastPinch.mid.y;
        if (g.lastPinch.distance > 0) {
          const nextScale = clamp(t.scale * (pinch.distance / g.lastPinch.distance), MIN_RUBBER_BAND_SCALE, MAX_SCALE);
          zoomAt(nextScale, pinch.mid.x, pinch.mid.y);
        }
      }
      g.lastPinch = pinch;
    } else {
      // Only a one-pointer drag at 1x dismisses; anything else moves the image
      if (t.scale > 1 || g.didPinch) {
        t.x += e.clientX - previous.x;
        t.y += e.clientY - previous.y;
      } else {
        t.dismissY += e.clientY - previous.y;
        g.samples.push({ y: e.clientY, time: e.timeStamp });
      }
    }
    applyTransform();
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    const t = transform.current;

    // Lifting a finger mid-pinch leaves the rest pinching or panning from where they are
    g.lastPinch = pointers.current.size >= 2 ? getPinch() : null;
    if (pointers.current.size > 0) return;

    if (e.type === 'pointerup' && !g.moved && !g.didPinch && g.startedOnBackdrop) {
      onClose();
      return;
    }

    if (t.dismissY !== 0 && !g.didPinch) {
      const recent = g.samples.filter((sample) => e.timeStamp - sample.time < VELOCITY_WINDOW_MS);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const velocityY = first && last && last.time > first.time
        ? ((last.y - first.y) / (last.time - first.time)) * 1000
        : 0;
      if (Math.abs(t.dismissY) > DISMISS_DISTANCE || Math.abs(velocityY) > DISMISS_VELOCITY) {
        onClose();
        return;
      }
    }

    t.dismissY = 0;
    settle();
    applyTransform(true);
  };

  // A mouse has no pinch, so double-click toggles zoom at the cursor
  const handleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const t = transform.current;
    if (t.scale > 1) {
      t.scale = 1;
      t.x = 0;
      t.y = 0;
    } else {
      zoomAt(DOUBLE_CLICK_SCALE, e.clientX, e.clientY);
      clampTranslate();
    }
    applyTransform(true);
  };

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setImageSize({ width: naturalWidth, height: naturalHeight });
    }
  };

  // Mouse wheel and trackpad pinch zoom at the cursor. React's onWheel is passive, so it can't preventDefault.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinches arrive as ctrlKey wheel events with small deltas; Firefox can report lines instead of pixels
      const deltaY = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;
      const nextScale = clamp(transform.current.scale * Math.exp(-deltaY * (e.ctrlKey ? 0.01 : 0.002)), 1, MAX_SCALE);
      zoomAt(nextScale, e.clientX, e.clientY);
      clampTranslate();
      applyTransform();
    };

    surface.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      surface.removeEventListener('wheel', handleWheel);
    };
  }, [viewport, fitWidth, fitHeight]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle body scroll locking
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Handle focus management
  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    return () => {
      activeElement?.focus?.();
    };
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      // The close button is the only focusable element, so keep focus on it
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={alt}>
      <div ref={backdropRef} className="absolute inset-0 bg-black" />
      <div
        ref={surfaceRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <div ref={imageRef} className="relative shrink-0" style={{ width: fitWidth, height: fitHeight }}>
          {!!placeholder && (
            <img
              src={placeholder}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          {!!source && (
            <img
              src={source}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                handleImageLoad(e);
                setIsLoaded(true);
              }}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close"
      >
        <IoClose className="w-6 h-6" />
      </button>
    </div>
  );
}
