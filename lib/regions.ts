/**
 * Resolve free-text etymology stage locations to approximate lon/lat.
 * Priority:
 * 1) explicit country/region in `region`
 * 2) historical language clue in `region`
 * 3) historical language clue in `language`
 * 4) broad-area fallback
 */

type Coord = [number, number];
type Entry = { keys: string[]; coord: Coord };
type SourceKind = "country" | "language-region" | "language" | "broad" | "default";

const DEFAULT_COORD: Coord = [10, 35];

const COUNTRY_ENTRIES: Entry[] = [
  { keys: ["india", "south asia"], coord: [78.9, 22.9] },
  { keys: ["iran", "persia"], coord: [53.7, 32.4] },
  { keys: ["iraq", "mesopotamia", "babylonia", "assyria"], coord: [44.4, 33.3] },
  { keys: ["saudi arabia", "arabia", "hejaz"], coord: [45.0, 24.0] },
  { keys: ["yemen"], coord: [47.5, 15.5] },
  { keys: ["israel", "palestine", "judea", "judaea", "levant"], coord: [35.2, 31.8] },
  { keys: ["egypt"], coord: [31.2, 30.0] },
  { keys: ["turkey", "anatolia"], coord: [35.2, 39.0] },
  { keys: ["greece", "greek republic", "aegean"], coord: [23.7, 37.9] },
  { keys: ["italy", "rome"], coord: [12.5, 41.9] },
  { keys: ["france", "gaul"], coord: [2.2, 46.2] },
  { keys: ["spain", "iberia"], coord: [-3.7, 40.4] },
  { keys: ["portugal"], coord: [-8.2, 39.5] },
  { keys: ["england", "britain", "uk", "united kingdom"], coord: [-1.5, 52.5] },
  { keys: ["ireland"], coord: [-8.0, 53.4] },
  { keys: ["germany"], coord: [10.3, 51.2] },
  { keys: ["netherlands", "holland"], coord: [5.3, 52.1] },
  { keys: ["scandinavia"], coord: [15.0, 62.0] },
  { keys: ["sweden"], coord: [18.1, 59.3] },
  { keys: ["norway"], coord: [10.8, 59.9] },
  { keys: ["denmark"], coord: [12.6, 55.7] },
  { keys: ["iceland"], coord: [-21.9, 64.1] },
  { keys: ["russia"], coord: [37.6, 55.8] },
  { keys: ["poland"], coord: [19.1, 52.2] },
  { keys: ["czech"], coord: [14.4, 50.1] },
  { keys: ["ukraine"], coord: [30.5, 50.4] },
  { keys: ["china"], coord: [104.2, 35.9] },
  { keys: ["japan"], coord: [138.0, 36.5] },
  { keys: ["korea"], coord: [127.8, 36.5] },
  { keys: ["vietnam"], coord: [105.8, 21.0] },
  { keys: ["thailand", "siam"], coord: [100.5, 13.8] },
  { keys: ["indonesia"], coord: [118.0, -2.5] },
  { keys: ["philippines"], coord: [121.0, 14.6] },
  { keys: ["ethiopia"], coord: [38.8, 9.1] },
  { keys: ["mexico"], coord: [-102.0, 23.6] },
  { keys: ["united states", "u.s.", "usa", "america"], coord: [-98.0, 39.8] },
  { keys: ["peru"], coord: [-75.0, -9.2] },
];

