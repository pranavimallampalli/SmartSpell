# SmartSpell

A fast, browser-based spelling correction writing tool powered by Damerau-Levenshtein distance and dynamic programming.

---

## Overview

**SmartSpell** is a client-side writing assistant that detects spelling mistakes and provides ranked suggestions directly in the browser. It combines algorithmic edit-distance calculation with dictionary lookup and frequency weighting—running entirely locally with zero backend dependencies, cloud calls, or external APIs.

---

## Problem Statement

Standard spell-check implementations often rely either on heavy server-side NLP pipelines or basic Levenshtein distance algorithms. Basic Levenshtein distance treats adjacent character transpositions (e.g., `teh` → `the`, `recieve` → `receive`) as two independent operations (one deletion and one insertion, or two substitutions). For human typists, however, swapping adjacent letters is a single keystroke error. Furthermore, full dictionary scans across large lexicons become computationally expensive without intelligent candidate pruning.

---

## Solution

SmartSpell implements the **Damerau-Levenshtein (Optimal String Alignment)** algorithm via Dynamic Programming. It accounts for adjacent transpositions as a single-cost operation alongside insertions, deletions, and substitutions. To ensure instant browser responsiveness, the engine pre-indexes the lexicon by word length and filters candidates within a bounded edit window before computing the distance matrix.

---

## Key Features

* **Damerau-Levenshtein Edit Distance**: Recognizes insertions, deletions, substitutions, and adjacent transpositions.
* **Intelligent Candidate Pruning**: Filters dictionary lookups by length window ($L \pm \text{maxDistance}$) to prevent brute-force comparisons.
* **Multi-Factor Candidate Ranking**: Combines edit distance, percentage string similarity, and corpus word frequency to rank suggestions accurately.
* **Sentence-Level Processing**: Analyzes multi-word text while strictly preserving:
  * Leading, trailing, and internal whitespace (spaces, tabs, newlines)
  * Surrounding punctuation (commas, quotes, semicolons, exclamation points)
  * Character casing styles (lowercase, TitleCase, UPPERCASE)
  * Skipped tokens (URLs, email addresses, numbers)
* **Contextual Suggestion Popover**: Clicking an underlined word reveals the top suggestion, alternatives, and an edit explanation (e.g., *"Swapped two letters"*, *"One letter missing"*).
* **Single-Click Reassembly**: Selecting a suggestion replaces the misspelled word and updates the document without altering surrounding text or formatting.
* **100% Client-Side**: Operates entirely in the browser with vanilla JavaScript. No data leaves your machine.

---

## How It Works

The correction pipeline processes input through seven distinct phases:

```
User Input
    │
    ▼
1. Tokenization & Normalization
   Extract words, whitespace, and punctuation; detect casing and skip tokens (URLs/emails/numbers)
    │
    ▼
2. Dictionary Check
   Check if the normalized token exists in the local lexicon
    │
    ▼
3. Candidate Generation & Length Pruning
   Select dictionary entries within length window [length - maxDistance, length + maxDistance]
    │
    ▼
4. Damerau-Levenshtein Distance (Dynamic Programming)
   Compute exact edit operations (insertions, deletions, substitutions, transpositions)
    │
    ▼
5. Multi-Factor Ranking
   Score candidates: Score = (0.45 × dist) + (0.35 × (1 - sim)) + (0.20 × (1 - freq))
    │
    ▼
6. Interactive Presentation
   Render text with wavy underlines under detected typos; attach contextual popovers
    │
    ▼
7. Sentence Reconstruction
   Apply selected corrections while restoring original casing and punctuation
```

---

## Algorithm & DAA Concepts

### 1. Damerau-Levenshtein Distance (Optimal String Alignment)
The algorithm calculates the minimum number of single-character operations required to transform string $A$ into string $B$. The four permitted operations each carry a cost of $1$:

1. **Insertion**: Adding a character (`wich` → `which`)
2. **Deletion**: Removing a character (`occassion` → `occasion`)
3. **Substitution**: Replacing one character with another (`grammer` → `grammar`)
4. **Adjacent Transposition**: Swapping two adjacent characters (`recieve` → `receive`, `teh` → `the`)

### 2. Dynamic Programming Formulation
A 2D matrix $D[0 \dots M, 0 \dots N]$ is populated where $M = |A|$ and $N = |B|$. The base cases represent deletions from $A$ and insertions into $A$:

$$D[i, 0] = i \quad \text{for } 0 \le i \le M$$
$$D[0, j] = j \quad \text{for } 0 \le j \le N$$

For each cell $(i, j)$, the cost is computed as:

$$D[i, j] = \min \begin{cases}
D[i-1, j] + 1 & \text{(Deletion)} \\
D[i, j-1] + 1 & \text{(Insertion)} \\
D[i-1, j-1] + \text{cost} & \text{(Substitution, where cost is 0 if } A[i]=B[j] \text{ else 1)} \\
D[i-2, j-2] + 1 & \text{(Transposition, if } i, j > 1 \text{ and } A[i]=B[j-1] \text{ and } A[i-1]=B[j]\text{)}
\end{cases}$$

