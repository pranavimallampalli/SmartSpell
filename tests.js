// ============================================================
// tests.js  -  small test list for the engine
// expected:  a word        -> that word should appear in the suggestions
//            "KNOWN"       -> word must be recognized, no correction
//            "SKIP"        -> must be skipped (email/url/number)
//            "NONE"        -> must give no suggestions
// ============================================================
const TEST_CASES = [
  // insertion errors (extra letter typed)
  { typed: "occassion", expected: "occasion", type: "extra letter" },
  { typed: "necessarry", expected: "necessary", type: "extra letter" },
  { typed: "beautifull", expected: "beautiful", type: "extra letter" },
  { typed: "tommorrow", expected: "tomorrow", type: "extra letter" },
  { typed: "untill", expected: "until", type: "extra letter" },
  // deletion errors (missing letter)
  { typed: "recive", expected: "receive", type: "missing letter" },
  { typed: "wich", expected: "which", type: "missing letter" },
  { typed: "adress", expected: "address", type: "missing letter" },
  { typed: "begining", expected: "beginning", type: "missing letter" },
  { typed: "tomorow", expected: "tomorrow", type: "missing letter" },
  { typed: "scienc", expected: "science", type: "missing letter" },
  // substitution errors
  { typed: "seperate", expected: "separate", type: "wrong letter" },
  { typed: "grammer", expected: "grammar", type: "wrong letter" },
  { typed: "relevent", expected: "relevant", type: "wrong letter" },
  { typed: "calender", expected: "calendar", type: "wrong letter" },
  { typed: "definately", expected: "definitely", type: "wrong letter" },
  // swapped letters
  { typed: "recieve", expected: "receive", type: "swapped letters" },
  { typed: "freind", expected: "friend", type: "swapped letters" },
  { typed: "becuase", expected: "because", type: "swapped letters" },
  { typed: "wierd", expected: "weird", type: "swapped letters" },
  { typed: "thier", expected: "their", type: "swapped letters" },
  { typed: "taht", expected: "that", type: "swapped letters" },
  // keyboard-neighbor typos
  { typed: "hrllo", expected: "hello", type: "nearby key" },
  { typed: "bpok", expected: "book", type: "nearby key" },
  { typed: "juat", expected: "just", type: "nearby key" },
  { typed: "qyick", expected: "quick", type: "nearby key" },
  { typed: "smsll", expected: "small", type: "nearby key" },
  // short and long words
  { typed: "teh", expected: "the", type: "short word" },
  { typed: "yuo", expected: "you", type: "short word" },
  { typed: "extrordinary", expected: "extraordinary", type: "long word" },
  { typed: "responsibilty", expected: "responsibility", type: "long word" },
  { typed: "accomodation", expected: "accommodation", type: "long word" },
  { typed: "unfortunatly", expected: "unfortunately", type: "long word" },
  // multiple mistakes
  { typed: "wensday", expected: "wednesday", type: "2 mistakes" },
  { typed: "sucessfull", expected: "successful", type: "2 mistakes" },
  { typed: "definatly", expected: "definitely", type: "2 mistakes" },
  // capitalization and punctuation
  { typed: "RECIEVE", expected: "receive", type: "uppercase" },
  { typed: "Recieve!", expected: "receive", type: "capital + punctuation" },
  // already correct
  { typed: "receive", expected: "KNOWN", type: "known word" },
  { typed: "Hello,", expected: "KNOWN", type: "known word" },
  { typed: "bitcoin", expected: "KNOWN", type: "known word" },
  // must be skipped
  { typed: "https://example.com", expected: "SKIP", type: "url" },
  { typed: "name@mail.com", expected: "SKIP", type: "email" },
  { typed: "12345", expected: "SKIP", type: "number" },
  // no good answer
  { typed: "zzzzq", expected: "NONE", type: "gibberish" },
  { typed: "asdfgh", expected: "NONE", type: "gibberish" }
];

