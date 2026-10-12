# GistCheck 🧠 · Micro-Learning Comprehension Assessor

> **SDG 4: Quality Education** · Problem Statement: **PRAYAS-INFO-26-S-007**  
> A high-fidelity micro-learning frontend that evaluates active recall and conceptual synthesis of technical texts under time constraints.

---

## 1. Product Summary & Methodology

GistCheck enforces active cognitive encoding rather than superficial skimming:
1. **Selection:** A student picks a curated technical article (or inputs custom documentation, research, or RFCs between 150–600 words).
2. **Timed Reading:** The student reads under a strict countdown window (with an amber alert when under 15 seconds). Anti-distraction and anti-copy deterrents (disabled text selection, blocked copy/cut/context menus, and tab-focus departure warnings) encourage pure attention.
3. **Active Recall Synthesis:** The article is **completely purged** from the React tree and memory state (set to `null`, never simply hidden). The student synthesizes the core premise in 2–5 sentences (20–150 words).
4. **Instant Multi-Criteria Rubric:** Instant feedback provides an animated 1–10 score ring, sub-score bars (*Main Idea*, *Key Details*, *Own-Words Originality*), itemized comparisons of *What you captured* vs *What you missed*, and an actionable improvement recommendation.
5. **Side-by-Side Review:** An expandable inspection drawer displays the original text with missed key points highlighted in context.
6. **Analytics History:** The `/history` page tracks retention trajectories, averages, and past attempt logs.

---

## 2. Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS with dynamic CSS variables for Light & Dark mode
- **Visuals & Charts:** Recharts for historical trendlines, Canvas-Confetti for positive reinforcement
- **Icons:** Lucide React
- **Architecture:** Decoupled typed API client (`/lib/api.ts`) with zero inline `fetch` calls, backed by an in-browser mock engine (`/lib/mock.ts`) and a 4-stage state machine hook (`/lib/useAttemptMachine.ts`).
- **Testing:** Vitest + React Testing Library + JSDOM

---

## 3. Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm (or pnpm / yarn)

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run local development server (runs fully in mock mode with no API keys needed)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run the unit test suite:
```bash
npm test
```

To run a production build:
```bash
npm run build
```

---

## 4. Switching From Mock Mode to Real Backend

By default, GistCheck runs 100% client-side in **Mock Mode** (`NEXT_PUBLIC_USE_MOCK=true`). All server calls pass through `/lib/api.ts` and are handled by the simulated evaluation engine in `/lib/mock.ts`.

### How to switch to your real backend in 2 steps:

