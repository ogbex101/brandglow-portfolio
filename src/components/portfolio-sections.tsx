import { useEffect, useMemo, useRef, useState } from "react";
import { HeroVideoSequence } from "@/components/hero-video-sequence";
import { ContactForm } from "@/components/contact-form";
import { ItemCarousel } from "@/components/carousel/item-carousel";
import { SamplePreviewDialog, type PreviewProject } from "@/components/sample-preview-dialog";
import { SiteSearch } from "@/components/site-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/animated/reveal";
import { AnimatedCounter } from "@/components/animated/counter";
import { AnimatedProgress } from "@/components/animated/progress-bar";
import { WordReveal } from "@/components/animated/word-reveal";
import {
  bioParagraphs,
  cleanProjects,
  isEarned,
  isPlaceholderImage,
  phoneDisplay,
  telHref,
  whatsappHref,
} from "@/lib/display";
import { useTilt } from "@/hooks/use-tilt";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";
import { ArrowRight, Mail, Phone, MessageCircle, Check, Play, Heart } from "lucide-react";

interface Data {
  settings: Record<string, any>;
  services: any[];
  skills: any[];
  metrics: any[];
  credentials: any[];
  packages: any[];
  projects: any[];
  brands: any[];
  testimonials: any[];
  process_steps: any[];
  faqs: any[];
  niches: any[];
}

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Ico = (name && (Icons as any)[name]) || Icons.Sparkles;
  return <Ico className={className} />;
}

