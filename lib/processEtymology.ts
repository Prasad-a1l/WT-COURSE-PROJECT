import type { EtymologyStage, EtymologyStageRaw } from "./types";
import { resolveRegionToLonLat } from "./regions";

function parseYear(y: string): number {
  const s = String(y).trim();
  const bc = /b\.?c\.?|bce/i.test(s);
  const m = s.match(/-?\d{1,4}/);
  if (!m) return Number.NaN;
  let n = parseInt(m[0], 10);
  if (bc) n = -Math.abs(n);
  return n;
}

export function processEtymologyChain(raw: EtymologyStageRaw[]): EtymologyStage[] {
  const enriched = raw.map((row, idx) => {
    const resolved = resolveRegionToLonLat(row.region, row.language);
    const [lon, lat] = resolved.coord;
    const sortYear = parseYear(row.year);
    return { ...row, lon, lat, sortYear, _score: resolved.score, _idx: idx };
  });

  const withYear = enriched.filter((x) => !Number.isNaN(x.sortYear));
  const withoutYear = enriched.filter((x) => Number.isNaN(x.sortYear));
  withYear.sort((a, b) => a.sortYear - b.sortYear);
  const ordered = [...withYear, ...withoutYear];

  // Second pass: if a stage is low-confidence (broad/default),
  // keep continuity by snapping to nearest confident neighbor.
  for (let i = 0; i < ordered.length; i++) {
    const cur = ordered[i];
    if (cur._score >= 60) continue;
    const prev = i > 0 ? ordered[i - 1] : null;
    const next = i < ordered.length - 1 ? ordered[i + 1] : null;

    if (prev && prev._score >= 70 && next && next._score >= 70) {
      cur.lon = (prev.lon + next.lon) / 2;
      cur.lat = (prev.lat + next.lat) / 2;
      continue;
    }
    if (prev && prev._score >= 70) {
      cur.lon = prev.lon;
      cur.lat = prev.lat;
      continue;
    }
    if (next && next._score >= 70) {
      cur.lon = next.lon;
      cur.lat = next.lat;
    }
  }

  return ordered.map(({ _score, _idx, ...row }) => {
    void _score;
    void _idx;
    return row;
  });
}
