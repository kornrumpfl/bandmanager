import React from "react";

/**
 * Lyrics Matching Engine for Live Audio Follow
 * Normalizes speech recognition transcripts and matches them against song slide blocks.
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

/**
 * Fast Levenshtein distance for fuzzy word matching
 */
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

/**
 * Checks if two words are phonetic/spelling matches
 */
export function wordsAreSimilar(w1, w2) {
  if (w1 === w2) return true;
  if (Math.abs(w1.length - w2.length) > 2) return false;
  if (w1.length <= 3 || w2.length <= 3) return false;
  const dist = levenshtein(w1, w2);
  return dist <= (w1.length > 6 ? 2 : 1);
}

/**
 * Match a recognized transcript window against available song blocks.
 *
 * @param {string} transcript - Recent spoken/sung words from speech recognition
 * @param {Array} blocks - Array of song blocks from getLyricsBlocks()
 * @param {Object} options - Matching configuration
 * @returns {Object|null} Best matching block with score and confidence or null
 */
export function matchTranscriptToBlocks(transcript, blocks, options = {}) {
  const {
    currentBlockId = null,
    targetLanguage = "auto", // "pt", "de", "auto"
    minConfidence = 0.45,
  } = options;

  const rawTokens = getWordTokens(transcript);
  if (rawTokens.length === 0 || !blocks || blocks.length === 0) {
    return null;
  }

  // Sliding recency window of last 4-8 words spoken
  const windowSize = Math.min(rawTokens.length, 7);
  const transcriptTokens = rawTokens.slice(-windowSize);

  let bestMatch = null;
  let highestScore = 0;

  const currentIndex = blocks.findIndex((b) => b.id === currentBlockId);
  const nextIndex = currentIndex !== -1 && currentIndex + 1 < blocks.length ? currentIndex + 1 : -1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    let textLines = [];
    if (targetLanguage === "pt") {
      textLines = block.pt || [];
    } else if (targetLanguage === "de") {
      textLines = block.de || [];
    } else {
      textLines = [...(block.pt || []), ...(block.de || [])];
    }

    const blockTokens = getWordTokens(textLines.join(" "));
    if (blockTokens.length === 0) continue;

    let maxConsecutiveMatches = 0;
    let totalMatchedWords = 0;

    const matchedTokens = [];
    for (let tIdx = 0; tIdx < transcriptTokens.length; tIdx++) {
      const tWord = transcriptTokens[tIdx];
      let foundInBlock = false;
      for (let bIdx = 0; bIdx < blockTokens.length; bIdx++) {
        if (wordsAreSimilar(tWord, blockTokens[bIdx])) {
          foundInBlock = true;
          matchedTokens.push(tWord);
          matchedTokens.push(blockTokens[bIdx]);
          let streak = 1;
          while (
            tIdx + streak < transcriptTokens.length &&
            bIdx + streak < blockTokens.length &&
            wordsAreSimilar(transcriptTokens[tIdx + streak], blockTokens[bIdx + streak])
          ) {
            streak++;
          }
          if (streak > maxConsecutiveMatches) {
            maxConsecutiveMatches = streak;
          }
          break;
        }
      }
      if (foundInBlock) {
        totalMatchedWords++;
      }
    }

    const matchRatio = totalMatchedWords / transcriptTokens.length;
    const sequenceRatio = transcriptTokens.length > 1 ? maxConsecutiveMatches / transcriptTokens.length : 1;

    let score = matchRatio * 0.6 + sequenceRatio * 0.4;

    // Contextual hysteresis and forward anticipation:
    // Prefer staying on current block or moving to the next block unless another block clearly wins
    if (block.id === currentBlockId) {
      score += 0.10;
    } else if (i === nextIndex) {
      score += 0.15;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        block,
        score: Math.min(1, score),
        confidence: Math.round(Math.min(1, score) * 100),
        matchedWords: totalMatchedWords,
        matchedTokens: Array.from(new Set(matchedTokens)),
        windowSize: transcriptTokens.length,
      };
    }
  }

  if (bestMatch && bestMatch.score >= minConfidence) {
    return bestMatch;
  }
  return null;
}

/**
 * Renders a lyric line with word-level highlighting for words currently being sung
 */
export function renderHighlightedLine(line, highlightedWords = []) {
  if (!line) return "";
  if (!highlightedWords || highlightedWords.length === 0) {
    return line;
  }

  // Tokenize preserving whitespace and punctuation
  const tokens = line.split(/(\s+)/);
  return tokens.map((token, idx) => {
    if (/^\s+$/.test(token)) return token;
    const cleanWord = normalizeText(token);
    if (!cleanWord) return token;

    const isMatched = highlightedWords.some((hw) =>
      wordsAreSimilar(normalizeText(hw), cleanWord)
    );

    if (isMatched) {
      return (
        <span key={idx} className="highlighted-word">
          {token}
        </span>
      );
    }
    return <span key={idx}>{token}</span>;
  });
}

