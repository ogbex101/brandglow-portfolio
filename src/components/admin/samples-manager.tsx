import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scrapeProject, scrapeSamples } from "@/lib/scrape.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, Trash2, Layers, Heart } from "lucide-react";

type Scraped = {
  url: string;
  title: string;
  category: string;
  tag: string;
  description: string;
  highlights: string[];
  image_url: string;
  live_url: string;
};
type Sample = {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  suggested_niche: string;
};
type Niche = { id: string; name: string };
type ProjectRow = {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  video_url: string | null;
  niche_id: string | null;
  visible: boolean;
  likes_count: number;
};

const UNASSIGNED = "__unassigned__";

export function SamplesManager() {
  const scrape = useServerFn(scrapeProject);
  const scrapeMany = useServerFn(scrapeSamples);

  const [niches, setNiches] = useState<Niche[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  // Single import
  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [preview, setPreview] = useState<Scraped | null>(null);
  const [previewNiche, setPreviewNiche] = useState<string>(UNASSIGNED);
  const [saving, setSaving] = useState(false);

  // Bulk (one summary per URL)
  const [bulkText, setBulkText] = useState("");
  const [bulkNiche, setBulkNiche] = useState<string>(UNASSIGNED);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkLog, setBulkLog] = useState<
    { url: string; status: "pending" | "ok" | "error"; msg?: string; title?: string }[]
  >([]);

  // Multi-sample extraction from one portfolio URL
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sampleNiches, setSampleNiches] = useState<string[]>([]);
  const [sampleChecked, setSampleChecked] = useState<boolean[]>([]);
  const [savingSamples, setSavingSamples] = useState(false);

  async function load() {
    const [{ data: n }, { data: p }] = await Promise.all([
      supabase.from("niches").select("id, name").order("sort_order"),
      supabase
        .from("projects")
        .select("id, title, category, image_url, video_url, niche_id, visible, likes_count")
        .order("sort_order"),
    ]);
    setNiches((n as Niche[]) ?? []);
    setProjects((p as ProjectRow[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function matchNiche(name: string): string {
    const found = niches.find((n) => n.name.toLowerCase() === name.trim().toLowerCase());
    return found?.id ?? UNASSIGNED;
  }

  async function runScrape() {
    const url = importUrl.trim();
    if (!url) return;
    setPreview(null);
    setScraping(true);
    try {
      const result = await scrape({ data: { url } });
      setPreview(result as Scraped);
      setPreviewNiche(matchNiche((result as Scraped).category));
      toast.success("Extracted. Review, edit, then save.");
    } catch (e: any) {
      toast.error(e?.message ?? "Extraction failed");
    } finally {
      setScraping(false);
    }
  }

  async function saveImported() {
    if (!preview) return;
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      title: preview.title,
      category: preview.category,
      tag: preview.tag || null,
      description: preview.description,
      image_url: preview.image_url || null,
      live_url: preview.live_url || null,
      niche_id: previewNiche === UNASSIGNED ? null : previewNiche,
      source_url: preview.url,
      visible: true,
      sort_order: 999,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added to Selected Work.");
    setPreview(null);
    setImportUrl("");
    await load();
  }

  async function runBulk() {
    const urls = Array.from(
      new Set(
        bulkText
          .split(/\s+/)
          .map((s) => s.trim())
          .filter((s) => /^https?:\/\//i.test(s)),
      ),
    );
    if (urls.length === 0) {
      toast.error("Paste at least one valid URL.");
      return;
    }
    setBulkRunning(true);
    setBulkLog(urls.map((url) => ({ url, status: "pending" as const })));
    let ok = 0,
      fail = 0;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const r = (await scrape({ data: { url } })) as Scraped;
        const { error } = await supabase.from("projects").insert({
          title: r.title,
          category: r.category || "Web",
          tag: r.tag || null,
          description: r.description,
          image_url: r.image_url || null,
          live_url: r.live_url || url,
          niche_id: bulkNiche === UNASSIGNED ? null : bulkNiche,
          source_url: url,
          visible: true,
          sort_order: 1000 + i,
        });
        if (error) throw new Error(error.message);
        ok++;
        setBulkLog((prev) =>
          prev.map((row, idx) => (idx === i ? { ...row, status: "ok", title: r.title } : row)),
        );
      } catch (e: any) {
        fail++;
        setBulkLog((prev) =>
          prev.map((row, idx) =>
            idx === i ? { ...row, status: "error", msg: e?.message ?? "failed" } : row,
          ),
        );
      }
    }
    setBulkRunning(false);
    toast.success(`Done — ${ok} added, ${fail} failed.`);
    await load();
  }

  async function runExtract() {
    const url = extractUrl.trim();
    if (!url) return;
    setSamples([]);
    setExtracting(true);
    try {
      const result = (await scrapeMany({ data: { url } })) as {
        sourceUrl: string;
        samples: Sample[];
      };
      setSamples(result.samples);
      setSampleNiches(result.samples.map((s) => matchNiche(s.suggested_niche)));
      setSampleChecked(result.samples.map(() => true));
      toast.success(
        `Found ${result.samples.length} sample${result.samples.length === 1 ? "" : "s"}. Review, assign niches, then save.`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function saveSamples() {
    const toSave = samples.filter((_, i) => sampleChecked[i]);
    if (toSave.length === 0) {
      toast.error("Select at least one sample.");
      return;
    }
    setSavingSamples(true);
    let ok = 0,
      fail = 0;
    for (let i = 0; i < samples.length; i++) {
      if (!sampleChecked[i]) continue;
      const s = samples[i];
      const nicheId = sampleNiches[i];
      const { error } = await supabase.from("projects").insert({
        title: s.title,
        description: s.description,
        image_url: s.image_url || null,
        live_url: s.link_url || extractUrl.trim(),
        niche_id: nicheId === UNASSIGNED ? null : nicheId,
        source_url: extractUrl.trim(),
        visible: true,
        sort_order: 2000 + i,
      });
      if (error) fail++;
      else ok++;
    }
    setSavingSamples(false);
    toast.success(`Saved ${ok} sample${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}.`);
    setSamples([]);
    setExtractUrl("");
    await load();
  }

  async function setProjectNiche(id: string, nicheId: string) {
    await supabase
      .from("projects")
      .update({ niche_id: nicheId === UNASSIGNED ? null : nicheId })
      .eq("id", id);
    await load();
  }
  async function toggleProjectVisible(row: ProjectRow) {
    await supabase.from("projects").update({ visible: !row.visible }).eq("id", row.id);
    await load();
  }
  async function deleteProject(row: ProjectRow) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    await supabase.from("projects").delete().eq("id", row.id);
    await load();
  }

  const nicheName = (id: string | null) => niches.find((n) => n.id === id)?.name;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Extract Samples from a Portfolio Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a link that is itself a portfolio containing several samples (e.g. someone's
            "work" page). AI scans the page and lists every distinct sample it finds — pick a niche
            for each, then save the ones you want.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/portfolio"
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runExtract();
              }}
            />
            <Button onClick={runExtract} disabled={extracting || !extractUrl.trim()}>
              {extracting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Extract
            </Button>
          </div>

          {samples.length > 0 && (
            <div className="space-y-3">
              {samples.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <Checkbox
                    checked={sampleChecked[i]}
                    onCheckedChange={(v) =>
                      setSampleChecked((prev) => prev.map((c, idx) => (idx === i ? !!v : c)))
                    }
                    className="mt-1"
                  />
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      value={s.title}
                      onChange={(e) =>
                        setSamples((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)),
                        )
                      }
                    />
                    <Textarea
                      rows={2}
                      value={s.description}
                      onChange={(e) =>
                        setSamples((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Select
                      value={sampleNiches[i]}
                      onValueChange={(v) =>
                        setSampleNiches((prev) => prev.map((n, idx) => (idx === i ? v : n)))
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Niche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>No niche</SelectItem>
                        {niches.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button onClick={saveSamples} disabled={savingSamples}>
                {savingSamples ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save selected samples
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Import Single Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.lovable.app"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runScrape();
              }}
            />
            <Button onClick={runScrape} disabled={scraping || !importUrl.trim()}>
              {scraping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Extract
            </Button>
          </div>
          {preview && (
            <div className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-4">
              {preview.image_url && (
                <img
                  src={preview.image_url}
                  alt=""
                  className="mb-2 h-40 w-full rounded object-cover"
                />
              )}
              <label className="block text-sm">
                Title
                <Input
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Category
                  <Input
                    value={preview.category}
                    onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Niche
                  <Select value={previewNiche} onValueChange={setPreviewNiche}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>No niche</SelectItem>
                      {niches.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="block text-sm">
                Description
                <Textarea
                  rows={3}
                  value={preview.description}
                  onChange={(e) => setPreview({ ...preview, description: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Live URL
                <Input
                  value={preview.live_url}
                  onChange={(e) => setPreview({ ...preview, live_url: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Cover image URL
                <Input
                  value={preview.image_url}
                  onChange={(e) => setPreview({ ...preview, image_url: e.target.value })}
                />
              </label>
              <div className="flex gap-2">
                <Button onClick={saveImported} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save to Selected Work
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Bulk Import (one summary per URL)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm">
            Niche for this batch (optional)
            <Select value={bulkNiche} onValueChange={setBulkNiche}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>No niche</SelectItem>
                {niches.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="block text-sm">
            URLs
            <Textarea
              rows={8}
              placeholder={"https://site-1.lovable.app\nhttps://site-2.lovable.app"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={runBulk} disabled={bulkRunning || !bulkText.trim()}>
              {bulkRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {bulkRunning ? "Importing…" : "Start bulk import"}
            </Button>
            {bulkLog.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {bulkLog.filter((r) => r.status === "ok").length} ok ·{" "}
                {bulkLog.filter((r) => r.status === "error").length} failed ·{" "}
                {bulkLog.filter((r) => r.status === "pending").length} pending
              </span>
            )}
          </div>
          {bulkLog.length > 0 && (
            <div className="max-h-80 space-y-1 overflow-auto rounded-md border border-border/60 p-2 text-xs">
              {bulkLog.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded px-2 py-1 ${r.status === "ok" ? "text-emerald-500" : r.status === "error" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  <span className="w-5 shrink-0">
                    {r.status === "ok" ? "✓" : r.status === "error" ? "✕" : "…"}
                  </span>
                  <span className="flex-1 truncate">
                    {r.url}
                    {r.title && <span className="ml-2 text-foreground">— {r.title}</span>}
                    {r.msg && <span className="ml-2 opacity-70">— {r.msg}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Samples ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.length === 0 && <p className="text-muted-foreground">No samples yet.</p>}
          {projects.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${p.visible ? "" : "opacity-50"}`}
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-xs">
                  {p.title[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.category && <span>{p.category}</span>}
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {p.likes_count}
                  </span>
                </div>
              </div>
              <Select
                value={p.niche_id ?? UNASSIGNED}
                onValueChange={(v) => setProjectNiche(p.id, v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Niche">
                    {nicheName(p.niche_id) ?? "No niche"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>No niche</SelectItem>
                  {niches.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch checked={p.visible} onCheckedChange={() => toggleProjectVisible(p)} />
              <Button variant="destructive" size="sm" onClick={() => deleteProject(p)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
