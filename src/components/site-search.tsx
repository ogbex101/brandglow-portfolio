import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { PreviewProject } from "@/components/sample-preview-dialog";

interface SearchData {
  services: any[];
  packages: any[];
  testimonials: any[];
  faqs: any[];
  brands: any[];
  credentials: any[];
  projects: (PreviewProject & { niche_name?: string | null })[];
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SiteSearch({
  data,
  onOpenProject,
}: {
  data: SearchData;
  onOpenProject: (p: PreviewProject) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(action: () => void) {
    setOpen(false);
    setTimeout(action, 80);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hover-scale gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search work samples, services, FAQs…" />
        <CommandList>
          <CommandEmpty>Nothing found. Try a different word.</CommandEmpty>

          {data.projects.length > 0 && (
            <CommandGroup heading="Work Samples">
              {data.projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.title} ${p.description ?? ""} ${p.niche_name ?? ""} ${p.category ?? ""}`}
                  onSelect={() =>
                    go(() => {
                      scrollToSection("work");
                      onOpenProject(p);
                    })
                  }
                >
                  {p.title}
                  {p.niche_name && (
                    <span className="ml-2 text-xs text-muted-foreground">{p.niche_name}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.services.length > 0 && (
            <CommandGroup heading="Services">
              {data.services.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.title} ${s.description}`}
                  onSelect={() => go(() => scrollToSection("services"))}
                >
                  {s.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.packages.length > 0 && (
            <CommandGroup heading="Packages">
              {data.packages.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.description ?? ""}`}
                  onSelect={() => go(() => scrollToSection("packages"))}
                >
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.brands.length > 0 && (
            <CommandGroup heading="Brands">
              {data.brands.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.name} ${b.description ?? ""}`}
                  onSelect={() => go(() => scrollToSection("brands"))}
                >
                  {b.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.testimonials.length > 0 && (
            <CommandGroup heading="Testimonials">
              {data.testimonials.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.author} ${t.quote}`}
                  onSelect={() => go(() => scrollToSection("testimonials"))}
                >
                  {t.author} —{" "}
                  <span className="text-muted-foreground">{t.quote.slice(0, 40)}…</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.credentials.length > 0 && (
            <CommandGroup heading="Credentials">
              {data.credentials.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.category}`}
                  onSelect={() => go(() => scrollToSection("credentials"))}
                >
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.faqs.length > 0 && (
            <CommandGroup heading="FAQ">
              {data.faqs.map((f) => (
                <CommandItem
                  key={f.id}
                  value={`${f.question} ${f.answer}`}
                  onSelect={() => go(() => scrollToSection("faq"))}
                >
                  {f.question}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
