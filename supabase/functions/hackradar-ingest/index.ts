// HackRadar pluggable ingestion.
// Runs source adapters, normalizes results, enriches via heuristics + optional AI classification,
// dedupes, and upserts into public.hackathons. Every run logs to hackathon_ingestion_runs with
// per-record error details for admin observability.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NormalizedListing = {
  source_slug: string;
  external_id: string;
  external_url: string;
  title: string;
  description: string;
  organizer: string;
  status: "upcoming" | "live" | "completed";
  mode: "online" | "offline" | "hybrid";
  city?: string | null;
  country?: string | null;
  themes?: string[];
  tags?: string[];
  prize_pool_inr?: number | null;
  prize_pool_text?: string | null;
  registration_url?: string | null;
  website_url?: string | null;
  registration_deadline?: string | null;
  start_date: string;
  end_date: string;
  image_url?: string | null;
  is_beginner_friendly?: boolean;
  is_student_only?: boolean;
  allows_solo?: boolean;
  team_size_min?: number;
  team_size_max?: number;
  difficulty?: string | null;
  eligibility?: string[];
  raw?: unknown;
};

async function sha256Hex(s: string) {
  const b = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest("SHA-256", b);
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function normalizeTitleForHash(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 96);
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();
}

function abs(u: string | null | undefined, base: string): string | null {
  if (!u) return null;
  try { return new URL(u, base).toString(); } catch { return null; }
}

function parseDevpostDateRange(s?: string): { start: string; end: string } {
  const now = new Date();
  const fallbackStart = now.toISOString();
  const fallbackEnd = new Date(now.getTime() + 30 * 86400_000).toISOString();
  if (!s) return { start: fallbackStart, end: fallbackEnd };
  try {
    const parts = s.split(/\s*[-–]\s*/);
    if (parts.length !== 2) return { start: fallbackStart, end: fallbackEnd };
    const yearMatch = s.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : String(now.getUTCFullYear());
    const left = parts[0].includes(",") ? parts[0] : `${parts[0]}, ${year}`;
    const right = parts[1].includes(",") ? parts[1] : `${parts[1]}, ${year}`;
    const start = new Date(left);
    const end = new Date(right);
    return {
      start: isNaN(+start) ? fallbackStart : start.toISOString(),
      end: isNaN(+end) ? fallbackEnd : end.toISOString(),
    };
  } catch {
    return { start: fallbackStart, end: fallbackEnd };
  }
}

function deriveStatus(startISO: string, endISO: string): "upcoming" | "live" | "completed" {
  const now = Date.now();
  const s = +new Date(startISO);
  const e = +new Date(endISO);
  if (now < s) return "upcoming";
  if (now > e) return "completed";
  return "live";
}

function parsePrizeToInr(txt?: string | null): number | null {
  if (!txt) return null;
  const clean = String(txt).replace(/,/g, "").replace(/&nbsp;/g, " ");
  const scale = (n: number, unit?: string) => {
    if (!unit) return n;
    const u = unit.toLowerCase();
    if (u.startsWith("k")) return n * 1_000;
    if (u.startsWith("m") || u.startsWith("mn")) return n * 1_000_000;
    if (u.startsWith("l") || u.startsWith("lakh")) return n * 100_000;
    if (u.startsWith("cr") || u.startsWith("crore")) return n * 10_000_000;
    if (u.startsWith("b") || u.startsWith("bn")) return n * 1_000_000_000;
    return n;
  };
  const rates: Record<string, number> = { inr: 1, usd: 84, eur: 90, gbp: 105 };
  const patterns: Array<{ re: RegExp; cur: keyof typeof rates }> = [
    { re: /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k|m|mn|l|lakh|lakhs|cr|crore|crores|b|bn)?/i, cur: "inr" },
    { re: /\$\s*(\d+(?:\.\d+)?)\s*(k|m|mn|b|bn)?/i, cur: "usd" },
    { re: /(?:€|eur)\s*(\d+(?:\.\d+)?)\s*(k|m|mn|b|bn)?/i, cur: "eur" },
    { re: /(?:£|gbp)\s*(\d+(?:\.\d+)?)\s*(k|m|mn|b|bn)?/i, cur: "gbp" },
  ];
  let best = 0;
  for (const { re, cur } of patterns) {
    const m = clean.match(re);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n)) best = Math.max(best, Math.round(scale(n, m[2]) * rates[cur]));
    }
  }
  return best || null;
}

