export type AppleLyricWord = {
  startTime: number;
  endTime: number;
  lyric: string;
  word: string;
};

export type AppleLyricLine = {
  startTime: number;
  endTime: number;
  originalLyric: string;
  translatedLyric: string;
  romanLyric: string;
  words: AppleLyricWord[];
  isBG: boolean;
  isDuet: boolean;
};

// Parse a single timestamp token like [mm:ss.xx] or [hh:mm:ss.xx]
function parseTimeToken(token: string): number | null {
  const clean = token.replace(/\[|\]/g, "").trim();
  const parts = clean.split(":").map((p) => p.trim());
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    hours = Number(parts[0]) || 0;
    minutes = Number(parts[1]) || 0;
    seconds = Number(parts[2]) || 0;
  } else if (parts.length === 2) {
    minutes = Number(parts[0]) || 0;
    seconds = Number(parts[1]) || 0;
  } else if (parts.length === 1) {
    seconds = Number(parts[0]) || 0;
  } else {
    return null;
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (!isFinite(totalSeconds)) return null;
  return Math.max(0, Math.round(totalSeconds * 1000));
}

// Convert LRC text to Apple Music-like Lyrics line format
export function convertLrcToAMLL(lrc?: string | null): AppleLyricLine[] {
  if (!lrc || typeof lrc !== "string") return [];

  const lines = lrc.split(/\r?\n/);
  const entries: AppleLyricLine[] = [];

  for (const raw of lines) {
    if (!raw.trim()) continue;

    // Extract one or more timestamps at the beginning, then the text
    const timeTokens = [...raw.matchAll(/\[[^\]]+\]/g)].map((m) => m[0]);
    const text = raw.replace(/^(?:\[[^\]]+\])+\s*/, "").trim();

    if (timeTokens.length === 0) continue;

    for (const token of timeTokens) {
      const ms = parseTimeToken(token);
      if (ms === null) continue;
      // temporary endTime will be corrected below
      entries.push({ startTime: ms, endTime: ms + 5000, originalLyric: text, translatedLyric: "", romanLyric: "", words: [], isBG: false, isDuet: false });
    }
  }

  // Sort by time and compute endTime as the next line's start
  entries.sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < entries.length; i++) {
    const curr = entries[i];
    const next = entries[i + 1];
    if (next) {
      curr.endTime = next.startTime;
    } else {
      // fallback endTime: +5s to satisfy required endTime typing
      curr.endTime = curr.startTime + 5000;
    }
  }

  return entries;
}
