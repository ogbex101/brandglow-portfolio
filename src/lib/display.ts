/**
 * Display rules for the public portfolio. The content itself stays editable
 * in the admin dashboard; these helpers only decide how it is shown, so a
 * prospect arriving from an outreach email never sees placeholders, broken
 * links or the same project twice.
 */

/**
 * Phone numbers are stored as typed (e.g. "0807 866 0415"). tel: and wa.me
 * links need the full international number, so a Nigerian local number
 * (11 digits starting with 0, the format this site was set up with) gets the
 * +234 country code. Anything already international is kept as is.
 */
export function internationalDigits(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0\d{10}$/.test(digits)) digits = `234${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return digits;
}

export function phoneDisplay(raw?: string | null): string | null {
  const digits = internationalDigits(raw);
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length === 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return raw!.trim().startsWith("+") ? raw!.trim() : `+${digits}`;
}

export const telHref = (raw?: string | null) => {
  const digits = internationalDigits(raw);
  return digits ? `tel:+${digits}` : null;
};

export const whatsappHref = (raw?: string | null) => {
  const digits = internationalDigits(raw);
  return digits ? `https://wa.me/${digits}` : null;
};

/** Lovable's stock share image, shown when a scraped site had no image of its own. */
const PLACEHOLDER_IMAGES = [/lovable\.dev\/opengraph-image/i];

export const isPlaceholderImage = (url?: string | null) =>
  !!url && PLACEHOLDER_IMAGES.some((pattern) => pattern.test(url));

const normalizeUrl = (url?: string | null) =>
  (url ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");

const normalizeTitle = (title?: string | null) =>
  (title ?? "")
    .toLowerCase()
    .split(/\s[-–—|:]\s|\s[-–—]\s?/)[0]
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Projects added twice (same source link, or the same name before a dash, as
 * in "Rangefin" and "Rangefin — Automated Forex Range Trading Bot") show once,
 * keeping the first by sort order. Cards with no real content (a scrape that
 * only found Lovable's default "Lovable App" page) are left out.
 */
export function cleanProjects<
  T extends { title?: string | null; source_url?: string | null; description?: string | null },
>(projects: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of projects) {
    const title = (p.title ?? "").trim();
    if (!title || /^lovable app$/i.test(title)) continue;
    const keys = [normalizeTitle(title), normalizeUrl(p.source_url)].filter(Boolean);
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(p);
  }
  return out;
}

/** Credentials still in progress are not shown publicly; earned ones are. */
export const isEarned = (status?: string | null) =>
  !!status && !/pursu|progress|planned|studying|enrol/i.test(status);

/**
 * Splits a bio into paragraphs of up to `perParagraph` sentences without
 * dropping the full stop at the end of each paragraph.
 */
export function bioParagraphs(bio: string, perParagraph = 3): string[] {
  const sentences = (bio ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    paragraphs.push(sentences.slice(i, i + perParagraph).join(" "));
  }
  return paragraphs;
}
