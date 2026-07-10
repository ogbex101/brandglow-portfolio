import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const urlSchema = z.object({ url: z.string().trim().url().max(500) });

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Fetch a URL server-side, strip HTML to visible text, then use Lovable AI
 *  to extract a portfolio-project record from the page. Returns preview JSON;
 *  the admin decides whether to save. */
export const scrapeProject = createServerFn({ method: "POST" })
  .inputValidator((d) => urlSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // 1. Fetch page HTML (short timeout, forgive network failures)
    let html = "";
    try {
      const res = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioBot/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
      html = await res.text();
    } catch (e: any) {
      throw new Error(`Could not load ${data.url}: ${e?.message ?? e}`);
    }

    // 2. Extract obvious metadata from raw HTML
    const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
    const title = pick(/<title[^>]*>([^<]+)<\/title>/i);
    const desc =
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);

    // 3. Strip tags, keep visible text (cap for token budget)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);

    // 4. Ask Gemini to extract structured portfolio data
    const prompt = `You are extracting a portfolio project entry from a website.

URL: ${data.url}
Page title: ${title}
OG title: ${ogTitle}
Meta description: ${desc}
Body text (truncated): ${text}

Return a JSON object with:
{
  "title": short project/site name (max 60 chars),
  "category": one-word category like "Web App", "Landing Page", "E-commerce", "SaaS", "Portfolio", "Marketing Site",
  "tag": one short label like "React", "AI", "Design", "SEO",
  "description": 1-2 sentence summary of what the site does (max 200 chars, no marketing fluff),
  "highlights": array of up to 3 concrete features/benefits mentioned on the page
}`;

    const aiRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const body = await aiRes.text();
      throw new Error(`AI extraction failed [${aiRes.status}]: ${body.slice(0, 200)}`);
    }
    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { title, description: desc }; }

    return {
      url: data.url,
      title: parsed.title || ogTitle || title || data.url,
      category: parsed.category || "Web",
      tag: parsed.tag || "",
      description: parsed.description || desc || "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
      image_url: ogImage || "",
      live_url: data.url,
    };
  });
