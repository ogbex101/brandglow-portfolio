import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { HeroVideoSequence } from "@/components/hero-video-sequence";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/animated/reveal";
import { AnimatedCounter } from "@/components/animated/counter";
import { AnimatedProgress } from "@/components/animated/progress-bar";
import { WordReveal } from "@/components/animated/word-reveal";
import * as Icons from "lucide-react";
import { ArrowRight, Mail, Phone, MessageCircle, Check, Play } from "lucide-react";

interface Data {
  settings: Record<string, any>;
  services: any[]; skills: any[]; metrics: any[]; credentials: any[]; packages: any[];
  projects: any[]; brands: any[]; testimonials: any[]; process_steps: any[]; faqs: any[];
}

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Ico = (name && (Icons as any)[name]) || Icons.Sparkles;
  return <Ico className={className} />;
}

/** Video thumbnail that plays muted preview on hover. */
function VideoThumb({ src, poster, label }: { src?: string | null; poster?: string | null; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  if (!src) {
    return (
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-display font-bold">
        {label}
      </div>
    );
  }
  return (
    <div
      className="media-hover relative h-48 bg-black"
      onMouseEnter={() => { const v = ref.current; if (v) { v.currentTime = 0; v.play().catch(() => {}); } }}
      onMouseLeave={() => { const v = ref.current; if (v) v.pause(); }}
    >
      <video ref={ref} src={src} poster={poster ?? undefined} muted loop playsInline preload="metadata"
        className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
        <Play className="h-10 w-10 text-white/90" />
      </div>
    </div>
  );
}

export function PortfolioSections({ data }: { data: Data }) {
  const hero = data.settings.hero ?? {};
  const about = data.settings.about ?? {};
  const contact = data.settings.contact ?? {};
  const site = data.settings.site ?? {};

  const credByCategory: Record<string, any[]> = {};
  data.credentials.forEach((c) => { (credByCategory[c.category] ??= []).push(c); });

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#top" className="font-display text-lg font-bold tracking-tight transition-colors hover:text-primary">
            {site.name ?? "Daniel Ogbeifun"}
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            {[["about","About"],["services","Services"],["work","Work"],["packages","Packages"],["contact","Contact"]].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="story-link transition-colors hover:text-foreground">{label}</a>
            ))}
          </nav>
          <Link to="/auth"><Button variant="outline" size="sm" className="hover-scale">Sign In</Button></Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative flex min-h-screen items-center overflow-hidden">
        <HeroVideoSequence videos={hero.videos ?? []} fallbackImage={hero.fallback_image} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-32 text-center md:px-8">
          <Reveal>
            <Badge variant="secondary" className="mb-6">{site.tagline ?? "Digital Marketer & Brand Strategist"}</Badge>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
              {(hero.headline ?? "Strategy. Design. Growth.").split(".").filter(Boolean).map((word: string, i: number, arr: string[]) => (
                <span key={i}>
                  <span className={i === arr.length - 1 ? "text-gradient" : ""}>{word.trim()}.</span>{" "}
                </span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{hero.subheading}</p>
          </Reveal>
          <Reveal delay={340}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="hover-scale" asChild><a href="#work">{hero.cta ?? "View My Work"} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></a></Button>
              <Button size="lg" variant="outline" className="hover-scale" asChild><a href="#contact">Get in touch</a></Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:items-start">
          {about.avatar_url && (
            <Reveal className="mx-auto md:mx-0">
              <div className="media-hover mx-auto h-64 w-64 overflow-hidden rounded-2xl shadow-[var(--shadow-elegant)] md:mx-0">
                <img src={about.avatar_url} alt="Daniel Ogbeifun" className="h-full w-full object-cover" />
              </div>
            </Reveal>
          )}
          <Reveal delay={120}>
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">About</p>
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">{about.headline}</h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              {((about.bio ?? "").split(". ").reduce((acc: string[][], s: string, i: number) => {
                const chunk = Math.floor(i / 3); (acc[chunk] ??= []).push(s); return acc;
              }, [] as string[][]) as string[][]).map((chunk: string[], i: number) => (
                <p key={i}>{chunk.join(". ")}</p>
              ))}
            </div>
            {about.pull_quote && (
              <blockquote className="mt-8 border-l-4 border-primary pl-6 text-2xl font-display italic text-foreground">
                "{about.pull_quote}"
              </blockquote>
            )}
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">What I Do</p>
            <h2 className="text-4xl font-bold md:text-5xl">Services</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.services.map((s, i) => (
              <Reveal key={s.id} delay={i * 60}>
                <Card className="card-lift group h-full border-border/60 bg-card hover:border-primary/60">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <DynamicIcon name={s.icon} className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">{s.description}</CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="section-pad mx-auto max-w-5xl px-4 md:px-8">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Toolkit</p>
          <h2 className="text-4xl font-bold md:text-5xl">Skills</h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {data.skills.map((s, i) => (
            <div key={s.id}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">
                  <AnimatedCounter value={`${s.proficiency}%`} delay={i * 90} />
                </span>
              </div>
              <AnimatedProgress value={s.proficiency} delay={i * 90} />
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section id="results" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Results</p>
            <h2 className="text-4xl font-bold md:text-5xl">Open & Response Rate</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((m, i) => (
              <Reveal key={m.id} delay={i * 90}>
                <Card className="card-lift h-full border-border/60 text-center">
                  <CardContent className="pt-8 pb-6">
                    <div className="text-5xl font-bold text-gradient md:text-6xl">
                      <AnimatedCounter value={m.metric_value} delay={i * 90} />
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">{m.metric_label}</div>
                    <div className="mt-1 font-medium">{m.brand_name}</div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section id="credentials" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Continuous Learning</p>
          <h2 className="text-4xl font-bold md:text-5xl">Credentials</h2>
        </Reveal>
        <div className="space-y-8">
          {Object.entries(credByCategory).map(([cat, items], ci) => (
            <Reveal key={cat} delay={ci * 100}>
              <div>
                <div className="mb-3 flex items-baseline gap-3">
                  <h3 className="text-lg font-semibold">{cat}</h3>
                  <span className="text-sm text-muted-foreground">
                    <AnimatedCounter value={`${items.length}`} delay={ci * 100} /> items
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((c, i) => (
                    <Reveal key={c.id} delay={ci * 100 + i * 30} as="span">
                      <Badge variant="secondary" className="cursor-default px-3 py-1.5 text-sm transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground">
                        {c.name} <span className="ml-2 text-xs opacity-60">· {c.status}</span>
                      </Badge>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Work With Me</p>
            <h2 className="text-4xl font-bold md:text-5xl">Packages</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.packages.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <Card className="card-lift flex h-full flex-col border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {(p.features as string[]).map((f, k) => (
                        <li key={k} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full hover-scale" variant="outline" asChild><a href="#contact">Inquire</a></Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="work" className="section-pad mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Portfolio</p>
          <h2 className="text-4xl font-bold md:text-5xl">Selected Work</h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {data.projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <Card className="card-lift group h-full overflow-hidden border-border/60">
                {p.video_url ? (
                  <VideoThumb src={p.video_url} poster={p.image_url} label={p.title} />
                ) : p.image_url ? (
                  <div className="media-hover h-48">
                    <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-display font-bold transition-transform duration-700 group-hover:scale-105">
                    {p.title}
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-primary">{p.category}</p>
                    {p.tag && <Badge variant="outline">{p.tag}</Badge>}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  {p.live_url && (
                    <a href={p.live_url} target="_blank" rel="noopener noreferrer"
                      className="story-link mt-3 inline-flex items-center gap-1 text-sm text-primary">
                      Visit site <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BRANDS */}
      <section id="brands" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Trusted By</p>
            <h2 className="text-4xl font-bold md:text-5xl">Brands</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.brands.map((b, i) => (
              <Reveal key={b.id} delay={i * 70}>
                <Card className="card-lift h-full border-border/60 text-center">
                  <CardContent className="p-6">
                    {b.logo_url && (
                      <div className="media-hover mb-4 flex h-32 items-center justify-center rounded-lg bg-background p-4">
                        <img src={b.logo_url} alt={b.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <h3 className="mb-2 font-semibold">{b.name}</h3>
                    <p className="mb-4 text-xs text-muted-foreground">{b.description}</p>
                    <Button variant="outline" size="sm" disabled={!b.case_study_enabled} className="w-full">
                      {b.case_study_enabled ? "View case study" : "Case study coming soon"}
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="section-pad mx-auto max-w-5xl px-4 md:px-8">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Client Reviews</p>
          <h2 className="text-4xl font-bold md:text-5xl">What Clients Say</h2>
        </Reveal>
        {data.testimonials.length === 0 ? (
          <Card className="border-dashed border-border/60"><CardContent className="p-12 text-center text-muted-foreground">
            {site.reviews_empty ?? "Reviews coming soon."}
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <Card className="card-lift h-full"><CardContent className="pt-6">
                  <p className="mb-4 italic">"{t.quote}"</p>
                  <div className="font-semibold">{t.author}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </CardContent></Card>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* PROCESS */}
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

      {/* FAQ */}
      <section id="faq" className="section-pad mx-auto max-w-3xl px-4 md:px-8">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Questions</p>
          <h2 className="text-4xl font-bold md:text-5xl">FAQ</h2>
        </Reveal>
        <Accordion type="single" collapsible className="w-full">
          {data.faqs.map((f, i) => (
            <Reveal key={f.id} delay={i * 60}>
              <AccordionItem value={f.id}>
                <AccordionTrigger className="text-left text-lg hover:text-primary">{f.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-pad bg-card/30">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Let's Talk</p>
            <h2 className="text-4xl font-bold md:text-5xl">Contact</h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <Reveal className="space-y-4">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
                  <Mail className="h-5 w-5 text-primary" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
                  <Phone className="h-5 w-5 text-primary" /> {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
                  <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp
                </a>
              )}
            </Reveal>
            <Reveal delay={120}><ContactForm /></Reveal>
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
