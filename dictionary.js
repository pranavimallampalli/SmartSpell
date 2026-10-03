// ============================================================
// dictionary.js  -  PROTOTYPE DICTIONARY (separate from the algorithm)
// ============================================================
// IMPORTANT: The frequency numbers below are made-up DEMO values.
// They are NOT real-world statistics. They only show the idea that
// common words (like "with") should rank above rare words (like "wick").
//
// Later: replace this array with a real word-frequency list.
// Keep the same shape:  { word: "text", frequency: number }
// engine.js only needs this one array called DICTIONARY.
// ============================================================

const DICTIONARY = [
  // --- very common words (also useful for short-word typos) ---
  { word: "the", frequency: 1000000 }, { word: "and", frequency: 600000 },
  { word: "i", frequency: 950000 }, { word: "a", frequency: 990000 },
  { word: "an", frequency: 300000 }, { word: "he", frequency: 280000 },
  { word: "she", frequency: 260000 }, { word: "sent", frequency: 60000 },
  { word: "yesterday", frequency: 50000 }, { word: "or", frequency: 320000 },
  { word: "go", frequency: 180000 }, { word: "said", frequency: 190000 },
  { word: "wait", frequency: 60000 }, { word: "meeting", frequency: 50000 },
  { word: "science", frequency: 50000 },
  { word: "you", frequency: 500000 }, { word: "that", frequency: 450000 },
  { word: "with", frequency: 400000 }, { word: "have", frequency: 350000 },
  { word: "this", frequency: 340000 }, { word: "from", frequency: 330000 },
  { word: "they", frequency: 300000 }, { word: "there", frequency: 290000 },
  { word: "their", frequency: 280000 }, { word: "what", frequency: 270000 },
  { word: "is", frequency: 400000 }, { word: "are", frequency: 300000 },
  { word: "was", frequency: 280000 }, { word: "were", frequency: 100000 },
  { word: "for", frequency: 420000 }, { word: "not", frequency: 380000 },
  { word: "but", frequency: 260000 }, { word: "all", frequency: 250000 },
  { word: "can", frequency: 240000 }, { word: "will", frequency: 230000 },
  { word: "would", frequency: 150000 }, { word: "could", frequency: 120000 },
  { word: "should", frequency: 90000 }, { word: "about", frequency: 160000 },
  { word: "when", frequency: 150000 }, { word: "who", frequency: 110000 },
  { word: "how", frequency: 140000 }, { word: "why", frequency: 70000 },
  { word: "here", frequency: 100000 }, { word: "where", frequency: 80000 },
  { word: "more", frequency: 140000 }, { word: "very", frequency: 90000 },
  { word: "some", frequency: 120000 }, { word: "time", frequency: 130000 },
  { word: "people", frequency: 90000 }, { word: "know", frequency: 100000 },
  { word: "good", frequency: 110000 }, { word: "new", frequency: 120000 },
  { word: "first", frequency: 90000 }, { word: "day", frequency: 100000 },
  { word: "make", frequency: 100000 }, { word: "get", frequency: 120000 },
  { word: "like", frequency: 130000 }, { word: "use", frequency: 110000 },
  { word: "work", frequency: 100000 }, { word: "way", frequency: 90000 },
  { word: "want", frequency: 80000 }, { word: "give", frequency: 50000 },
  { word: "take", frequency: 70000 }, { word: "think", frequency: 80000 },
  { word: "come", frequency: 70000 }, { word: "look", frequency: 80000 },
  { word: "need", frequency: 85000 }, { word: "thank", frequency: 30000 },
  { word: "thanks", frequency: 45000 }, { word: "please", frequency: 60000 },
  { word: "sorry", frequency: 30000 }, { word: "yes", frequency: 60000 },
  { word: "your", frequency: 150000 }, { word: "then", frequency: 150000 },
  { word: "them", frequency: 100000 }, { word: "than", frequency: 90000 },
  { word: "any", frequency: 100000 }, { word: "add", frequency: 20000 },
  { word: "tea", frequency: 8000 }, { word: "ten", frequency: 25000 },
  { word: "just", frequency: 300000 }, { word: "must", frequency: 70000 },
  { word: "because", frequency: 200000 }, { word: "until", frequency: 80000 },
  { word: "through", frequency: 120000 }, { word: "though", frequency: 60000 },
  { word: "thought", frequency: 90000 }, { word: "enough", frequency: 60000 },
  { word: "don't", frequency: 120000 }, { word: "it's", frequency: 150000 },
  { word: "can't", frequency: 90000 },

  // --- ranking-tie group (all close to "wich", "rcih", etc.) ---
  { word: "which", frequency: 95000 }, { word: "witch", frequency: 4000 },
  { word: "rich", frequency: 30000 }, { word: "wick", frequency: 900 },
  { word: "wish", frequency: 40000 }, { word: "white", frequency: 60000 },
  { word: "watch", frequency: 45000 }, { word: "switch", frequency: 12000 },
  { word: "pitch", frequency: 5000 },

  // --- words from common spelling mistakes ---
  { word: "receive", frequency: 20000 }, { word: "received", frequency: 25000 },
  { word: "believe", frequency: 35000 }, { word: "friend", frequency: 38000 },
  { word: "friends", frequency: 30000 }, { word: "weird", frequency: 8000 },
  { word: "address", frequency: 22000 }, { word: "definitely", frequency: 30000 },
  { word: "separate", frequency: 15000 }, { word: "occasion", frequency: 9000 },
  { word: "tomorrow", frequency: 35000 }, { word: "necessary", frequency: 25000 },
  { word: "beautiful", frequency: 40000 }, { word: "grammar", frequency: 8000 },
  { word: "relevant", frequency: 20000 }, { word: "calendar", frequency: 18000 },
  { word: "privilege", frequency: 6000 }, { word: "beginning", frequency: 20000 },
  { word: "wednesday", frequency: 12000 }, { word: "successful", frequency: 28000 },
  { word: "interesting", frequency: 40000 }, { word: "extraordinary", frequency: 8000 },
  { word: "responsibility", frequency: 22000 }, { word: "accommodation", frequency: 7000 },
  { word: "congratulations", frequency: 8000 }, { word: "unfortunately", frequency: 25000 },
  { word: "wrong", frequency: 40000 }, { word: "write", frequency: 70000 },
  { word: "writing", frequency: 35000 }, { word: "wrote", frequency: 20000 },

  // --- technology words ---
  { word: "message", frequency: 60000 }, { word: "messages", frequency: 30000 },
  { word: "python", frequency: 30000 }, { word: "javascript", frequency: 25000 },
  { word: "browser", frequency: 20000 }, { word: "keyboard", frequency: 15000 },
  { word: "computer", frequency: 70000 }, { word: "internet", frequency: 80000 },
  { word: "website", frequency: 50000 }, { word: "software", frequency: 45000 },
  { word: "android", frequency: 18000 }, { word: "mobile", frequency: 28000 },
  { word: "phone", frequency: 65000 }, { word: "program", frequency: 50000 },
  { word: "programming", frequency: 20000 }, { word: "code", frequency: 60000 },
  { word: "coding", frequency: 12000 }, { word: "typing", frequency: 5000 },
  { word: "spelling", frequency: 3000 }, { word: "correct", frequency: 40000 },
  { word: "correction", frequency: 5000 }, { word: "suggestion", frequency: 6000 },
  { word: "suggestions", frequency: 7000 }, { word: "dictionary", frequency: 6000 },
  { word: "search", frequency: 90000 }, { word: "language", frequency: 55000 },
  { word: "emoji", frequency: 6000 }, { word: "bitcoin", frequency: 9000 },

  // --- short words and keyboard-neighbor practice ---
  { word: "hello", frequency: 90000 }, { word: "hell", frequency: 20000 },
  { word: "help", frequency: 90000 }, { word: "book", frequency: 70000 },
  { word: "books", frequency: 25000 }, { word: "boot", frequency: 6000 },
  { word: "boom", frequency: 3000 }, { word: "took", frequency: 50000 },
  { word: "key", frequency: 55000 }, { word: "keys", frequency: 20000 },
  { word: "quick", frequency: 25000 }, { word: "quite", frequency: 60000 },
  { word: "quit", frequency: 10000 }, { word: "small", frequency: 80000 },
  { word: "smell", frequency: 8000 }, { word: "smile", frequency: 15000 },
  { word: "word", frequency: 65000 }, { word: "words", frequency: 40000 },
  { word: "letter", frequency: 25000 }, { word: "letters", frequency: 15000 },
  { word: "form", frequency: 90000 }, { word: "forms", frequency: 25000 },
  { word: "cat", frequency: 20000 }, { word: "car", frequency: 40000 },
  { word: "cap", frequency: 8000 }, { word: "cut", frequency: 30000 }
];
