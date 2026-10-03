// ============================================================
// engine.js  -  SmartSpell correction engine (prototype)
// Needs dictionary.js to be loaded first (it provides DICTIONARY).
//
// Pipeline:
//   input -> normalize -> known-word check -> pick candidates
//         -> Levenshtein distance -> rank -> top 3
// Main function to call:  spellCheck("recieve")
// ============================================================

const MAX_SUGGESTIONS = 3;

// ------------------------------------------------------------
// STEP 0: Build two lookup tables once, when the page loads.
// ------------------------------------------------------------
// wordFrequency: "which" -> 95000   (fast "does this word exist?" check)
// wordsByLength: 5 -> ["which", "witch", ...]   (used to filter candidates)
const wordFrequency = {};
const wordsByLength = {};

function buildIndexes() {
  for (let i = 0; i < DICTIONARY.length; i++) {
    const entry = DICTIONARY[i];
    wordFrequency[entry.word] = entry.frequency;

    const len = entry.word.length;
    if (wordsByLength[len] === undefined) {
      wordsByLength[len] = [];
    }
    wordsByLength[len].push(entry.word);
  }
}
buildIndexes();

// ------------------------------------------------------------
// STEP 1: Normalize input
// ------------------------------------------------------------

// Returns a reason string if the text should NOT be corrected, else "".
function getSkipReason(text) {
  // Remove trailing punctuation so "me@mail.com," is still seen as an email.
  const t = text.trim().replace(/[.,!?;:)]+$/, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return "email";
  }
  if (/^(https?:\/\/|www\.)\S+$/i.test(t)) {
    return "url";
  }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|org|net|io|in|edu|dev|app|co)(\/\S*)?$/i.test(t)) {
    return "url";
  }
  if (/\d/.test(t)) {
    return "number";
  }
  return "";
}

// Detects how the user typed the word: "upper", "capitalized" or "lower".
function getCaseStyle(letters) {
  if (letters.length > 1 && letters === letters.toUpperCase()) {
    return "upper";
  }
  if (letters[0] === letters[0].toUpperCase() && letters[0] !== letters[0].toLowerCase()) {
    return "capitalized";
  }
  return "lower";
}