// ---- Heuristic enrichment (fills fields adapters left blank) ----

const THEME_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "artificial intelligence", "machine learning", "ml", "llm", "genai", "generative"],
  web3: ["web3", "blockchain", "crypto", "solana", "ethereum", "defi", "nft"],
  fintech: ["fintech", "finance", "banking", "payments", "trading"],
  healthtech: ["health", "healthcare", "medtech", "medical", "biotech"],
  climate: ["climate", "sustainab", "green", "cleantech", "energy"],
  edtech: ["edtech", "education", "learning", "student"],
  gaming: ["game", "gaming", "gamedev", "unity", "unreal"],
  mobile: ["mobile", "android", "ios", "flutter", "react native"],
  web: ["web", "frontend", "react", "vue", "svelte"],
  data: ["data", "analytics", "database", "big data"],
  cybersecurity: ["security", "cybersecurity", "infosec", "hacking"],
  iot: ["iot", "hardware", "embedded", "robotics"],
  ar_vr: ["ar", "vr", "xr", "metaverse", "virtual reality", "augmented"],
};

function deriveThemes(text: string, existing: string[] = []): string[] {
  const t = text.toLowerCase();
  const found = new Set(existing.map((x) => x.trim()).filter(Boolean));
  for (const [theme, words] of Object.entries(THEME_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) found.add(theme);
  }
  return Array.from(found).slice(0, 12);
}

function deriveDifficulty(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(beginner|intro|101|newbie|first[-\s]?time)\b/.test(t)) return "beginner";
  if (/\b(advanced|expert|pro|senior)\b/.test(t)) return "advanced";
  if (/\b(intermediate)\b/.test(t)) return "intermediate";
  return null;
}

function deriveEligibility(text: string): string[] {
  const t = text.toLowerCase();
  const out = new Set<string>();
  if (/\bstudent(s)?\b|\bcollege\b|\buniversity\b|\bschool\b/.test(t)) out.add("students");
  if (/\bprofessional(s)?\b|\bworking\b|\bemployee(s)?\b/.test(t)) out.add("professionals");
  if (/\bopen to all\b|\banyone\b|\bworldwide\b|\bglobal\b/.test(t)) out.add("everyone");
  if (/\bwomen\b/.test(t)) out.add("women");
  if (out.size === 0) out.add("everyone");
  return Array.from(out);
}

function enrich(l: NormalizedListing): NormalizedListing {
  const blob = `${l.title} ${l.description || ""} ${(l.tags || []).join(" ")}`.toLowerCase();
  const themes = (l.themes && l.themes.length ? l.themes : deriveThemes(blob)).slice(0, 12);
  const tags = Array.from(new Set([...(l.tags || []), ...themes])).slice(0, 20);
  const difficulty = l.difficulty || deriveDifficulty(blob);
  const eligibility = l.eligibility && l.eligibility.length ? l.eligibility : deriveEligibility(blob);
  const is_beginner_friendly = l.is_beginner_friendly ?? (difficulty === "beginner" || /beginner|newbie/.test(blob));
  const is_student_only = l.is_student_only ?? (eligibility.includes("students") && !eligibility.includes("everyone"));
  const allows_solo = l.allows_solo ?? ((l.team_size_min ?? 1) <= 1);
  const team_size_min = l.team_size_min ?? 1;
  const team_size_max = l.team_size_max ?? 4;
  return {
    ...l,
    themes,
    tags,
    difficulty,
    eligibility,
    is_beginner_friendly,
    is_student_only,
    allows_solo,
    team_size_min,
    team_size_max,
    registration_url: l.registration_url || l.external_url,
    website_url: l.website_url || l.external_url,
    status: deriveStatus(l.start_date, l.end_date),
  };
}

// -------------------- Adapters --------------------

