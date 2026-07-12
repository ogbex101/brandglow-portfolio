import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SiteSettingsPanel() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("site_settings").select("*");
    const m: Record<string, any> = {};
    (data ?? []).forEach((r: any) => {
      m[r.key] = r.value;
    });
    setSettings(m);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveSetting(key: string) {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: settings[key] })
      .eq("key", key);
    if (error) toast.error(error.message);
    else toast.success("Saved.");
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  return (
    <Tabs defaultValue="hero">
      <TabsList>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
      </TabsList>

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
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, headline: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                Subheading
                <Textarea
                  rows={3}
                  value={settings.hero.subheading ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, subheading: e.target.value },
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                CTA text
                <Input
                  value={settings.hero.cta ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, hero: { ...settings.hero, cta: e.target.value } })
                  }
                />
              </label>
              <label className="block text-sm">
                Fallback image URL
                <Input
                  value={settings.hero.fallback_image ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, fallback_image: e.target.value },
                    })
                  }
                />
              </label>
              <div>
                <div className="mb-1 text-sm font-medium">
                  Video URLs (played in order, looping):
                </div>
                {(settings.hero.videos ?? ["", "", "", ""]).map((v: string, i: number) => (
                  <Input
                    key={i}
                    placeholder={`Video ${i + 1} URL`}
                    className="mb-2"
                    value={v}
                    onChange={(e) => {
                      const vids = [...(settings.hero.videos ?? [])];
                      vids[i] = e.target.value;
                      setSettings({ ...settings, hero: { ...settings.hero, videos: vids } });
                    }}
                  />
                ))}
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
              <label className="block text-sm">
                Avatar URL
                <Input
                  value={settings.about.avatar_url ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, avatar_url: e.target.value },
                    })
                  }
                />
              </label>
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
