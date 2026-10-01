import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessagesPanel } from "@/components/admin/messages-panel";
import { SiteSettingsPanel } from "@/components/admin/site-settings-panel";
import { SamplesManager } from "@/components/admin/samples-manager";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import { CollectionEditor, type FieldConfig } from "@/components/admin/collection-editor";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin | Daniel Ogbeifun Osewe" }] }),
  component: Admin,
});

type Tab =
  | "analytics"
  | "messages"
  | "site"
  | "niches"
  | "work"
  | "services"
  | "skills"
  | "metrics"
  | "credentials"
  | "packages"
  | "brands"
  | "testimonials"
  | "process"
  | "faqs";

const NAV: { group: string; items: [Tab, string][] }[] = [
  {
    group: "Overview",
    items: [
      ["analytics", "Analytics"],
      ["messages", "Messages"],
    ],
  },
  {
    group: "Site",
    items: [
      ["site", "Hero / About / Contact"],
      ["niches", "Niches"],
    ],
  },
  { group: "Work", items: [["work", "Work Samples"]] },
  {
    group: "Content",
    items: [
      ["services", "Services"],
      ["skills", "Skills"],
      ["metrics", "Results"],
      ["credentials", "Credentials"],
      ["packages", "Packages"],
      ["brands", "Brands"],
      ["testimonials", "Testimonials"],
      ["process", "Process"],
      ["faqs", "FAQ"],
    ],
  },
];

const collectionConfigs: Record<
  string,
  {
    table: string;
    title: string;
    titleField: string;
    subtitleField?: string;
    fields: FieldConfig[];
  }
> = {
  niches: {
    table: "niches",
    title: "Niches",
    titleField: "name",
    fields: [{ key: "name", label: "Name", type: "text", placeholder: "e.g. Email Marketing" }],
  },
  services: {
    table: "services",
    title: "Services",
    titleField: "title",
    subtitleField: "description",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon (lucide-react name)", type: "text", placeholder: "Sparkles" },
    ],
  },
  skills: {
    table: "skills",
    title: "Skills",
    titleField: "name",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "proficiency", label: "Proficiency (0-100)", type: "number", defaultValue: 80 },
    ],
  },
  metrics: {
    table: "metrics",
    title: "Results (Open & Response Rate)",
    titleField: "brand_name",
    subtitleField: "metric_label",
    fields: [
      { key: "brand_name", label: "Brand name", type: "text" },
      {
        key: "metric_label",
        label: "Metric label",
        type: "text",
        defaultValue: "Open & Response Rate",
      },
      { key: "open_rate", label: "Open rate", type: "text", placeholder: "e.g. 68%" },
      { key: "response_rate", label: "Response rate", type: "text", placeholder: "e.g. 34%" },
      {
        key: "metric_value",
        label: "Legacy single value (fallback if open/response left blank)",
        type: "text",
      },
    ],
  },
  credentials: {
    table: "credentials",
    title: "Credentials",
    titleField: "name",
    subtitleField: "category",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "status", label: "Status", type: "text", defaultValue: "Pursuing" },
    ],
  },
  packages: {
    table: "packages",
    title: "Packages",
    titleField: "name",
    subtitleField: "description",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "features", label: "Features", type: "list" },
    ],
  },
  brands: {
    table: "brands",
    title: "Brands",
    titleField: "name",
    subtitleField: "description",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "logo_url", label: "Logo URL", type: "text" },
      { key: "case_study_enabled", label: "Case study enabled", type: "boolean" },
    ],
  },
  testimonials: {
    table: "testimonials",
    title: "Testimonials",
    titleField: "author",
    subtitleField: "quote",
    fields: [
      { key: "author", label: "Author", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "rating", label: "Rating (1-5)", type: "number", defaultValue: 5 },
      { key: "avatar_url", label: "Avatar URL", type: "text" },
    ],
  },
  process: {
    table: "process_steps",
    title: "Process Steps",
    titleField: "title",
    subtitleField: "description",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  faqs: {
    table: "faqs",
    title: "FAQ",
    titleField: "question",
    subtitleField: "answer",
    fields: [
      { key: "question", label: "Question", type: "text" },
      { key: "answer", label: "Answer", type: "textarea" },
    ],
  },
};

function Admin() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        nav({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const admin = (roles ?? []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      setReady(true);
    })();
  }, [nav]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <p className="mb-4">Your account is signed in but not an admin.</p>
            <Button onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );

  const collection = collectionConfigs[tab];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-display font-bold">
              Admin
            </Link>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-8">
        <nav className="w-52 shrink-0 space-y-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          {tab === "analytics" && <AnalyticsPanel />}
          {tab === "messages" && <MessagesPanel />}
          {tab === "site" && <SiteSettingsPanel />}
          {tab === "work" && <SamplesManager />}
          {collection && (
            <CollectionEditor
              table={collection.table}
              title={collection.title}
              fields={collection.fields}
              titleField={collection.titleField}
              subtitleField={collection.subtitleField}
            />
          )}
        </main>
      </div>
    </div>
  );
}