// Puts the original capitalization back on a suggestion.
function applyCaseStyle(word, style) {
  if (style === "upper") {
    return word.toUpperCase();
  }
  if (style === "capitalized") {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

// Removes punctuation from both ends: "Hello!!" -> "Hello"
// Keeps apostrophes inside words: "don't" stays "don't".
function stripEdges(text) {
  return text.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
}

// ------------------------------------------------------------
// STEP 3: Candidate filtering (by word length)
// ------------------------------------------------------------

// Configurable distance thresholds based on word length.
// Short words are kept strict to avoid noisy, irrelevant suggestions,
// while still allowing single-edit corrections (including adjacent transpositions).
const DISTANCE_THRESHOLDS = {
  shortMaxLen: 4,
  shortMaxDistance: 1,
  mediumMaxLen: 8,
  mediumMaxDistance: 2,
  longMaxDistance: 3
};

// How many letter changes we are willing to accept for a word.
// Configurable via DISTANCE_THRESHOLDS.
function getMaxDistance(word, thresholds = DISTANCE_THRESHOLDS) {
  if (word.length <= thresholds.shortMaxLen) {
    return thresholds.shortMaxDistance;
  }
  if (word.length <= thresholds.mediumMaxLen) {
    return thresholds.mediumMaxDistance;
  }
  return thresholds.longMaxDistance;
}

// WHY FILTER? Comparing against every dictionary word is slow when the
// dictionary has 50,000+ words. Each comparison costs about
// (length of typed word) x (length of dictionary word) steps.
// One edit can change a word's length by only 1. So if a word's length
// differs from the typed word by more than maxDistance, it can never
// be close enough. We skip those words without calculating anything.
// Example: typed "wich" (4 letters), maxDistance 1
//          -> only look at words with 3, 4 or 5 letters.
function getCandidates(word) {
  const maxDistance = getMaxDistance(word);
  const candidates = [];

  for (let len = word.length - maxDistance; len <= word.length + maxDistance; len++) {
    const group = wordsByLength[len];
    if (group !== undefined) {
      for (let i = 0; i < group.length; i++) {
        candidates.push(group[i]);
      }
    }
  }
  return candidates;
}

// ------------------------------------------------------------
// STEP 4: Edit distance (Standard Levenshtein & Transposition Extension)
// ------------------------------------------------------------
// FOUNDATION: Standard Levenshtein Distance
// Minimum number of single-letter changes to turn word A into word B:
//   insertion    = add a letter to A
//   deletion     = remove a letter from A
//   substitution = replace a letter in A
//
// NOTE ON TRANSPOSITIONS:
// Standard Levenshtein treats an adjacent transposition (like "teh" -> "the"
// or "recieve" -> "receive") as 2 separate substitutions (or 1 insertion + 1 deletion).
// For human typists, adjacent transposition is a single slip of the fingers.
// We keep standard Levenshtein intact below for clarity, and extend the engine's
// distance calculation to Damerau-Levenshtein (Optimal String Alignment) to treat
// adjacent transpositions as a single primitive operation of cost 1.

// Standard Levenshtein DP table (3 operations: ins, del, sub)
function buildStandardLevenshteinTable(a, b) {
  const table = [];

  for (let i = 0; i <= a.length; i++) {
    table[i] = [];
    for (let j = 0; j <= b.length; j++) {
      table[i][j] = 0;
    }
  }

  for (let i = 0; i <= a.length; i++) {
    table[i][0] = i; // i deletions
  }
  for (let j = 0; j <= b.length; j++) {
    table[0][j] = j; // j insertions
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const deletion = table[i - 1][j] + 1;
      const insertion = table[i][j - 1] + 1;
      const substitution = table[i - 1][j - 1] + cost;
      table[i][j] = Math.min(deletion, insertion, substitution);
    }
  }
  return table;
}

function levenshteinDistance(a, b) {
  const table = buildStandardLevenshteinTable(a, b);
  return table[a.length][b.length];
}

// EXTENSION: Damerau-Levenshtein / Optimal String Alignment distance
// Extends standard Levenshtein by allowing adjacent character transposition:
//   table[i][j] = min(deletion, insertion, substitution, transposition)
function buildDistanceTable(a, b) {
  const table = [];

  for (let i = 0; i <= a.length; i++) {
    table[i] = [];
    for (let j = 0; j <= b.length; j++) {
      table[i][j] = 0;
    }
  }

  for (let i = 0; i <= a.length; i++) {
    table[i][0] = i; // deletions
  }
  for (let j = 0; j <= b.length; j++) {
    table[0][j] = j; // insertions
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const deletion = table[i - 1][j] + 1;
      const insertion = table[i][j - 1] + 1;
      const substitution = table[i - 1][j - 1] + cost;

      let minVal = Math.min(deletion, insertion, substitution);

      // Check for adjacent character transposition (e.g. "teh" -> "the", "recieve" -> "receive")
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        const transposition = table[i - 2][j - 2] + 1;
        minVal = Math.min(minVal, transposition);
      }

      table[i][j] = minVal;
    }
  }
  return table;
}

function damerauLevenshteinDistance(a, b) {
  const table = buildDistanceTable(a, b);
  return table[a.length][b.length];
}

// Walks backward through the DP table to determine WHICH operations were used.
// Accounts for transpositions as distinct operations alongside insertions, deletions, and substitutions.
function countOperations(a, b, table) {
  let insertions = 0;
  let deletions = 0;
  let substitutions = 0;
  let transpositions = 0;
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && table[i][j] === table[i - 1][j - 1]) {
      // Characters match, no operation
      i--;
      j--;
    } else if (i > 1 && j > 1 &&
               a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] &&
               table[i][j] === table[i - 2][j - 2] + 1) {
      // Adjacent character transposition
      transpositions++;
      i -= 2;
      j -= 2;
    } else if (i > 0 && j > 0 && table[i][j] === table[i - 1][j - 1] + 1) {
      // Single character substitution
      substitutions++;
      i--;
      j--;
    } else if (i > 0 && table[i][j] === table[i - 1][j] + 1) {
      // Character deletion
      deletions++;
      i--;
    } else if (j > 0 && table[i][j] === table[i][j - 1] + 1) {
      // Character insertion
      insertions++;
      j--;
    } else {
      break;
    }
  }
  return {
    insertions: insertions,
    deletions: deletions,
    substitutions: substitutions,
    transpositions: transpositions
  };
}

