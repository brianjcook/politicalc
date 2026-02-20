# Codex Build Instructions — One-Page Political Self-Insight Quiz (US-only)

## Goal
Build a single-page web app (HTML + CSS + vanilla JS) that presents a short political self-insight quiz:
- 32 questions (approx. 5–10 minutes)
- 5-point Likert answers
- Scores across 8 dimensions, displayed as a radar/pizza chart
- No backend required (all local / in-browser)

The quiz content is provided in `political-quiz-bank.json`.

## Deliverables (files)
Create these files in a folder (any name is fine):
1. `index.html`
2. `styles.css`
3. `app.js`
4. `political-quiz-bank.json` (already provided; load it)

The app must run by opening `index.html` locally (or via a simple static server).

## Functional Requirements

### 1) Data loading
- Load `political-quiz-bank.json` at runtime (fetch).
- Use `data.axes`, `data.questions`, and `data.response_sets.likert5`.

### 2) Quiz flow
- Show one question at a time with:
  - progress indicator: “Question X of N”
  - question text
  - 5 radio buttons (Strongly disagree .. Strongly agree)
  - buttons: Back / Next
- Disable Next until an answer is selected.
- Persist responses in memory (and optionally `localStorage` so refresh doesn’t lose progress).

### 3) Navigation / UX
- Back should restore the previous answer selection.
- Allow restart (clear answers) from a “Start over” button.
- Provide a review screen at the end (optional but desirable):
  - list questions with selected answers
  - allow jumping to any question to change an answer

### 4) Scoring
Implement scoring exactly as specified in JSON:
- Convert answer `value` (1..5) to `n = value - 1` (0..4)
- If question `reverse == true`, then `n = 4 - n`
- For each axis:
  - sum `n` across its questions
  - compute axis percent:
    - axis_max = 4 * count_questions_on_axis
    - axis_percent = round((axis_raw / axis_max) * 100)

### 5) Results screen
Show:
- Radar/pizza chart for 8 axes with 0–100 scale
- A table listing each axis with:
  - axis label
  - percent score
  - short explanation (use axes[].high_means / low_means)
- Buttons:
  - “Retake quiz”
  - “Copy results JSON” (copy a JSON object mapping axis labels → scores)
  - “Download results” (download JSON file)

### 6) Charting
Prefer a simple chart library that works from CDN in a static page (pick one):
- Chart.js radar chart (common choice), or
- Any lightweight radar chart library from CDN

If using Chart.js:
- Create a radar chart with labels = axis labels
- Data = axis_percent values in axis order from `data.axes`

### 7) Accessibility & responsiveness
- Keyboard navigable (tab to options, arrow keys / space to select radio)
- Mobile-friendly layout (single column, readable font sizes)
- High contrast and clear focus states

## Non-functional Requirements
- Track responses and drop them into a Google Sheet. Ask for details on what needs to happen there.
- Keep it simple and readable. Vanilla JS only.
- Use defensive coding: handle JSON load failure with an error message.

## Suggested UI structure
- `#app` container with view states:
  - Start screen
  - Question screen
  - Results screen

## Example “Copy results JSON” format
```json
{
  "Economic Role of Government": 72,
  "Social & Cultural Traditionalism": 41,
  "Populism (Anti-Elite Orientation)": 65,
  "Order vs Civil Liberties": 38,
  "Group Hierarchy vs Egalitarianism": 22,
  "Institutional Trust": 55,
  "National Identity vs Cosmopolitanism": 47,
  "Pluralism vs Majoritarianism": 30
}
```

## Notes
- The quiz is for self-insight (not diagnosis, not “match me to a party”).
- If you add interpretive text, keep it neutral and non-judgmental.
