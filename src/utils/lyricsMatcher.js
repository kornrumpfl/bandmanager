/**
 * Direct Phrase Finder Engine:
 * 
 * Logic:
 * - Direct phrase matching across the song without rigid top-to-bottom sequence limits.
 * - Detects whichever phrase is sung (in PT or DE) and immediately selects that slide and highlights that line.
 * - Prioritizes opening words match (first 2-3 words) and line overlap to resolve identical phrases.
 */

export function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics / accents
    .replace(/[^\w\s]/gi, " ")       // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

export function getWordTokens(str) {
  return normalizeText(str).split(" ").filter((w) => w.length > 0);
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = [];
  for (let i = 0; i <= b.length; i++) row[i] = i;
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

export function wordsMatch(w1, w2) {
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;
  // Common contractions in PT/DE
  if ((w1 === "pra" && w2 === "para") || (w1 === "para" && w2 === "pra")) return true;
  if ((w1 === "pro" && w2 === "para") || (w1 === "para" && w2 === "pro")) return true;
  if ((w1 === "num" && w2 === "em") || (w1 === "em" && w2 === "num")) return true;
  if (w1.length <= 3 || w2.length <= 3) return false;
  if (Math.abs(w1.length - w2.length) > 2) return false;
  return levenshtein(w1, w2) <= (w1.length > 6 ? 2 : 1);
}

/**
 * Checks how many opening words match (up to 3 words).
 * Also tests starting at word 1 in case the first word was dropped.
 */
export function matchesPhraseStart(transcriptTokens, lineTokens) {
  if (lineTokens.length === 0 || transcriptTokens.length === 0) return 0;

  const startCandidates = [0];
  if (lineTokens.length >= 2) startCandidates.push(1);

  let best = 0;
  for (const s of startCandidates) {
    const w0 = lineTokens[s];
    const w1 = s + 1 < lineTokens.length ? lineTokens[s + 1] : null;
    const w2 = s + 2 < lineTokens.length ? lineTokens[s + 2] : null;

    for (let i = 0; i < transcriptTokens.length; i++) {
      if (wordsMatch(transcriptTokens[i], w0)) {
        if (w1 && i + 1 < transcriptTokens.length && wordsMatch(transcriptTokens[i + 1], w1)) {
          if (w2 && i + 2 < transcriptTokens.length && wordsMatch(transcriptTokens[i + 2], w2)) {
            return 3;
          }
          best = Math.max(best, 2);
        } else if (lineTokens.length === 1 || transcriptTokens.length === 1) {
          if (w0.length >= 4) best = Math.max(best, 1.5);
        }
      }
    }
  }
  return best;
}

/**
 * DIRECT PHRASE FINDER:
 * Searches ALL slides and finds the exact phrase being sung.
 * Returns the slide (block) containing that phrase and the phrase index within it.
 */
export function findPhraseInLyrics(transcript, blocks, options = {}) {
  const { currentBlockId = null } = options;
  const transcriptTokens = getWordTokens(transcript);
  if (transcriptTokens.length === 0 || !blocks || blocks.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    const ptLines = block.pt || [];
    const deLines = block.de || [];
    const lineCount = Math.max(ptLines.length, deLines.length);

    for (let lIdx = 0; lIdx < lineCount; lIdx++) {
      const candidates = [];
      if (ptLines[lIdx]) candidates.push(ptLines[lIdx]);
      if (deLines[lIdx]) candidates.push(deLines[lIdx]);

      for (const lineText of candidates) {
        const lineTokens = getWordTokens(lineText);
        if (lineTokens.length === 0) continue;

        // 1. Opening words match (first 2 words)
        const openingMatch = matchesPhraseStart(transcriptTokens, lineTokens);

        // 2. Full line word overlap
        let overlap = 0;
        for (const t of transcriptTokens) {
          if (lineTokens.some((lt) => wordsMatch(t, lt))) overlap++;
        }

        // Composite score:
        let score = (openingMatch * 1.5) + (overlap * 0.5);

        // Gentle hysteresis bonus if already inside this block
        if (block.id === currentBlockId) {
          score += 0.25;
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = {
            block,
            phraseIndex: lIdx,
            phraseText: lineText,
            score,
            confidence: Math.round(Math.min(100, (score / 4.5) * 100)),
            matchedPhrase: lineText,
            matchedTokens: [],
          };
        }
      }
    }
  }

  if (bestMatch && (highestScore >= 1.8 || (transcriptTokens.length === 1 && highestScore >= 1.4))) {
    return bestMatch;
  }

  return null;
}

/**
 * Unified matching runner for backward compatibility and hook integration
 */
export function matchTranscriptToLyrics(transcript, blocks, options = {}) {
  const match = findPhraseInLyrics(transcript, blocks, options);
  if (!match) return null;

  return {
    slideMatch: match,
    phraseMatch: match,
    block: match.block,
    confidence: match.confidence,
    matchedPhrase: match.phraseText,
    phraseIndex: match.phraseIndex,
    matchedTokens: [],
  };
}

export function matchSlideByFirstPhrase(transcript, blocks, options = {}) {
  return findPhraseInLyrics(transcript, blocks, options);
}

export function detectActivePhraseInBlock(transcript, block) {
  if (!block) return null;
  return findPhraseInLyrics(transcript, [block]);
}

export function matchTranscriptToBlocks(transcript, blocks, options = {}) {
  return findPhraseInLyrics(transcript, blocks, options);
}

/**
 * Returns clean lyric line without word-level highlight spans.
 */
export function renderHighlightedLine(line) {
  if (!line) return "";
  return line;
}
