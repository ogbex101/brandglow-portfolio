import { useEffect, useRef, useState } from "react";

export interface HeroMediaItem {
  type: "video" | "image";
  url: string;
  visible?: boolean;
}

interface Props {
  media: HeroMediaItem[];
  fallbackImage?: string;
  /** How long a screenshot stays on screen before advancing, in ms. */
  imageDuration?: number;
}

/**
 * Plays a sequence of hero media — any mix of looping muted videos and
 * screenshots — with a smooth crossfade between each. Loops continuously.
 * Only items with `visible !== false` ("starred" in the admin) are shown;
 * falls back to a static image if nothing plays.
 */
export function HeroMediaSequence({ media, fallbackImage, imageDuration = 5000 }: Props) {
  const list = media.filter((m) => m.url && m.visible !== false);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1 % Math.max(1, list.length));
  const [showNext, setShowNext] = useState(false);
  const [failed, setFailed] = useState(false);
  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);

  const advance = () => {
    if (list.length <= 1) return;
    const n = (current + 1) % list.length;
    const nn = (n + 1) % list.length;
    setCurrent(n);
    setNext(nn);
  };

  useEffect(() => {
    setShowNext(false);
    const item = list[current];
    if (!item) return;

    if (item.type === "video") {
      const v = currentRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      return;
    }
    // Image: hold for imageDuration, then crossfade to the next item.
    const crossfadeAt = Math.max(0, imageDuration - 700);
    const t1 = window.setTimeout(() => {
      setShowNext(true);
      const nv = nextRef.current;
      if (nv && list[next]?.type === "video") {
        nv.currentTime = 0;
        nv.play().catch(() => {});
      }
    }, crossfadeAt);
    const t2 = window.setTimeout(advance, imageDuration);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, list.length]);

  const handleTimeUpdate = () => {
    const item = list[current];
    if (item?.type !== "video") return;
    const v = currentRef.current;
    if (!v || !v.duration) return;
    if (v.duration - v.currentTime <= 0.8 && !showNext) {
      setShowNext(true);
      const nv = nextRef.current;
      if (nv && list[next]?.type === "video") {
        nv.currentTime = 0;
        nv.play().catch(() => {});
      }
    }
  };

  const handleEnded = () => {
    if (list.length <= 1) {
      const v = currentRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      return;
    }
    advance();
  };

  if (failed || list.length === 0) {
    return fallbackImage ? (
      <img src={fallbackImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary" />
    );
  }

  const currentItem = list[current];
  const nextItem = list[next];

  return (
    <>
      {currentItem.type === "video" ? (
        <video
          ref={currentRef}
          src={currentItem.url}
          muted
          playsInline
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => {
            if (list.length === 1) setFailed(true);
            else advance();
          }}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: showNext ? 0 : 1 }}
        />
      ) : (
        <img
          src={currentItem.url}
          alt=""
          onError={() => {
            if (list.length === 1) setFailed(true);
            else advance();
          }}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: showNext ? 0 : 1 }}
        />
      )}
      {list.length > 1 &&
        (nextItem.type === "video" ? (
          <video
            ref={nextRef}
            src={nextItem.url}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: showNext ? 1 : 0 }}
          />
        ) : (
          <img
            src={nextItem.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: showNext ? 1 : 0 }}
          />
        ))}
      <div className="absolute inset-0 bg-background/40" />
    </>
  );
}
