import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";

type HeroMediaItem = { type: "video" | "image"; url: string; visible: boolean };

/** Reads the hero media list from settings, migrating the old `videos:
 *  string[]` shape (every entry a looping video, nothing to star) into the
 *  new `media: {type,url,visible}[]` shape on the fly. The DB isn't touched
 *  until the admin hits Save — this only affects what the editor shows. */
function heroMedia(hero: Record<string, any>): HeroMediaItem[] {
  if (Array.isArray(hero?.media)) return hero.media;
  return (hero?.videos ?? [])
    .filter((u: string) => u && u.trim())
    .map((url: string) => ({ type: "video" as const, url, visible: true }));
}

export function SiteSettingsPanel() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("site_settings").select("*");
    const m: Record<string, any> = {};
    (data ?? []).forEach((r: any) => {
      m[r.key] = r.value;
    });
    ["site", "hero", "about", "contact"].forEach((k) => {
      if (!(k in m)) m[k] = {};
    });
    m.hero = { ...m.hero, media: heroMedia(m.hero) };
    setSettings(m);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveSetting(key: string) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: settings[key] }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Saved.");
  }

  /** Writes a key straight to the DB, independent of whatever setSettings
   *  has or hasn't flushed yet — used for actions that should take effect
   *  immediately (an upload, a star toggle) rather than wait for the
   *  section's manual Save button. */
  async function persist(key: string, value: Record<string, any>) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
  }

  function setHero(patch: Record<string, any>) {
    setSettings({ ...settings, hero: { ...settings.hero, ...patch } });
  }
  function setMedia(media: HeroMediaItem[]) {
    setHero({ media });
  }
  async function updateMediaItem(i: number, patch: Partial<HeroMediaItem>, save = false) {
    const media = settings.hero.media.map((m: HeroMediaItem, idx: number) =>
      idx === i ? { ...m, ...patch } : m,
    );
    setMedia(media);
    if (save) await persist("hero", { ...settings.hero, media });
  }
  async function addMediaItem() {
    const media = [...(settings.hero.media ?? []), { type: "image", url: "", visible: true }];
    setMedia(media);
    await persist("hero", { ...settings.hero, media });
  }
  async function removeMediaItem(i: number) {
    const media = settings.hero.media.filter((_: HeroMediaItem, idx: number) => idx !== i);
    setMedia(media);
    await persist("hero", { ...settings.hero, media });
  }
  async function moveMediaItem(i: number, dir: -1 | 1) {
    const list = [...settings.hero.media];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setMedia(list);
    await persist("hero", { ...settings.hero, media: list });
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  return (
    <Tabs defaultValue="site">
      <TabsList>
        <TabsTrigger value="site">Site</TabsTrigger>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
      </TabsList>

      <TabsContent value="site" className="mt-4">
        {settings.site && (
          <Card>
            <CardHeader>
              <CardTitle>Site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm">
                Header name (shown top-left of the nav and in the footer)
                <Input
                  value={settings.site.name ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, site: { ...settings.site, name: e.target.value } })
                  }
                />
              </label>
              <label className="block text-sm">
                Tagline (the badge above the hero headline)
                <Input
                  value={settings.site.tagline ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      site: { ...settings.site, tagline: e.target.value },
                    })
                  }
                />
              </label>
              <Button onClick={() => saveSetting("site")}>Save Site</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="hero" className="mt-4">
        {settings.hero && (
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm">
                Headline
                <Input
                  value={settings.hero.headline ?? ""}
                  onChange={(e) => setHero({ headline: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Subheading
                <Textarea
                  rows={3}
                  value={settings.hero.subheading ?? ""}
                  onChange={(e) => setHero({ subheading: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                CTA text
                <Input
                  value={settings.hero.cta ?? ""}
                  onChange={(e) => setHero({ cta: e.target.value })}
                />
              </label>

              <div>
                <div className="mb-1 text-sm font-medium">
                  Fallback image (shown only if every media item below fails to load)
                </div>
                <MediaUploadField
                  folder="hero"
                  accept="image/*"
                  value={settings.hero.fallback_image ?? ""}
                  onChange={(url) => setHero({ fallback_image: url })}
                  onUploaded={(url) => persist("hero", { ...settings.hero, fallback_image: url })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Hero media</div>
                    <p className="text-xs text-muted-foreground">
                      Mix videos and screenshots. Only starred items play in rotation on the live
                      site — keep the rest saved here to swap in later without re-uploading.
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addMediaItem}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
                {(settings.hero.media ?? []).map((item: HeroMediaItem, i: number) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={item.type}
                        onValueChange={(v: "video" | "image") => updateMediaItem(i, { type: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="image">Screenshot</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            disabled={i === 0}
                            onClick={() => moveMediaItem(i, -1)}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            disabled={i === settings.hero.media.length - 1}
                            onClick={() => moveMediaItem(i, 1)}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant={item.visible ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateMediaItem(i, { visible: !item.visible }, true)}
                          title={item.visible ? "Starred — shown live" : "Not shown live"}
                        >
                          <Star className={`h-4 w-4 ${item.visible ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMediaItem(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <MediaUploadField
                      folder="hero"
                      accept={item.type === "video" ? "video/*" : "image/*"}
                      value={item.url}
                      onChange={(url) => updateMediaItem(i, { url })}
                      onUploaded={(url) => updateMediaItem(i, { url }, true)}
                    />
                  </div>
                ))}
                {(settings.hero.media ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hero media yet — add a video or screenshot.
                  </p>
                )}
              </div>

              <Button onClick={() => saveSetting("hero")}>Save Hero</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="about" className="mt-4">
        {settings.about && (
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm">
                Headline
                <Input
                  value={settings.about.headline ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, headline: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Bio
                <Textarea
                  rows={10}
                  value={settings.about.bio ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, about: { ...settings.about, bio: e.target.value } })
                  }
                />
              </label>
              <label className="block text-sm">
                Pull quote
                <Input
                  value={settings.about.pull_quote ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, pull_quote: e.target.value },
                    })
                  }
                />
              </label>
              <div>
                <div className="mb-1 text-sm font-medium">Profile picture</div>
                <MediaUploadField
                  folder="avatars"
                  accept="image/*"
                  value={settings.about.avatar_url ?? ""}
                  onChange={(url) =>
                    setSettings({ ...settings, about: { ...settings.about, avatar_url: url } })
                  }
                  onUploaded={(url) => persist("about", { ...settings.about, avatar_url: url })}
                />
              </div>
              <Button onClick={() => saveSetting("about")}>Save About</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="contact" className="mt-4">
        {settings.contact && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm">
                Email
                <Input
                  value={settings.contact.email ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Phone
                <Input
                  value={settings.contact.phone ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phone: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                WhatsApp
                <Input
                  value={settings.contact.whatsapp ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, whatsapp: e.target.value },
                    })
                  }
                />
              </label>
              <Button onClick={() => saveSetting("contact")}>Save Contact</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
