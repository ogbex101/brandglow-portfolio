import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const urlSchema = z.object({ url: z.string().trim().url().max(500) });

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return await res.text();
  } catch (e: any) {
    throw new Error(`Could not load ${url}: ${e?.message ?? e}`);
  }
}

/** Fetch a URL server-side, strip HTML to visible text, then use Lovable AI
 *  to extract a portfolio-project record from the page. Returns preview JSON;
 *  the admin decides whether to save. */
export const scrapeProject = createServerFn({ method: "POST" })
  .inputValidator((d) => urlSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // 1. Fetch page HTML
    const html = await fetchHtml(data.url);

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
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { title, description: desc };
    }

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

/** Fetch a URL server-side and ask Lovable AI to identify every distinct work
 *  sample / case study shown on that single page (as opposed to scrapeProject,
 *  which summarizes the page as one project). Used when the pasted link is
 *  itself a mini-portfolio containing many samples. Returns a preview list;
 *  nothing is written to the database here. */
export const scrapeSamples = createServerFn({ method: "POST" })
  .inputValidator((d) => urlSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const html = await fetchHtml(data.url);

    // Collect candidate image and link URLs so the AI grounds its picks in
    // real page content instead of guessing — plain text-stripping (used by
    // scrapeProject) throws these away.
    const abs = (u: string) => {
      try {
        return new URL(u, data.url).toString();
      } catch {
        return "";
      }
    };
    const images = Array.from(
      new Set(
        Array.from(html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi))
          .map((m) => abs(m[1]))
          .filter((u) => u && !/\.svg(\?|$)/i.test(u)),
      ),
    ).slice(0, 40);
    const links = Array.from(
      new Map(
        Array.from(html.matchAll(/<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi))
          .map((m) => {
            const href = abs(m[1]);
            const text = m[2]
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 80);
            return [href, text] as const;
          })
          .filter(([href]) => href),
      ),
    ).slice(0, 60);

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    const prompt = `You are scanning a portfolio webpage to find every distinct work sample / project / case study displayed on it (this page may itself be someone's portfolio containing many samples, not a single product).

URL: ${data.url}
Body text (truncated): ${text}

Candidate image URLs found on the page:
${images.map((u) => `- ${u}`).join("\n") || "(none found)"}

Candidate link URLs found on the page (href — link text):
${links.map(([href, t]) => `- ${href} — ${t}`).join("\n") || "(none found)"}

Identify up to 12 distinct work samples shown on this page. For each, pick the image URL and link URL from the candidate lists above that best match it (empty string if none fit — do not invent URLs not in the lists). Also suggest a short niche/category this sample belongs to (e.g. "Email Marketing", "Video Editing", "Social Media", "Web Design", "Branding", "Copywriting", or another concise one you judge fits better).

Return a JSON object:
{
  "samples": [
    {
      "title": short name of the sample (max 60 chars),
      "description": 1-2 sentence summary (max 200 chars, no marketing fluff),
      "image_url": one of the candidate image URLs or "",
      "link_url": one of the candidate link URLs or "",
      "suggested_niche": short niche label
    }
  ]
}
If the page only shows one single project overall (not a list of samples), return a single-item array describing that project.`;

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
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { samples: [] };
    }
    const samples = Array.isArray(parsed.samples) ? parsed.samples : [];

    return {
      sourceUrl: data.url,
      samples: samples.slice(0, 12).map((s: any) => ({
        title: String(s.title || "Untitled sample").slice(0, 60),
        description: String(s.description || "").slice(0, 300),
        image_url: typeof s.image_url === "string" ? s.image_url : "",
        link_url: typeof s.link_url === "string" && s.link_url ? s.link_url : data.url,
        suggested_niche: String(s.suggested_niche || "").slice(0, 60),
      })),
    };
  });