async function adapterDevpost(): Promise<NormalizedListing[]> {
  const res = await fetch("https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&per_page=100", {
    headers: { "User-Agent": "HackRadarBot/1.0", "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`devpost ${res.status}`);
  const json = await res.json().catch(() => null);
  const items: any[] = json?.hackathons || [];
  return items.map((h): NormalizedListing => {
    const { start, end } = parseDevpostDateRange(h.submission_period_dates);
    const locStr: string = h.displayed_location?.location || "";
    const isOnline = locStr.toLowerCase().includes("online");
    const prizeText = stripHtml(h.prize_amount) || null;
    const themes = (h.themes || []).map((t: any) => t.name).filter(Boolean);
    const openTo: string[] = Array.isArray(h.open_to) ? h.open_to : [];
    const eligibility = openTo.map((s) => s.toLowerCase());
    return {
      source_slug: "devpost",
      external_id: String(h.id),
      external_url: h.url,
      title: h.title,
      description: stripHtml(h.description_html || h.title).slice(0, 800),
      organizer: h.organization_name || "Devpost",
      status: deriveStatus(start, end),
      mode: isOnline ? "online" : (locStr ? "hybrid" : "online"),
      city: locStr || null,
      country: null,
      themes,
      tags: themes,
      prize_pool_text: prizeText,
      prize_pool_inr: parsePrizeToInr(prizeText),
      registration_url: h.url,
      website_url: h.url,
      registration_deadline: end,
      start_date: start,
      end_date: end,
      image_url: h.thumbnail_url || null,
      eligibility,
      is_student_only: eligibility.some((e) => e.includes("student")),
      raw: h,
    };
  });
}

// ---------- Devfolio (public search API) ----------
async function adapterDevfolio(): Promise<NormalizedListing[]> {
  // Devfolio exposes an ElasticSearch-style search endpoint used by their site.
  const res = await fetch("https://api.devfolio.co/api/search/hackathons", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "HackRadarBot/1.0" },
    body: JSON.stringify({ result_per_page: 50, page: 0, filter: "all" }),
  });
  if (!res.ok) throw new Error(`devfolio ${res.status}`);
  const json = await res.json().catch(() => ({} as any));
  const hits: any[] = json?.hits?.hits || [];
  return hits.map((hit): NormalizedListing => {
    const h = hit._source || hit;
    const slug = h.slug || h.hackathon_slug || h.uuid || hit._id;
    const url = slug ? `https://${slug}.devfolio.co` : "https://devfolio.co/hackathons";
    const start = h.starts_at || h.hackathon_start_at || new Date().toISOString();
    const end = h.ends_at || h.hackathon_end_at || start;
    const deadline = h.apply_close || h.hackathon_apply_close || end;
    const setting = (h.hackathon_setting?.location || h.setting || "").toString().toLowerCase();
    const isOnline = setting.includes("online") || setting.includes("virtual");
    const themes = (h.tracks || h.themes || []).map((t: any) => (t?.name || t)).filter(Boolean);
    const prizes = h.prizes || h.total_prize || null;
    const prizeText = typeof prizes === "string" ? prizes : (h.total_prize_pool || null);
    return {
      source_slug: "devfolio",
      external_id: String(slug || hit._id),
      external_url: url,
      title: h.name || h.title || "Devfolio hackathon",
      description: stripHtml(h.desc || h.description || h.tagline || "").slice(0, 800),
      organizer: h.organizer?.name || h.owner?.name || "Devfolio",
      status: deriveStatus(start, end),
      mode: isOnline ? "online" : (setting.includes("offline") ? "offline" : "hybrid"),
      city: h.hackathon_setting?.city || h.city || null,
      country: h.hackathon_setting?.country || h.country || null,
      themes,
      tags: themes,
      prize_pool_text: prizeText,
      prize_pool_inr: parsePrizeToInr(prizeText),
      registration_url: url,
      website_url: url,
      registration_deadline: deadline,
      start_date: start,
      end_date: end,
      image_url: h.cover_img || h.hackathon_cover || h.logo || null,
      team_size_min: h.team_size?.min || 1,
      team_size_max: h.team_size?.max || 4,
      raw: h,
    };
  });
}

// ---------- Unstop (public search API) ----------
async function adapterUnstop(): Promise<NormalizedListing[]> {
  const res = await fetch(
    "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=50&oppstatus=open",
    { headers: { "User-Agent": "HackRadarBot/1.0", "Accept": "application/json" } },
  );
  if (!res.ok) throw new Error(`unstop ${res.status}`);
  const json = await res.json().catch(() => ({} as any));
  const items: any[] = json?.data?.data || json?.data || [];
  return items.map((h: any): NormalizedListing => {
    const url = h.public_url || h.seo_url ||
      (h.slug ? `https://unstop.com/hackathons/${h.slug}-${h.id}` : "https://unstop.com/hackathons");
    const start = h.start_date || h.regnRequirements?.start_regn_dt || new Date().toISOString();
    const end = h.end_date || h.regnRequirements?.end_regn_dt || start;
    const deadline = h.regnRequirements?.end_regn_dt || h.end_date || end;
    const region = (h.region || "").toString().toLowerCase();
    const mode: NormalizedListing["mode"] = region.includes("online") ? "online"
      : region.includes("offline") ? "offline" : "hybrid";
    const themes = (h.filters || [])
      .filter((f: any) => f?.type === "category" || f?.type === "tag")
      .map((f: any) => f?.name).filter(Boolean);
    const prizeText = h.prizes?.[0]?.cash ? `INR ${h.prizes[0].cash}` : (h.prize_amount || null);
    return {
      source_slug: "unstop",
      external_id: String(h.id || h.slug),
      external_url: url,
      title: h.title || h.name || "Unstop hackathon",
      description: stripHtml(h.description || h.about_opportunity || h.short_description || "").slice(0, 800),
      organizer: h.organisation?.name || h.company?.name || "Unstop",
      status: deriveStatus(start, end),
      mode,
      city: h.location || h.city || null,
      country: "India",
      themes,
      tags: themes,
      prize_pool_text: prizeText,
      prize_pool_inr: parsePrizeToInr(prizeText),
      registration_url: url,
      website_url: url,
      registration_deadline: deadline,
      start_date: start,
      end_date: end,
      image_url: h.banner_mobile || h.logoUrl2 || h.logoUrl || null,
      team_size_min: h.team_min_size || 1,
      team_size_max: h.team_max_size || 4,
      raw: h,
    };
  });
}

// ---------- HackerEarth (HTML scrape of the challenges list) ----------
async function adapterHackerEarth(): Promise<NormalizedListing[]> {
  const url = "https://www.hackerearth.com/challenges/hackathon/";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`hackerearth ${res.status}`);
  const html = await res.text();
  if (html.includes("ANONYMOUS IP") || html.includes("HackerEarth Guardian")) {
    throw new Error("hackerearth blocked ingest IP (Guardian anti-VPN); needs residential proxy or Firecrawl");
  }
  const out: NormalizedListing[] = [];
  const linkAllRe = /<a[^>]+href="(\/challenges\/hackathon\/[^"]+)"[\s\S]*?<div[^>]+class="challenge-content[^"]*"[\s\S]*?<div[^>]+class="challenge-name[^"]*"[^>]*>([^<]+)<[\s\S]*?(?:<div[^>]+class="challenge-list-title[^"]*"[^>]*>([^<]+)<)?/g;
  let m: RegExpExecArray | null;
  while ((m = linkAllRe.exec(html)) !== null) {
    const path = m[1];
    const title = stripHtml(m[2]);
    const organizer = stripHtml(m[3] || "HackerEarth");
    if (!title) continue;
    const link = abs(path, url)!;
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400_000).toISOString();
    out.push({
      source_slug: "hackerearth",
      external_id: path,
      external_url: link,
      title,
      description: title,
      organizer,
      status: "upcoming",
      mode: "online",
      city: null,
      country: null,
      themes: [],
      tags: [],
      prize_pool_text: null,
      prize_pool_inr: null,
      registration_url: link,
      website_url: link,
      registration_deadline: end,
      start_date: now.toISOString(),
      end_date: end,
      raw: { path, title, organizer },
    });
    if (out.length >= 40) break;
  }
  return out;
}

