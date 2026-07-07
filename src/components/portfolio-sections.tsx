import { Link } from "@tanstack/react-router";
import { HeroVideoSequence } from "@/components/hero-video-sequence";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as Icons from "lucide-react";
import { ArrowRight, Mail, Phone, MessageCircle, Check } from "lucide-react";

interface Data {
  settings: Record<string, any>;
  services: any[]; skills: any[]; metrics: any[]; credentials: any[]; packages: any[];
  projects: any[]; brands: any[]; testimonials: any[]; process_steps: any[]; faqs: any[];
}

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Ico = (name && (Icons as any)[name]) || Icons.Sparkles;
  return <Ico className={className} />;
}

export function PortfolioSections({ data }: { data: Data }) {
  const hero = data.settings.hero ?? {};
  const about = data.settings.about ?? {};
  const contact = data.settings.contact ?? {};
  const site = data.settings.site ?? {};

  // Group credentials by category
  const credByCategory: Record<string, any[]> = {};
  data.credentials.forEach((c) => {
    (credByCategory[c.category] ??= []).push(c);
  });

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#top" className="font-display text-lg font-bold tracking-tight">
            {site.name ?? "Daniel Ogbeifun"}
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#work" className="hover:text-foreground">Work</a>
            <a href="#packages" className="hover:text-foreground">Packages</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <Link to="/auth"><Button variant="outline" size="sm">Sign In</Button></Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative flex min-h-screen items-center overflow-hidden">
        <HeroVideoSequence videos={hero.videos ?? []} fallbackImage={hero.fallback_image} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-32 text-center md:px-8">
          <Badge variant="secondary" className="mb-6">{site.tagline ?? "Digital Marketer & Brand Strategist"}</Badge>
          <h1 className="text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
            {(hero.headline ?? "Strategy. Design. Growth.").split(".").filter(Boolean).map((word: string, i: number, arr: string[]) => (
              <span key={i}>
                <span className={i === arr.length - 1 ? "text-gradient" : ""}>{word.trim()}.</span>{" "}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{hero.subheading}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild><a href="#work">{hero.cta ?? "View My Work"} <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button size="lg" variant="outline" asChild><a href="#contact">Get in touch</a></Button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:items-start">
          {about.avatar_url && (
            <div className="mx-auto md:mx-0">
              <img src={about.avatar_url} alt="Daniel Ogbeifun"
                className="h-64 w-64 rounded-2xl object-cover shadow-[var(--shadow-elegant)]" />
            </div>
          )}
          <div>
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
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">What I Do</p>
            <h2 className="text-4xl font-bold md:text-5xl">Services</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.services.map((s) => (
              <Card key={s.id} className="group border-border/60 bg-card transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <DynamicIcon name={s.icon} className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{s.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="section-pad mx-auto max-w-5xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Toolkit</p>
          <h2 className="text-4xl font-bold md:text-5xl">Skills</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {data.skills.map((s) => (
            <div key={s.id}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.proficiency}%</span>
              </div>
              <Progress value={s.proficiency} className="h-2" />
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section id="results" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Results</p>
            <h2 className="text-4xl font-bold md:text-5xl">Open & Response Rate</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((m) => (
              <Card key={m.id} className="border-border/60 text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="text-5xl font-bold text-gradient md:text-6xl">{m.metric_value}</div>
                  <div className="mt-3 text-sm text-muted-foreground">{m.metric_label}</div>
                  <div className="mt-1 font-medium">{m.brand_name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section id="credentials" className="section-pad mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Continuous Learning</p>
          <h2 className="text-4xl font-bold md:text-5xl">Credentials</h2>
        </div>
        <div className="space-y-8">
          {Object.entries(credByCategory).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-3 text-lg font-semibold">{cat}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((c) => (
                  <Badge key={c.id} variant="secondary" className="px-3 py-1.5 text-sm">
                    {c.name} <span className="ml-2 text-xs opacity-60">· {c.status}</span>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Work With Me</p>
            <h2 className="text-4xl font-bold md:text-5xl">Packages</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.packages.map((p) => (
              <Card key={p.id} className="flex flex-col border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {(p.features as string[]).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button className="w-full" variant="outline" asChild><a href="#contact">Inquire</a></Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="work" className="section-pad mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Portfolio</p>
          <h2 className="text-4xl font-bold md:text-5xl">Selected Work</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {data.projects.map((p) => (
            <Card key={p.id} className="overflow-hidden border-border/60">
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-display font-bold">
                {p.title}
              </div>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-primary">{p.category}</p>
                  <Badge variant="outline">{p.tag}</Badge>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* BRANDS */}
      <section id="brands" className="section-pad bg-card/30">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Trusted By</p>
            <h2 className="text-4xl font-bold md:text-5xl">Brands</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.brands.map((b) => (
              <Card key={b.id} className="border-border/60 text-center">
                <CardContent className="p-6">
                  {b.logo_url && (
                    <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-background p-4">
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
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="section-pad mx-auto max-w-5xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Client Reviews</p>
          <h2 className="text-4xl font-bold md:text-5xl">What Clients Say</h2>
        </div>
        {data.testimonials.length === 0 ? (
          <Card className="border-dashed border-border/60"><CardContent className="p-12 text-center text-muted-foreground">
            {site.reviews_empty ?? "Reviews coming soon."}
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.testimonials.map((t) => (
              <Card key={t.id}><CardContent className="pt-6">
                <p className="mb-4 italic">"{t.quote}"</p>
                <div className="font-semibold">{t.author}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </section>

      {/* PROCESS */}
      <section id="process" className="section-pad bg-card/30">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">How I Work</p>
            <h2 className="text-4xl font-bold md:text-5xl">Process</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-5">
            {data.process_steps.map((step, i) => (
              <div key={step.id} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-pad mx-auto max-w-3xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-widest text-primary">Questions</p>
          <h2 className="text-4xl font-bold md:text-5xl">FAQ</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {data.faqs.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="text-left text-lg">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-pad bg-card/30">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-primary">Let's Talk</p>
            <h2 className="text-4xl font-bold md:text-5xl">Contact</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                  <Mail className="h-5 w-5 text-primary" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                  <Phone className="h-5 w-5 text-primary" /> {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp
                </a>
              )}
            </div>
            <ContactForm />
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
