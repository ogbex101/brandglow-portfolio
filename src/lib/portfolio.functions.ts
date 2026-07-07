import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getPortfolio = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [settings, services, skills, metrics, credentials, packages, projects, brands, testimonials, process_steps, faqs] =
    await Promise.all([
      sb.from("site_settings").select("*"),
      sb.from("services").select("*").eq("visible", true).order("sort_order"),
      sb.from("skills").select("*").eq("visible", true).order("sort_order"),
      sb.from("metrics").select("*").eq("visible", true).order("sort_order"),
      sb.from("credentials").select("*").eq("visible", true).order("sort_order"),
      sb.from("packages").select("*").eq("visible", true).order("sort_order"),
      sb.from("projects").select("*").eq("visible", true).order("sort_order"),
      sb.from("brands").select("*").eq("visible", true).order("sort_order"),
      sb.from("testimonials").select("*").eq("visible", true).order("sort_order"),
      sb.from("process_steps").select("*").eq("visible", true).order("sort_order"),
      sb.from("faqs").select("*").eq("visible", true).order("sort_order"),
    ]);
  const settingsMap: Record<string, any> = {};
  (settings.data ?? []).forEach((r: any) => { settingsMap[r.key] = r.value; });
  return {
    settings: settingsMap,
    services: services.data ?? [],
    skills: skills.data ?? [],
    metrics: metrics.data ?? [],
    credentials: credentials.data ?? [],
    packages: packages.data ?? [],
    projects: projects.data ?? [],
    brands: brands.data ?? [],
    testimonials: testimonials.data ?? [],
    process_steps: process_steps.data ?? [],
    faqs: faqs.data ?? [],
  };
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("contact_messages").insert({
      name: data.name, email: data.email, subject: data.subject ?? null, message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
