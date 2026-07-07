import { useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  videos: string[];
  fallbackImage?: string;
}

/**
 * Plays a sequence of muted videos with a smooth crossfade between each.
 * Loops continuously. Falls back to a static image if all videos fail.
 */
export function HeroVideoSequence({ videos, fallbackImage }: HeroVideoProps) {
  const list = videos.filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1 % Math.max(1, list.length));
  const [showNext, setShowNext] = useState(false);
  const [failed, setFailed] = useState(false);
  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setShowNext(false);
    const v = currentRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [current]);

  const handleTimeUpdate = () => {
    const v = currentRef.current;
    if (!v || !v.duration) return;
    // Start crossfade 0.8s before end.
    if (v.duration - v.currentTime <= 0.8 && !showNext) {
      setShowNext(true);
      const nv = nextRef.current;
      if (nv) { nv.currentTime = 0; nv.play().catch(() => {}); }
    }
  };

  const handleEnded = () => {
    if (list.length <= 1) {
      const v = currentRef.current; if (v) { v.currentTime = 0; v.play().catch(() => {}); }
      return;
    }
    const n = (current + 1) % list.length;
    const nn = (n + 1) % list.length;
    setCurrent(n);
    setNext(nn);
  };

  if (failed || list.length === 0) {
    return fallbackImage ? (
      <img src={fallbackImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary" />
    );
  }

  return (
    <>
      <video
        ref={currentRef}
        src={list[current]}
        muted
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => { if (list.length === 1) setFailed(true); else handleEnded(); }}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        style={{ opacity: showNext ? 0 : 1 }}
      />
      {list.length > 1 && (
        <video
          ref={nextRef}
          src={list[next]}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: showNext ? 1 : 0 }}
        />
      )}
      <div className="absolute inset-0 bg-background/40" />
    </>
  );
}