// ------------------------------------------------------------
// STEP 5: Rank candidates
// ------------------------------------------------------------
// Deterministic ranking formula:
// 1) Priority 1: Lowest edit distance / correction cost (fewer edits is always primary)
// 2) Priority 2: Quality of character match / similarity percentage (closer visual match beats distant match)
// 3) Priority 3: Word frequency (breaks ties between equally close visual matches)
// 4) Priority 4: Alphabetical order (guarantees deterministic, reproducible sorting)
function compareSuggestions(x, y) {
  // 1. Edit distance (lower is better)
  if (x.distance !== y.distance) {
    return x.distance - y.distance;
  }
  // 2. Character match quality / similarity percentage (higher is better)
  if (x.similarity !== y.similarity) {
    return y.similarity - x.similarity;
  }
  // 3. Word frequency (higher is better)
  if (x.frequency !== y.frequency) {
    return y.frequency - x.frequency;
  }
  // 4. Alphabetical tie-breaker
  if (x.word < y.word) {
    return -1;
  }
  return 1;
}

// ------------------------------------------------------------
// MAIN FUNCTION
// ------------------------------------------------------------
// Always returns an object with a "status":
//   "empty"       - nothing to check
//   "skipped"     - email / url / number (see "reason")
//   "known"       - word already in dictionary
//   "suggestions" - suggestions list filled
//   "no_match"    - nothing close enough
function spellCheck(rawInput) {
  const result = {
    status: "",
    original: rawInput,
    word: "",
    reason: "",
    candidatesChecked: 0,
    suggestions: []
  };

  // Empty input
  if (rawInput === undefined || rawInput === null || rawInput.trim() === "") {
    result.status = "empty";
    return result;
  }

  // Emails, URLs, numbers: never correct
  const skipReason = getSkipReason(rawInput);
  if (skipReason !== "") {
    result.status = "skipped";
    result.reason = skipReason;
    return result;
  }

  // Clean punctuation, remember capitalization, lowercase
  const letters = stripEdges(rawInput);
  if (letters === "") {
    result.status = "empty"; // only punctuation, like "!!!"
    return result;
  }
  const caseStyle = getCaseStyle(letters);
  const word = letters.toLowerCase();
  result.word = word;

  // Already a real word? Then do nothing.
  if (wordFrequency[word] !== undefined) {
    result.status = "known";
    return result;
  }

  // Pick candidates, measure distance, keep close ones
  const maxDistance = getMaxDistance(word);
  const candidates = getCandidates(word);
  result.candidatesChecked = candidates.length;

  const scored = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const table = buildDistanceTable(word, candidate);
    const distance = table[word.length][candidate.length];

    if (distance <= maxDistance) {
      const ops = countOperations(word, candidate, table);
      const longer = Math.max(word.length, candidate.length);
      scored.push({
        word: candidate,
        distance: distance,
        similarity: Math.round((1 - distance / longer) * 100),
        frequency: wordFrequency[candidate],
        insertions: ops.insertions,
        deletions: ops.deletions,
        substitutions: ops.substitutions,
        transpositions: ops.transpositions
      });
    }
  }

  scored.sort(compareSuggestions);

  // Keep top 3 and restore original capitalization
  const top = scored.slice(0, MAX_SUGGESTIONS);
  for (let i = 0; i < top.length; i++) {
    top[i].word = applyCaseStyle(top[i].word, caseStyle);
  }
  result.suggestions = top;

  if (top.length === 0) {
    result.status = "no_match";
  } else {
    result.status = "suggestions";
  }
  return result;
}

