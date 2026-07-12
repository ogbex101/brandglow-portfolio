import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Rewind, FastForward, Play, Pause } from "lucide-react";

interface ItemCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  /** Tailwind basis classes per slide, e.g. responsive column count. */
  basisClassName?: string;
  autoPlayMs?: number;
  ariaLabel: string;
  className?: string;
}

/**
 * Horizontal slideshow used for every repeating-item section on the landing
 * page: auto-advances slowly, pauses on hover, and exposes rewind /
 * play-pause / fast-forward controls. Built on the existing embla-powered
 * Carousel primitives — no extra autoplay dependency, just a plain interval.
 */
export function ItemCarousel<T>({
  items,
  renderItem,
  getKey,
  basisClassName = "basis-full sm:basis-1/2 lg:basis-1/3",
  autoPlayMs = 3200,
  ariaLabel,
  className,
}: ItemCarouselProps<T>) {
  const [api, setApi] = useState<CarouselApi>();
  const [playing, setPlaying] = useState(true);
  const hoveringRef = useRef(false);

  const tick = useCallback(() => {
    if (!api) return;
    if (api.canScrollNext()) api.scrollNext();
    else api.scrollTo(0);
  }, [api]);

  useEffect(() => {
    if (!api || !playing || items.length <= 1) return;
    const id = window.setInterval(() => {
      if (hoveringRef.current) return;
      if (document.hidden) return;
      tick();
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [api, playing, autoPlayMs, items.length, tick]);

  if (items.length === 0) return null;

  return (
    <div
      className={className}
      onMouseEnter={() => {
        hoveringRef.current = true;
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
      }}
    >
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} aria-label={ariaLabel}>
        <CarouselContent>
          {items.map((item, i) => (
            <CarouselItem key={getKey(item, i)} className={basisClassName}>
              {renderItem(item, i)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="hover-scale rounded-full"
            aria-label="Rewind"
            onClick={() => api?.scrollPrev()}
          >
            <Rewind className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hover-scale rounded-full"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hover-scale rounded-full"
            aria-label="Fast forward"
            onClick={() => tick()}
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