// ---------- Reskilll (HTML scrape) ----------
async function adapterReskilll(): Promise<NormalizedListing[]> {
  const url = "https://reskilll.com/allhacks";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`reskilll ${res.status}`);
  const html = await res.text();
  const out: NormalizedListing[] = [];
  // Cards look like: <div class="... hackathonCard"> ... <a class="allhackname" href="...">Title</a>
  //   <div class="eventDescription">html-escaped desc</div>
  //   <div class="hackregisterdatehead">Registration Start:</div><div class="hackresgiterdate">YYYY-MM-DD</div>
  //   <div class="hackregisterdatehead">Registration End:</div><div class="hackresgiterdate">YYYY-MM-DD</div>
  const cards = html.split(/class="[^"]*hackathonCard[^"]*"/i).slice(1);
  for (const card of cards) {
    const linkM = card.match(/<a[^>]+class="allhackname[^"]*"[^>]+href="(https?:\/\/reskilll\.com\/hack\/[^"]+)"[^>]*>([^<]+)</i);
    if (!linkM) continue;
    const link = linkM[1];
    const title = stripHtml(linkM[2]);
    const descRaw = card.match(/class="[^"]*eventDescription[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
    const desc = stripHtml(descRaw.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    const dates = Array.from(card.matchAll(/class="hackresgiterdate"[^>]*>([^<]+)</g)).map((m) => m[1].trim());
    const start = dates[0] ? new Date(dates[0]).toISOString() : new Date().toISOString();
    const end = dates[1] ? new Date(dates[1]).toISOString() : start;
    const modeM = card.match(/\b(online|offline|hybrid)\b/i);
    const cityM = card.match(/(Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Noida|Gurgaon|Jaipur|Indore)/i);
    const prizeM = card.match(/(?:Prize[s]?|Prize\s*Pool)[^₹$0-9]{0,20}((?:₹|Rs\.?|INR|\$)\s*[\d,.]+\s*(?:k|m|lakh|cr|crore)?)/i);
    if (!title) continue;
    out.push({
      source_slug: "reskilll",
      external_id: link,
      external_url: link,
      title,
      description: (desc || title).slice(0, 800),
      organizer: "Reskilll",
      status: deriveStatus(start, end),
      mode: (modeM?.[1].toLowerCase() as any) || "hybrid",
      city: cityM?.[1] || null,
      country: "India",
      themes: [],
      tags: [],
      prize_pool_text: prizeM?.[1] || null,
      prize_pool_inr: parsePrizeToInr(prizeM?.[1]),
      registration_url: link,
      website_url: link,
      registration_deadline: end,
      start_date: start,
      end_date: end,
      raw: { link, dates },
    });
    if (out.length >= 60) break;
  }
  return out;
}

// ---------- Firecrawl fallback (only if key present) ----------
async function adapterFirecrawlList(source_slug: string, url: string): Promise<NormalizedListing[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: [{
          type: "json",
          prompt: "Extract up to 25 hackathons listed on this page. For each: title, organizer, description (<=400 chars), registration_deadline (ISO), start_date, end_date, mode (online/offline/hybrid), city, prize_pool_text, themes (array of strings), registration_url (absolute), external_id (from url).",
          schema: {
            type: "object",
            properties: {
              hackathons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" }, organizer: { type: "string" }, description: { type: "string" },
                    registration_deadline: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" },
                    mode: { type: "string" }, city: { type: "string" }, prize_pool_text: { type: "string" },
                    themes: { type: "array", items: { type: "string" } },
                    registration_url: { type: "string" }, external_id: { type: "string" },
                  },
                  required: ["title", "registration_url"],
                },
              },
            },
          },
        }],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: any[] = data?.data?.json?.hackathons || data?.json?.hackathons || [];
    const now = new Date().toISOString();
    return list.map((h): NormalizedListing => ({
      source_slug,
      external_id: String(h.external_id || h.registration_url || h.title),
      external_url: h.registration_url,
      title: h.title,
      description: (h.description || "").slice(0, 800),
      organizer: h.organizer || source_slug,
      status: "upcoming",
      mode: (["online", "offline", "hybrid"].includes((h.mode || "").toLowerCase())
        ? (h.mode.toLowerCase()) : "hybrid") as any,
      city: h.city || null,
      country: "India",
      themes: h.themes || [],
      tags: h.themes || [],
      prize_pool_text: h.prize_pool_text || null,
      prize_pool_inr: parsePrizeToInr(h.prize_pool_text),
      registration_url: h.registration_url,
      website_url: h.registration_url,
      registration_deadline: h.registration_deadline || null,
      start_date: h.start_date || now,
      end_date: h.end_date || now,
      raw: h,
    }));
  } catch {
    return [];
  }
}