// ============================================================
// SENTENCE-LEVEL CORRECTION
// ============================================================
// Processes multi-word text, sentences, or paragraphs:
// - Preserves all original whitespace, punctuation, capitalization, and numbers.
// - Skips URLs and email addresses.
// - Calls the core spellCheck() for each individual word candidate.
// - Returns full corrected text, token breakdown, and correction metadata
//   suitable for UI highlighting and replacement popovers.
function spellCheckSentence(text) {
  if (text === undefined || text === null || typeof text !== "string") {
    return {
      original: "",
      corrected: "",
      correctionsCount: 0,
      tokens: [],
      corrections: []
    };
  }

  if (text.length === 0) {
    return {
      original: "",
      corrected: "",
      correctionsCount: 0,
      tokens: [],
      corrections: []
    };
  }

  // Lossless tokenization:
  // 1. URLs (http://, https://, www.) up to trailing punctuation or whitespace
  // 2. Emails (user@domain.ext)
  // 3. Words (including internal apostrophes like don't, it's)
  // 4. Numbers (integers, decimals, comma-separated)
  // 5. Whitespace (spaces, tabs, newlines)
  // 6. Non-alphanumeric punctuation and symbols
  const tokenPattern = /(https?:\/\/[^\s,;!?)]+|www\.[^\s,;!?)]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z]+(?:'[a-zA-Z]+)*|\d+(?:[.,]\d+)*|\s+|[^a-zA-Z0-9\s]+)/g;

  const rawTokens = text.match(tokenPattern) || [text];
  const tokens = [];
  const corrections = [];
  let correctedText = "";
  let currentIndex = 0;

  for (let i = 0; i < rawTokens.length; i++) {
    const rawToken = rawTokens[i];
    const startIndex = currentIndex;
    const endIndex = startIndex + rawToken.length;
    currentIndex = endIndex;

    // Fast check: is this token a word candidate? (Must contain at least one ASCII letter)
    const isWordCandidate = /[a-zA-Z]/.test(rawToken);

    if (!isWordCandidate) {
      // Whitespace, numbers, or punctuation: preserve exactly as typed
      tokens.push({
        text: rawToken,
        isWord: false,
        corrected: false,
        originalWord: rawToken,
        correctedWord: rawToken,
        status: "non_word",
        startIndex: startIndex,
        endIndex: endIndex
      });
      correctedText += rawToken;
      continue;
    }

    // Call existing single-word spellCheck
    const checkResult = spellCheck(rawToken);

    if (checkResult.status === "suggestions" && checkResult.suggestions.length > 0) {
      const topSuggestion = checkResult.suggestions[0];
      const replacement = topSuggestion.word;

      const correctionMeta = {
        originalWord: rawToken,
        correctedWord: replacement,
        distance: topSuggestion.distance,
        similarity: topSuggestion.similarity,
        operations: {
          insertions: topSuggestion.insertions,
          deletions: topSuggestion.deletions,
          substitutions: topSuggestion.substitutions,
          transpositions: topSuggestion.transpositions
        },
        isTransposition: topSuggestion.transpositions > 0,
        allSuggestions: checkResult.suggestions,
        startIndex: startIndex,
        endIndex: endIndex
      };

      tokens.push({
        text: replacement,
        isWord: true,
        corrected: true,
        originalWord: rawToken,
        correctedWord: replacement,
        status: checkResult.status,
        details: correctionMeta,
        startIndex: startIndex,
        endIndex: endIndex
      });

      corrections.push(correctionMeta);
      correctedText += replacement;
    } else {
      // Known word, skipped item (URL/email/number), or no close match
      tokens.push({
        text: rawToken,
        isWord: true,
        corrected: false,
        originalWord: rawToken,
        correctedWord: rawToken,
        status: checkResult.status,
        reason: checkResult.reason || "",
        startIndex: startIndex,
        endIndex: endIndex
      });
      correctedText += rawToken;
    }
  }

  return {
    original: text,
    corrected: correctedText,
    correctionsCount: corrections.length,
    tokens: tokens,
    corrections: corrections
  };
}