/** Video thumbnail that plays muted preview on hover. */
function VideoThumb({
  src,
  poster,
  label,
}: {
  src?: string | null;
  poster?: string | null;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  if (!src) {
    return (
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 px-6 text-center text-2xl font-display font-bold">
        {label}
      </div>
    );
  }
  return (
    <div
      className="media-hover relative h-48 bg-black"
      onMouseEnter={() => {
        const v = ref.current;
        if (v) {
          v.currentTime = 0;
          v.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        const v = ref.current;
        if (v) v.pause();
      }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
        <Play className="h-10 w-10 text-white/90" />
      </div>
    </div>
  );
}

/** Ambient floating gradient blobs used for a cheap sense of 3D depth behind
 *  sections that don't already have video/media filling the space. */
function DepthField({ variant = "a" }: { variant?: "a" | "b" }) {
  const colors =
    variant === "a" ? ["bg-primary/30", "bg-accent/20"] : ["bg-accent/25", "bg-primary/20"];
  return (
    <div className="depth-field">
      <div className={`blob left-[8%] top-[10%] h-64 w-64 ${colors[0]}`} />
      <div
        className={`blob right-[10%] bottom-[5%] h-72 w-72 ${colors[1]}`}
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
}

function TiltWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const tilt = useTilt<HTMLDivElement>({ max: 6, scale: 1.015 });
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      className={className}
    >
      {children}
    </div>
  );
}

function ServiceCard({ s }: { s: any }) {
  return (
    <Card className="card-lift group h-full border-border/60 bg-card hover:border-primary/60">
      <CardHeader>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <DynamicIcon name={s.icon} className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">{s.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{s.description}</CardContent>
    </Card>
  );
}

function SkillCard({ s, index }: { s: any; index: number }) {
  return (
    <Card className="card-lift h-full border-border/60">
      <CardContent className="pt-6">
        <div className="mb-3 flex justify-between text-sm">
          <span className="font-medium">{s.name}</span>
          <span className="text-muted-foreground">
            <AnimatedCounter value={`${s.proficiency}%`} delay={index * 60} />
          </span>
        </div>
        <AnimatedProgress value={s.proficiency} delay={index * 60} />
      </CardContent>
    </Card>
  );
}

function MetricCard({ m, index }: { m: any; index: number }) {
  const hasSplit = m.open_rate || m.response_rate;
  return (
    <Card className="card-lift h-full border-border/60 text-center">
      <CardContent className="pt-8 pb-6">
        {hasSplit ? (
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-3xl font-bold md:text-4xl">
                <AnimatedCounter
                  className="text-gradient"
                  value={m.open_rate || "0%"}
                  delay={index * 90}
                />
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Open</div>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div>
              <div className="text-3xl font-bold md:text-4xl">
                <AnimatedCounter
                  className="text-gradient"
                  value={m.response_rate || "0%"}
                  delay={index * 90 + 80}
                />
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                Response
              </div>
            </div>
          </div>
        ) : (
          <div className="text-5xl font-bold md:text-6xl">
            {/* The gradient sits on the counter itself: on the parent, the
                counter's own transform layer escapes background-clip:text and
                the number renders invisible. */}
            <AnimatedCounter className="text-gradient" value={m.metric_value} delay={index * 90} />
          </div>
        )}
        <div className="mt-3 text-sm text-muted-foreground">{m.metric_label}</div>
        <div className="mt-1 font-medium">{m.brand_name}</div>
      </CardContent>
    </Card>
  );
}

function PackageCard({ p }: { p: any }) {
  return (
    <Card className="card-lift flex h-full flex-col border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">{p.name}</CardTitle>
        {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {(p.features as string[]).map((f, k) => (
            <li key={k} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6 pt-0">
        <Button className="w-full hover-scale" variant="outline" asChild>
          <a href="#contact">Inquire</a>
        </Button>
      </div>
    </Card>
  );
}

function BrandCard({ b }: { b: any }) {
  return (
    <Card className="card-lift h-full border-border/60 text-center">
      <CardContent className="p-6">
        {b.logo_url && (
          <div className="media-hover mb-4 flex h-32 items-center justify-center rounded-lg bg-background p-4">
            <img src={b.logo_url} alt={b.name} className="max-h-full max-w-full object-contain" />
          </div>
        )}
        <h3 className="mb-2 font-semibold">{b.name}</h3>
        <p className="text-xs text-muted-foreground">{b.description}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ t }: { t: any }) {
  return (
    <TiltWrapper className="h-full">
      <Card className="card-lift h-full">
        <CardContent className="pt-6">
          <p className="mb-4 italic">"{t.quote}"</p>
          <div className="font-semibold">{t.author}</div>
          <div className="text-sm text-muted-foreground">{t.role}</div>
        </CardContent>
      </Card>
    </TiltWrapper>
  );
}

function SampleCard({ p, onOpen }: { p: any; onOpen: (p: any) => void }) {
  const image = isPlaceholderImage(p.image_url) ? null : p.image_url;
  return (
    <TiltWrapper>
      <Card
        className="card-lift group h-full cursor-pointer overflow-hidden border-border/60"
        onClick={() => onOpen(p)}
      >
        {p.video_url ? (
          <VideoThumb src={p.video_url} poster={image ?? undefined} label={p.title} />
        ) : image ? (
          <div className="media-hover h-48">
            <img src={image} alt={p.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 px-6 text-center text-2xl font-display font-bold transition-transform duration-700 group-hover:scale-105">
            {p.title}
          </div>
        )}
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs uppercase tracking-widest text-primary">
              {p.niche_name || p.category}
            </p>
            {p.tag && <Badge variant="outline">{p.tag}</Badge>}
          </div>
          <h3 className="mb-2 text-xl font-semibold">{p.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="story-link inline-flex items-center gap-1 text-sm text-primary">
              Preview <ArrowRight className="h-3 w-3" />
            </span>
            {p.likes_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-3 w-3" /> {p.likes_count}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </TiltWrapper>
  );
}

export function PortfolioSections({ data }: { data: Data }) {
  const hero = data.settings.hero ?? {};
  const about = data.settings.about ?? {};
  const contact = data.settings.contact ?? {};
  const site = data.settings.site ?? {};

  // What a visitor sees: each project once, no placeholder cards, and only
  // credentials actually earned. Everything stays editable in the admin.
  const projects = useMemo(() => cleanProjects(data.projects), [data.projects]);
  const credentials = data.credentials.filter((c) => isEarned(c.status));
  const whatsappLink = whatsappHref(contact.whatsapp);
  const phoneLink = telHref(contact.phone);

  const credByCategory: Record<string, any[]> = {};
  credentials.forEach((c) => {
    (credByCategory[c.category] ??= []).push(c);
  });
  const credGroups = Object.entries(credByCategory);

  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<PreviewProject | null>(null);
  const trackedView = useRef(false);
  const avatarTilt = useTilt<HTMLDivElement>({ max: 8, scale: 1.03 });

  const nicheCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.niche_id) counts[p.niche_id] = (counts[p.niche_id] ?? 0) + 1;
    });
    return counts;
  }, [projects]);
  const activeNiches = useMemo(
    () => data.niches.filter((n) => nicheCounts[n.id] > 0),
    [data.niches, nicheCounts],
  );
  const filteredProjects = useMemo(
    () => (activeNiche ? projects.filter((p) => p.niche_id === activeNiche) : projects),
    [projects, activeNiche],
  );

  useEffect(() => {
    if (trackedView.current) return;
    trackedView.current = true;
    supabase
      .from("page_views")
      .insert({ path: window.location.pathname })
      .then(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight transition-colors hover:text-primary"
          >
            {site.name ?? "Daniel Ogbeifun"}
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            {[
              ["about", "About"],
              ["services", "Services"],
              ["work", "Work"],
              ["packages", "Packages"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="story-link transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <SiteSearch data={{ ...data, projects }} onOpenProject={setPreviewProject} />
            <Button size="sm" className="hover-scale" asChild>
              <a href="#contact">Get in touch</a>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative flex min-h-screen items-center overflow-hidden">
        <HeroVideoSequence videos={hero.videos ?? []} fallbackImage={hero.fallback_image} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-32 text-center md:px-8">
          <Reveal>
            <Badge variant="secondary" className="mb-6">
              {site.tagline ?? "Digital Marketer & Brand Strategist"}
            </Badge>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
              {(hero.headline ?? "Strategy. Design. Growth.")
                .split(".")
                .filter(Boolean)
                .map((word: string, i: number, arr: string[]) => (
                  <span key={i}>
                    <span className={i === arr.length - 1 ? "text-gradient" : ""}>
                      {word.trim()}.
                    </span>{" "}
                  </span>
                ))}
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {hero.subheading}
            </p>
          </Reveal>
          <Reveal delay={340}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="hover-scale" asChild>
                <a href="#work">
                  {hero.cta ?? "View My Work"}{" "}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="hover-scale" asChild>
                <a href="#contact">Get in touch</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-pad relative mx-auto max-w-6xl px-4 md:px-8">
        <DepthField variant="a" />
        <div className="grid gap-14 md:grid-cols-[5fr_7fr] md:items-center">
          {about.avatar_url && (
            <Reveal className="mx-auto md:mx-0">
              <div
                ref={avatarTilt.ref}
                onMouseMove={avatarTilt.onMouseMove}
                onMouseLeave={avatarTilt.onMouseLeave}
                style={avatarTilt.style}
                className="group relative mx-auto w-full max-w-sm"
              >
                {/* animated gradient orb */}
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/40 via-accent/30 to-transparent opacity-70 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
                {/* decorative frame offset */}
                <div className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border border-primary/40 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1" />
                {/* photo */}
                <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-elegant)] ring-1 ring-border/60">
                  <img
                    src={about.avatar_url}
                    alt="Daniel Ogbeifun"
                    className="aspect-[4/5] h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
                {/* floating badge */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-background/90 px-4 py-2 text-xs font-medium backdrop-blur shadow-lg">
                  <span className="text-primary">●</span> Available for new projects
                </div>
              </div>
            </Reveal>
          )}
          <div>
            <Reveal>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-primary">About</p>
            </Reveal>
            <WordReveal
              text={about.headline ?? ""}
              className="mb-6 text-4xl font-bold leading-tight md:text-5xl"
              delayBase={120}
            />
            <Reveal delay={320}>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                {bioParagraphs(about.bio ?? "").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
            {about.pull_quote && (
              <Reveal delay={480}>
                <blockquote className="mt-8 border-l-4 border-primary pl-6 text-2xl font-display italic text-foreground">
                  "{about.pull_quote}"
                </blockquote>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      {data.services.length > 0 && (
        <section id="services" className="section-pad bg-card/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-widest text-primary">What I Do</p>
              <h2 className="text-4xl font-bold md:text-5xl">Services</h2>
            </Reveal>
            <Reveal>
              <ItemCarousel
                items={data.services}
                getKey={(s) => s.id}
                ariaLabel="Services"
                basisClassName="basis-full sm:basis-1/2 lg:basis-1/3"
                renderItem={(s) => <ServiceCard s={s} />}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* SKILLS */}
      {data.skills.length > 0 && (
        <section id="skills" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Toolkit</p>
            <h2 className="text-4xl font-bold md:text-5xl">Skills</h2>
          </Reveal>
          <Reveal>
            <ItemCarousel
              items={data.skills}
              getKey={(s) => s.id}
              ariaLabel="Skills"
              basisClassName="basis-full sm:basis-1/2 lg:basis-1/3"
              renderItem={(s, i) => <SkillCard s={s} index={i} />}
            />
          </Reveal>
        </section>
      )}

      {/* METRICS */}
      {data.metrics.length > 0 && (
        <section id="results" className="section-pad bg-card/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-widest text-primary">Results</p>
              <h2 className="text-4xl font-bold md:text-5xl">Measured Results</h2>
            </Reveal>
            <Reveal>
              <ItemCarousel
                items={data.metrics}
                getKey={(m) => m.id}
                ariaLabel="Results"
                basisClassName="basis-full sm:basis-1/2 lg:basis-1/3"
                renderItem={(m, i) => <MetricCard m={m} index={i} />}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* CREDENTIALS */}
      {credGroups.length > 0 && (
        <section id="credentials" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">
              Continuous Learning
            </p>
            <h2 className="text-4xl font-bold md:text-5xl">Credentials</h2>
          </Reveal>
          <Reveal>
            <ItemCarousel
              items={credGroups}
              getKey={([cat]) => cat}
              ariaLabel="Credentials"
              basisClassName="basis-full md:basis-1/2"
              renderItem={([cat, items]) => (
                <Card className="card-lift h-full border-border/60">
                  <CardContent className="pt-6">
                    <div className="mb-3 flex items-baseline gap-3">
                      <h3 className="text-lg font-semibold">{cat}</h3>
                      <span className="text-sm text-muted-foreground">{items.length} items</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="cursor-default px-3 py-1.5 text-sm transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
                        >
                          {c.name} <span className="ml-2 text-xs opacity-60">· {c.status}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          </Reveal>
        </section>
      )}

      {/* PACKAGES */}
      {data.packages.length > 0 && (
        <section id="packages" className="section-pad bg-card/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-widest text-primary">Work With Me</p>
              <h2 className="text-4xl font-bold md:text-5xl">Packages</h2>
            </Reveal>
            <Reveal>
              <ItemCarousel
                items={data.packages}
                getKey={(p) => p.id}
                ariaLabel="Packages"
                basisClassName="basis-full sm:basis-1/2 lg:basis-1/3"
                renderItem={(p) => <PackageCard p={p} />}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* PROJECTS / WORK SAMPLES */}
      <section id="work" className="section-pad mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="mb-8 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Portfolio</p>
          <h2 className="text-4xl font-bold md:text-5xl">Selected Work</h2>
        </Reveal>
        {activeNiches.length > 0 && (
          <Reveal className="mb-10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveNiche(null)}
              className={`hover-scale rounded-full border px-4 py-1.5 text-sm transition-colors ${activeNiche === null ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            {activeNiches.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveNiche(n.id)}
                className={`hover-scale rounded-full border px-4 py-1.5 text-sm transition-colors ${activeNiche === n.id ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
              >
                {n.name} <span className="opacity-60">({nicheCounts[n.id]})</span>
              </button>
            ))}
          </Reveal>
        )}
        <Reveal>
          <ItemCarousel
            items={filteredProjects}
            getKey={(p) => p.id}
            ariaLabel="Selected work"
            basisClassName="basis-full sm:basis-1/2 lg:basis-1/3"
            renderItem={(p) => <SampleCard p={p} onOpen={setPreviewProject} />}
          />
        </Reveal>
        {filteredProjects.length === 0 && (
          <p className="text-center text-muted-foreground">No samples in this niche yet.</p>
        )}
      </section>
      <SamplePreviewDialog project={previewProject} onClose={() => setPreviewProject(null)} />

      {/* BRANDS */}
      {data.brands.length > 0 && (
        <section id="brands" className="section-pad bg-card/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-widest text-primary">Trusted By</p>
              <h2 className="text-4xl font-bold md:text-5xl">Brands</h2>
            </Reveal>
            <Reveal>
              <ItemCarousel
                items={data.brands}
                getKey={(b) => b.id}
                ariaLabel="Brands"
                basisClassName="basis-full sm:basis-1/2 lg:basis-1/4"
                renderItem={(b) => <BrandCard b={b} />}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {data.testimonials.length > 0 && (
        <section id="testimonials" className="section-pad relative mx-auto max-w-6xl px-4 md:px-8">
          <DepthField variant="b" />
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Client Reviews</p>
            <h2 className="text-4xl font-bold md:text-5xl">What Clients Say</h2>
          </Reveal>
          <Reveal>
            <ItemCarousel
              items={data.testimonials}
              getKey={(t) => t.id}
              ariaLabel="Testimonials"
              basisClassName="basis-full md:basis-1/2"
              renderItem={(t) => <TestimonialCard t={t} />}
            />
          </Reveal>
        </section>
      )}

      {/* PROCESS */}
      {data.process_steps.length > 0 && (
        <section id="process" className="section-pad bg-card/30">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal className="mb-12 text-center">
              <p className="mb-3 text-sm uppercase tracking-widest text-primary">How I Work</p>
              <h2 className="text-4xl font-bold md:text-5xl">Process</h2>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-5">
              {data.process_steps.map((step, i) => (
                <Reveal key={step.id} delay={i * 100}>
                  <div className="group relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-[var(--shadow-glow)]">
                      {i + 1}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section id="faq" className="section-pad mx-auto max-w-3xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Questions</p>
            <h2 className="text-4xl font-bold md:text-5xl">FAQ</h2>
          </Reveal>
          <Accordion type="single" collapsible className="w-full">
            {data.faqs.map((f, i) => (
              <Reveal key={f.id} delay={i * 60}>
                <AccordionItem value={f.id}>
                  <AccordionTrigger className="text-left text-lg hover:text-primary">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="section-pad relative bg-card/30">
        <DepthField variant="a" />
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Let's Talk</p>
            <h2 className="text-4xl font-bold md:text-5xl">Contact</h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <Reveal className="space-y-4">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-5 w-5 text-primary" /> {contact.email}
                </a>
              )}
              {phoneLink && (
                <a
                  href={phoneLink}
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="h-5 w-5 text-primary" /> {phoneDisplay(contact.phone)}
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp{" "}
                  {phoneDisplay(contact.whatsapp)}
                </a>
              )}
            </Reveal>
            <Reveal delay={120}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {site.name ?? "Daniel Ogbeifun"}. All rights reserved.
      </footer>
    </div>
  );
}