1. Create a `.env.local` file in the root directory:
```env
# Disable mock mode
NEXT_PUBLIC_USE_MOCK=false

# Point to your real API server (e.g., FastAPI, Express, NestJS, Go, or Next.js route handlers)
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

2. **That's it!** No other file changes are required. `/lib/api.ts` automatically redirects all requests to `NEXT_PUBLIC_API_BASE_URL` with a 15-second `AbortController` timeout and typed error mappings (`ApiError`).

---

## 5. API Contract Specifications

All server requests conform strictly to the following contract in `/lib/types.ts`:

### 1. `GET /api/articles`
Fetches the catalogue of available articles.
- **Response:** `ArticleSummary[]`
```ts
interface ArticleSummary {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
}
```

### 2. `POST /api/attempts/start`
Initiates a new reading attempt session.
- **Request Body:**
```ts
{ articleId: string } | { customText: string; customTitle?: string }
```
- **Response:**
```ts
{
  attemptId: string;
  article: {
    title: string;
    text: string;
    wordCount: number;
  };
  readingSeconds: number;
}
```

### 3. `POST /api/attempts/{attemptId}/submit`
Submits the student's active-recall summary for multi-criteria assessment.
- **Request Body:**
```ts
{
  summary: string;        // 20 - 150 words
  tabSwitches: number;    // Count of visibilitychange departures
  pastedChars: number;    // Character count pasted
  writingSeconds: number; // Time spent drafting
}
```
- **Response (`EvaluationResult`):**
```ts
{
  finalScore: number;       // 1 - 10 integer
  subScores: {
    mainIdea: number;       // 1 - 10
    keyDetails: number;     // 1 - 10
    ownWords: number;       // 1 - 10
  };
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  feedback: string;
  tip: string;
  source: 'hybrid' | 'llm-only' | 'jev-only';
  needsReview: boolean;
  latencyMs: number;
}
```
- **Errors:**
```json
{
  "error": {
    "code": "RATE_LIMITED" | "INVALID_INPUT" | "READING_NOT_COMPLETED" | "SERVER_ERROR",
    "message": "Human-readable description"
  }
}
```

### 4. `GET /api/attempts/{attemptId}/reveal`
Retrieves original article text and missed concept highlights for post-assessment review.
- **Response:**
```ts
{
  article: {
    title: string;
    text: string;
  };
  highlights?: string[]; // Substrings to highlight in the source text
}
```

### 5. `GET /api/history`
Retrieves previous attempt records for progress visualization.
- **Response:**
```ts
{
  attempts: {
    attemptId: string;
    articleTitle: string;
    createdAt: string;
    finalScore: number;
    subScores: {
      mainIdea: number;
      keyDetails: number;
      ownWords: number;
    };
    source: string;
  }[];
}
```

---

## 6. Testing Error Injection in Mock Mode

You can test error resilience directly in the UI by appending `?mockError=<CODE>` to the URL:
- `?mockError=RATE_LIMITED`
- `?mockError=INVALID_INPUT`
- `?mockError=READING_NOT_COMPLETED`
- `?mockError=SERVER_ERROR`

The UI intercepts these codes and displays dedicated friendly recovery cards with retry actions.

---

## 7. Folder Structure

```
PRAYAS/
├── app/
│   ├── globals.css              # Design system, CSS variables, anti-copy rules
│   ├── layout.tsx               # Root layout, Navbar, and Footer
│   ├── page.tsx                 # 4-stage assessment flow
│   └── history/
│       └── page.tsx             # Attempt analytics & history log
├── components/
│   ├── ArticleCard.tsx          # Card with difficulty, topic, wordcount & reading time
│   ├── ArticleGrid.tsx          # Responsive grid with search and topic filters
│   ├── CountdownBar.tsx         # Visual timer bar with amber threshold
│   ├── CustomArticleModal.tsx   # Modal with 150-600 live word count enforcement
│   ├── ErrorCard.tsx            # Friendly typed error recovery card
│   ├── HistoryTable.tsx         # Desktop table and mobile attempt cards
│   ├── Navbar.tsx               # Header with Mock badge and theme toggle
│   ├── ReadingView.tsx          # Timed reader with copy protection & tab tracking
│   ├── ResultView.tsx           # Score ring, subscores, feedback, and actions
│   ├── RevealDrawer.tsx         # Slide-in drawer with highlighted source text
│   ├── ScoreChart.tsx           # Recharts score trajectory & metric cards
│   ├── ScoreRing.tsx            # Animated 1-10 circular SVG score gauge
│   ├── Stepper.tsx              # 4-stage visual progress stepper
│   ├── SubScoreBar.tsx          # Sub-score progress bars (Main, Details, Words)
│   ├── ThemeToggle.tsx          # Light/Dark mode switcher with localStorage
│   ├── WordCounter.tsx          # Live range indicator (20-150 words)
│   └── WritingView.tsx          # Synthesis editor, soft timer, rotating loader
├── data/
│   └── seed-articles.json       # 6 technical articles across CS domains
├── lib/
│   ├── api.ts                   # Strict typed client with mock/HTTP toggle
│   ├── mock.ts                  # Keyword overlap engine & mock responses
│   ├── types.ts                 # TypeScript domain and contract definitions
│   ├── useAttemptMachine.ts     # Flow state machine hook (purges article text)
│   ├── useCountdown.ts          # Flexible countdown timer hook
│   └── utils.ts                 # Classname merge and text utilities
├── tests/
│   ├── countdown.test.ts        # Unit tests for countdown timer
│   ├── state-machine.test.ts    # Unit tests verifying article purge & flow
│   └── word-counter.test.ts     # Unit tests for word validation rules
├── vitest.config.ts             # Vitest test runner configuration
├── package.json
└── README.md
```