**Time Complexity**: $O(M \times N)$ per candidate comparison.  
**Space Complexity**: $O(M \times N)$ for the dynamic programming table.

### 3. Traceback & Operation Identification
By tracing back from cell $(M, N)$ to $(0, 0)$, the engine tallies the exact operations used. This information powers the user-facing explanation in the suggestion popover:

* **Transposition > 0**: *"Swapped two letters"*
* **Insertions > 0**: *"One letter missing"*
* **Deletions > 0**: *"Extra letter"*
* **Substitutions > 0**: *"Character changed"*

---

## Technology Stack

* **Structure**: HTML5 (Semantic document markup)
* **Styling**: Vanilla CSS3 (Custom design system, flexbox layout, CSS custom properties, responsive media queries)
* **Typography**: Inter & JetBrains Mono (via Google Fonts)
* **Logic**: Vanilla JavaScript (ES6+, dynamic programming engine, DOM event controller)
* **Testing**: Node.js & browser-based assertion runner

---

## Project Structure

```
SmartSpell/
├── index.html       # Application UI, responsive layout, and interactive presentation
├── engine.js        # Damerau-Levenshtein algorithm, candidate generator, ranking & tokenization
├── dictionary.js    # Local lexicon with frequency rankings and length indexing
├── tests.js         # Automated test suite (unit tests and sentence test fixtures)
└── README.md        # Project documentation
```

---

## Example Corrections

| Input Token | Suggested Word | Identified Error Type | Distance |
| :--- | :--- | :--- | :--- |
| `recieve` | `receive` | Adjacent transposition | 1 |
| `yuo` | `you` | Adjacent transposition | 1 |
| `mesage` | `message` | Missing letter (insertion) | 1 |
| `tommorow` | `tomorrow` | Extra letter (deletion) | 1 |
| `meting` | `meeting` | Missing letter (insertion) | 1 |
| `computr` | `computer` | Missing letter (insertion) | 1 |
| `scienc` | `science` | Missing letter (insertion) | 1 |
| `frm` | `from` | Missing letter (insertion) | 1 |
| `definately` | `definitely` | Substitution | 1 |

### Sentence Preservation Example:
* **Input**: `"I recieve the mesage yuo sent."`
* **Output**: `"I receive the message you sent."`
* **Preservation**: Quotes, capitalization, and internal spacing remain intact throughout correction.

---

## Architectural Limitation

* **Word Splitting (`iam` → `I am`)**:  
  SmartSpell operates strictly on 1:1 token-to-word dictionary mappings. Compound words or concatenated tokens that require splitting into multiple dictionary entries (such as `iam` → `I am`) are not handled by single-word edit distance and are left uncorrected to prevent inaccurate candidate matches.

---

## Testing

SmartSpell includes a built-in automated test suite covering single-word typo patterns, known-word skips, edge cases, and multi-word sentence fixtures:

* **Typo Top-1 Accuracy**: 38/38 passing
* **Typo Top-3 Inclusion**: 38/38 passing
* **Edge / Skip / Known Cases**: 8/8 passing (URLs, emails, numbers, gibberish)
* **Sentence Reconstruction**: 8/8 passing
* **Total Automated Assertions**: **46/46 passing (100%)**

### Running Tests:
1. **In the Browser**: Click the **"How it works"** link in the top-right header of the web app, navigate to the **Test Suite** tab, and click **"Run tests"**.
2. **In Node.js**:
   ```bash
   node -e "
     const fs = require('fs');
     eval(fs.readFileSync('dictionary.js', 'utf8'));
     eval(fs.readFileSync('engine.js', 'utf8'));
     eval(fs.readFileSync('tests.js', 'utf8'));
     console.log(runTests());
   "
   ```

---

## Running Locally

Since SmartSpell has zero build steps or package dependencies, it can be launched directly:

### Option 1: Open Directly in Browser
Double-click `index.html` or open it from your browser:
```
file:///path/to/SmartSpell/index.html
```

### Option 2: Run a Local Static Server
Using Node.js:
```bash
npx serve .
# or
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your web browser.

---

## Live Demo

A live deployment of this project is hosted on GitHub Pages:

🔗 **[https://pranavimallampalli.github.io/SmartSpell/](https://pranavimallampalli.github.io/SmartSpell/)**

---

## Future Improvements

* **Expanded Dictionary**: Integrating a larger frequency-balanced corpus (such as Norvig's N-gram frequency lexicon).
* **Token Splitting**: Adding compound word splitting and space-insertion heuristics for merged tokens (e.g., `iam` → `I am`).
* **Phonetic Matching (Double Metaphone / Soundex)**: Pre-filtering candidates based on phonetic similarity to catch homophone errors.
* **Custom User Lexicon**: Allowing users to add personal technical jargon or domain-specific names to a local storage dictionary.