const LANGUAGE_ENTRIES: Entry[] = [
  { keys: ["proto-indo-european", "pie"], coord: [35.0, 48.0] },
  { keys: ["proto-germanic"], coord: [10.0, 54.5] },
  { keys: ["proto-italic"], coord: [12.5, 43.0] },
  { keys: ["proto-celtic"], coord: [2.0, 47.0] },
  { keys: ["proto-slavic"], coord: [27.0, 53.0] },
  { keys: ["sanskrit", "prakrit", "pali"], coord: [78.9, 22.9] },
  { keys: ["avestan", "old persian", "middle persian", "farsi"], coord: [53.7, 32.4] },
  { keys: ["akkadian", "sumerian"], coord: [44.4, 33.3] },
  { keys: ["arabic"], coord: [45.0, 24.0] },
  { keys: ["hebrew", "aramaic"], coord: [35.2, 31.8] },
  { keys: ["coptic", "egyptian"], coord: [31.2, 30.0] },
  { keys: ["hittite"], coord: [35.0, 39.0] },
  { keys: ["ancient greek", "greek", "hellenic"], coord: [23.7, 37.9] },
  { keys: ["latin"], coord: [12.5, 41.9] },
  { keys: ["old french", "middle french", "french", "norman"], coord: [2.2, 46.2] },
  { keys: ["old english", "middle english", "english"], coord: [-1.5, 52.5] },
  { keys: ["old norse", "norse"], coord: [15.0, 62.0] },
  { keys: ["old high german", "german"], coord: [10.3, 51.2] },
  { keys: ["dutch", "flemish", "frisian"], coord: [5.3, 52.1] },
  { keys: ["old irish", "irish", "gaelic"], coord: [-8.0, 53.4] },
  { keys: ["russian", "slavic"], coord: [30.0, 55.0] },
  { keys: ["mandarin", "chinese"], coord: [104.2, 35.9] },
  { keys: ["japanese"], coord: [138.0, 36.5] },
  { keys: ["korean"], coord: [127.8, 36.5] },
  { keys: ["vietnamese"], coord: [105.8, 21.0] },
  { keys: ["thai"], coord: [100.5, 13.8] },
  { keys: ["malay", "tagalog"], coord: [118.0, 5.0] },
  { keys: ["nahuatl"], coord: [-99.1, 19.4] },
  { keys: ["quechua"], coord: [-72.0, -13.5] },
];

const BROAD_ENTRIES: Entry[] = [
  { keys: ["eurasia", "steppe"], coord: [35.0, 48.0] },
  { keys: ["europe"], coord: [15.0, 50.0] },
  { keys: ["middle east"], coord: [44.0, 31.0] },
  { keys: ["north africa", "maghreb"], coord: [3.0, 31.0] },
  { keys: ["africa"], coord: [20.0, 5.0] },
  { keys: ["east asia"], coord: [113.0, 33.0] },
  { keys: ["southeast asia"], coord: [105.0, 10.0] },
  { keys: ["americas"], coord: [-95.0, 15.0] },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[\/,;:|-]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function wordTokens(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, key: string): boolean {
  const pattern = `\\b${escapeRegex(key).replace(/\s+/g, "\\s+")}\\b`;
  return new RegExp(pattern, "i").test(text);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + cost
      );
      prev = tmp;
    }
  }
  return dp[b.length];
}

function fuzzyWordMatch(text: string, key: string): boolean {
  // Only fuzzy-match single-word keys; multi-word keys still use strict phrase logic.
  if (key.includes(" ")) return false;
  if (key.length < 5) return false;
  const allowed = key.length >= 8 ? 2 : 1;
  const tokens = wordTokens(text);
  return tokens.some((tok) => Math.abs(tok.length - key.length) <= allowed && levenshtein(tok, key) <= allowed);
}

function scoreMatch(text: string, key: string): number {
  if (containsPhrase(text, key)) return key.length + 28;
  if (text.includes(key)) return key.length;
  if (fuzzyWordMatch(text, key)) return key.length - 1;
  return -1;
}

function bestEntry(texts: string[], entries: Entry[]): Entry | null {
  let best: { entry: Entry; score: number } | null = null;
  for (const raw of texts) {
    const txt = normalize(raw);
    if (!txt) continue;
    for (const entry of entries) {
      for (const key of entry.keys) {
        const s = scoreMatch(txt, key);
        if (s < 0) continue;
        if (!best || s > best.score) best = { entry, score: s };
      }
    }
  }
  return best?.entry ?? null;
}

export function regionToLonLat(region: string, language = ""): Coord {
  return resolveRegionToLonLat(region, language).coord;
}

export function resolveRegionToLonLat(
  region: string,
  language = ""
): { coord: Coord; score: number; source: SourceKind } {
  const regionTexts = [region, ...tokenize(region)];
  const langTexts = [language, ...tokenize(language)];

  const countryHit = bestEntry(regionTexts, COUNTRY_ENTRIES);
  if (countryHit) return { coord: countryHit.coord, score: 100, source: "country" };

  const langHitFromRegion = bestEntry(regionTexts, LANGUAGE_ENTRIES);
  if (langHitFromRegion) {
    return { coord: langHitFromRegion.coord, score: 78, source: "language-region" };
  }

  const langHit = bestEntry(langTexts, LANGUAGE_ENTRIES);
  if (langHit) return { coord: langHit.coord, score: 70, source: "language" };

  const broadHit = bestEntry([...regionTexts, ...langTexts], BROAD_ENTRIES);
  if (broadHit) return { coord: broadHit.coord, score: 38, source: "broad" };

  return { coord: DEFAULT_COORD, score: 0, source: "default" };
}