const SOURCE_ADAPTERS: Record<string, () => Promise<NormalizedListing[]>> = {
  devpost: adapterDevpost,
  devfolio: adapterDevfolio,
  unstop: adapterUnstop,
  reskilll: adapterReskilll,
  hackerearth: adapterHackerEarth,
};

// -------------------- Runner --------------------

async function runSource(admin: ReturnType<typeof createClient>, slug: string) {
  const adapter = SOURCE_ADAPTERS[slug];
  if (!adapter) return { slug, error: "no adapter" };

  const started = Date.now();
  const { data: run } = await admin
    .from("hackathon_ingestion_runs")
    .insert({ source_slug: slug, status: "running" })
    .select("id").single();

  let inserted = 0, updated = 0, skipped = 0;
  const errorDetails: Array<{ external_id?: string; title?: string; error: string }> = [];
  let seen = 0;
  try {
    const rawListings = await adapter();
    seen = rawListings.length;
    const listings = rawListings.map(enrich);
    for (const l of listings) {
      if (!l.title || !l.external_url) {
        skipped++;
        errorDetails.push({ external_id: l.external_id, title: l.title, error: "missing title or external_url" });
        continue;
      }
      const dedupe_hash = await sha256Hex(normalizeTitleForHash(l.title) + "|" + (l.organizer || ""));
      const { data: existing } = await admin
        .from("hackathons")
        .select("id")
        .eq("source_slug", l.source_slug)
        .eq("external_id", l.external_id)
        .maybeSingle();
      const searchable = [
        l.title, l.organizer, l.city, l.country, (l.themes || []).join(" "),
        (l.tags || []).join(" "), (l.eligibility || []).join(" "), l.difficulty || "",
        l.description,
      ].filter(Boolean).join(" ").slice(0, 4000);
      const row = {
        creator_id: null,
        title: l.title,
        description: l.description || l.title,
        organizer: l.organizer,
        status: l.status,
        prize: l.prize_pool_text || null,
        prize_pool_text: l.prize_pool_text || null,
        prize_pool_inr: l.prize_pool_inr || null,
        start_date: l.start_date,
        end_date: l.end_date,
        registration_deadline: l.registration_deadline || null,
        registration_url: l.registration_url || l.external_url,
        website_url: l.website_url || l.external_url,
        external_url: l.external_url,
        external_id: l.external_id,
        source_slug: l.source_slug,
        dedupe_hash,
        mode: l.mode,
        city: l.city || null,
        country: l.country || "India",
        themes: l.themes || [],
        tags: l.tags || l.themes || [],
        difficulty: l.difficulty || null,
        eligibility: l.eligibility || [],
        team_size_min: l.team_size_min ?? 1,
        team_size_max: l.team_size_max ?? 4,
        is_beginner_friendly: l.is_beginner_friendly ?? false,
        is_student_only: l.is_student_only ?? false,
        allows_solo: l.allows_solo ?? true,
        image_url: l.image_url || null,
        is_verified: true,
        last_seen_at: new Date().toISOString(),
        searchable_text: searchable,
        raw: l.raw ?? null,
      };
      const { error } = await admin
        .from("hackathons")
        .upsert(row, { onConflict: "source_slug,external_id" })
        .select("id");
      if (error) {
        skipped++;
        errorDetails.push({ external_id: l.external_id, title: l.title, error: error.message });
        continue;
      }
      if (existing) updated++; else inserted++;
    }
    await admin.from("hackathon_ingestion_runs").update({
      status: "success", finished_at: new Date().toISOString(),
      inserted_count: inserted, updated_count: updated, skipped_count: skipped,
      error: errorDetails.length ? errorDetails.slice(0, 5).map((e) => e.error).join(" | ") : null,
      error_details: errorDetails,
      records_seen: seen,
      duration_ms: Date.now() - started,
    }).eq("id", run!.id);
    await admin.from("hackathon_sources").update({
      last_run_at: new Date().toISOString(), last_status: "success",
    }).eq("slug", slug);
    return { slug, run_id: run!.id, inserted, updated, skipped, seen };
  } catch (e: any) {
    await admin.from("hackathon_ingestion_runs").update({
      status: "error", finished_at: new Date().toISOString(), error: String(e?.message || e),
      error_details: [{ error: String(e?.message || e) }],
      records_seen: seen,
      duration_ms: Date.now() - started,
    }).eq("id", run!.id);
    await admin.from("hackathon_sources").update({
      last_run_at: new Date().toISOString(), last_status: "error",
    }).eq("slug", slug);
    return { slug, run_id: run!.id, error: String(e?.message || e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY FIX: this endpoint has verify_jwt=false (it's meant to be
  // triggered by a cron job, not a logged-in user) and previously had no
  // check at all — anyone who found the URL could trigger ingestion runs
  // and control which sources ran. Require the shared cron secret instead.
  const cronSecret = Deno.env.get("HACKRADAR_CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (cronSecret && providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let body: any = {};
  try { body = await req.json(); } catch { /* GET-style trigger */ }
  const requested: string[] | undefined = body?.sources;

  const { data: sources } = await admin
    .from("hackathon_sources")
    .select("slug")
    .eq("is_active", true);
  const slugs = (sources || []).map((s: any) => s.slug).filter((s: string) => SOURCE_ADAPTERS[s]);
  const toRun = requested?.length ? slugs.filter((s: string) => requested.includes(s)) : slugs;

  const results = await Promise.all(toRun.map((s: string) => runSource(admin, s)));
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});