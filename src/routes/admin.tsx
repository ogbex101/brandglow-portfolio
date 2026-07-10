import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { scrapeProject } from "@/lib/scrape.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Daniel Ogbeifun" }] }),
  component: Admin,
});

type Msg = { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string };
type Scraped = { url: string; title: string; category: string; tag: string; description: string; highlights: string[]; image_url: string; live_url: string };

function Admin() {
  const nav = useNavigate();
  const scrape = useServerFn(scrapeProject);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<"messages" | "hero" | "about" | "contact" | "import">("messages");
  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [preview, setPreview] = useState<Scraped | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { nav({ to: "/auth" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
      const admin = (roles ?? []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) await load();
      setReady(true);
    })();
  }, [nav]);

  async function load() {
    const [{ data: msgs }, { data: sett }] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*"),
    ]);
    setMessages((msgs as Msg[]) ?? []);
    const m: Record<string, any> = {};
    (sett ?? []).forEach((r: any) => { m[r.key] = r.value; });
    setSettings(m);
  }

  async function toggleRead(m: Msg) {
    await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    await load();
  }
  async function deleteMsg(id: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    await load();
  }
  async function saveSetting(key: string) {
    const { error } = await supabase.from("site_settings").update({ value: settings[key] }).eq("key", key);
    if (error) toast.error(error.message); else toast.success("Saved.");
  }
  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  async function runScrape() {
    const url = importUrl.trim();
    if (!url) return;
    setPreview(null);
    setScraping(true);
    try {
      const result = await scrape({ data: { url } });
      setPreview(result as Scraped);
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
      visible: true,
      sort_order: 999,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Added to Selected Work.");
    setPreview(null);
    setImportUrl("");
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!isAdmin) return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <p className="mb-4">Your account is signed in but not an admin.</p>
          <Button onClick={signOut}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-display font-bold">Admin</Link>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 p-4 md:p-8">
        <nav className="w-48 shrink-0 space-y-1">
          {[
            ["messages", `Messages${unread ? ` (${unread})` : ""}`],
            ["hero", "Hero"],
            ["about", "About"],
            ["contact", "Contact"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1">
          {tab === "messages" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact Messages</CardTitle>
                {unread > 0 && <Badge>{unread} unread</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                {messages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-lg border p-4 ${m.is_read ? "opacity-70" : "border-primary/40 bg-primary/5"}`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{m.name} <span className="text-sm text-muted-foreground">&lt;{m.email}&gt;</span></div>
                        {m.subject && <div className="text-sm font-medium">{m.subject}</div>}
                        <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => toggleRead(m)}>{m.is_read ? "Mark unread" : "Mark read"}</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMsg(m.id)}>Delete</Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "hero" && settings.hero && (
            <Card>
              <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm">Headline
                  <Input value={settings.hero.headline ?? ""} onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, headline: e.target.value } })} />
                </label>
                <label className="block text-sm">Subheading
                  <Textarea rows={3} value={settings.hero.subheading ?? ""} onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, subheading: e.target.value } })} />
                </label>
                <label className="block text-sm">CTA text
                  <Input value={settings.hero.cta ?? ""} onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, cta: e.target.value } })} />
                </label>
                <label className="block text-sm">Fallback image URL
                  <Input value={settings.hero.fallback_image ?? ""} onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, fallback_image: e.target.value } })} />
                </label>
                <div>
                  <div className="mb-1 text-sm font-medium">Video URLs (played in order, looping):</div>
                  {(settings.hero.videos ?? ["", "", "", ""]).map((v: string, i: number) => (
                    <Input key={i} placeholder={`Video ${i + 1} URL`} className="mb-2" value={v}
                      onChange={(e) => {
                        const vids = [...(settings.hero.videos ?? [])];
                        vids[i] = e.target.value;
                        setSettings({ ...settings, hero: { ...settings.hero, videos: vids } });
                      }} />
                  ))}
                </div>
                <Button onClick={() => saveSetting("hero")}>Save Hero</Button>
              </CardContent>
            </Card>
          )}

          {tab === "about" && settings.about && (
            <Card>
              <CardHeader><CardTitle>About Section</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm">Headline
                  <Input value={settings.about.headline ?? ""} onChange={(e) => setSettings({ ...settings, about: { ...settings.about, headline: e.target.value } })} />
                </label>
                <label className="block text-sm">Bio
                  <Textarea rows={10} value={settings.about.bio ?? ""} onChange={(e) => setSettings({ ...settings, about: { ...settings.about, bio: e.target.value } })} />
                </label>
                <label className="block text-sm">Pull quote
                  <Input value={settings.about.pull_quote ?? ""} onChange={(e) => setSettings({ ...settings, about: { ...settings.about, pull_quote: e.target.value } })} />
                </label>
                <label className="block text-sm">Avatar URL
                  <Input value={settings.about.avatar_url ?? ""} onChange={(e) => setSettings({ ...settings, about: { ...settings.about, avatar_url: e.target.value } })} />
                </label>
                <Button onClick={() => saveSetting("about")}>Save About</Button>
              </CardContent>
            </Card>
          )}

          {tab === "contact" && settings.contact && (
            <Card>
              <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm">Email
                  <Input value={settings.contact.email ?? ""} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })} />
                </label>
                <label className="block text-sm">Phone
                  <Input value={settings.contact.phone ?? ""} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, phone: e.target.value } })} />
                </label>
                <label className="block text-sm">WhatsApp
                  <Input value={settings.contact.whatsapp ?? ""} onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, whatsapp: e.target.value } })} />
                </label>
                <Button onClick={() => saveSetting("contact")}>Save Contact</Button>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            <strong>Note:</strong> Full CRUD editors for Services, Skills, Metrics, Credentials, Packages, Projects, Brands, Testimonials, Process, and FAQs are available in the database. Ask to build the visual editors when you need them.
          </div>
        </main>
      </div>
    </div>
  );
}