// Runs every test and returns one row per test plus a summary.
function runTests() {
  const rows = [];
  let top1 = 0;
  let top3 = 0;
  let typoTotal = 0;
  let otherPass = 0;
  let otherTotal = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const t = TEST_CASES[i];
    const r = spellCheck(t.typed);
    const names = [];
    for (let k = 0; k < r.suggestions.length; k++) {
      names.push(r.suggestions[k].word.toLowerCase());
    }
    let inTop1 = false;
    let inTop3 = false;
    let pass = false;

    if (t.expected === "KNOWN") {
      pass = r.status === "known";
    } else if (t.expected === "SKIP") {
      pass = r.status === "skipped";
    } else if (t.expected === "NONE") {
      pass = r.status === "no_match";
    } else {
      inTop1 = names[0] === t.expected;
      inTop3 = names.indexOf(t.expected) !== -1;
      pass = inTop3;
    }

    if (t.expected !== "KNOWN" && t.expected !== "SKIP" && t.expected !== "NONE") {
      typoTotal++;
      if (inTop1) { top1++; }
      if (inTop3) { top3++; }
    } else {
      otherTotal++;
      if (pass) { otherPass++; }
    }
    rows.push({ typed: t.typed, expected: t.expected, type: t.type,
                got: names.join(", ") || r.status, top1: inTop1, pass: pass });
  }

  // Run sentence test suite
  const sentenceResults = runSentenceTests();

  return {
    rows: rows,
    top1: top1,
    top3: top3,
    typoTotal: typoTotal,
    otherPass: otherPass,
    otherTotal: otherTotal,
    sentencePass: sentenceResults.passed,
    sentenceTotal: sentenceResults.total,
    sentenceRows: sentenceResults.rows
  };
}

// ============================================================
// SENTENCE TEST SUITE
// ============================================================
const SENTENCE_TEST_CASES = [
  {
    name: "Example 1 (multiple typos with transpositions)",
    input: "I recieve the mesage yuo sent.",
    expected: "I receive the message you sent.",
    expectedCorrectionsCount: 3
  },
  {
    name: "Example 2 (multiple typos with substitution and transposition)",
    input: "She definately recieved teh adress yesterday.",
    expected: "She definitely received the address yesterday.",
    expectedCorrectionsCount: 4
  },
  {
    name: "Punctuation preservation (quotes, commas, exclamation, semicolon)",
    input: "\"Wait! Don't go,\" she said; \"recieve teh mesage.\"",
    expected: "\"Wait! Don't go,\" she said; \"receive the message.\"",
    expectedCorrectionsCount: 3
  },
  {
    name: "Capitalization preservation (TitleCase, UPPERCASE, mixed)",
    input: "RECIEVE Teh Mesage!",
    expected: "RECEIVE The Message!",
    expectedCorrectionsCount: 3
  },
  {
    name: "Already-correct words (no unwanted changes)",
    input: "The python browser and keyboard work.",
    expected: "The python browser and keyboard work.",
    expectedCorrectionsCount: 0
  },
  {
    name: "URL, email, and number preservation",
    input: "Visit https://example.com or mail user@test.com with 12345 words!",
    expected: "Visit https://example.com or mail user@test.com with 12345 words!",
    expectedCorrectionsCount: 0
  },
  {
    name: "Sentence with no corrections needed",
    input: "This is the good new day.",
    expected: "This is the good new day.",
    expectedCorrectionsCount: 0
  },
  {
    name: "Whitespace preservation (spaces, tabs, newlines)",
    input: "I recieve\n\tthe   mesage.",
    expected: "I receive\n\tthe   message.",
    expectedCorrectionsCount: 2
  }
];

function runSentenceTests() {
  const results = [];
  let passed = 0;

  for (let i = 0; i < SENTENCE_TEST_CASES.length; i++) {
    const tc = SENTENCE_TEST_CASES[i];
    const res = spellCheckSentence(tc.input);
    const textMatches = res.corrected === tc.expected;
    const countMatches = tc.expectedCorrectionsCount === undefined || res.correctionsCount === tc.expectedCorrectionsCount;
    const isPass = textMatches && countMatches;

    if (isPass) {
      passed++;
    }

    results.push({
      name: tc.name,
      input: tc.input,
      expected: tc.expected,
      got: res.corrected,
      correctionsCount: res.correctionsCount,
      pass: isPass
    });
  }

  return {
    rows: results,
    passed: passed,
    total: SENTENCE_TEST_CASES.length
  };
}
