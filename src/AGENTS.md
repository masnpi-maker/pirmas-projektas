# pirmas-projektas - AI Agent Instructions

These instructions apply to AI agents working in the `pirmas-projektas` project (a Lithuanian currency converter with a cryptocurrency calculator).

## Project context
Before making changes, read `context.md` in the project root.
Always prefer the newest project code over older documentation. If `context.md` and the code disagree, follow the code and mention the difference so `context.md` can be updated.

## Technology
- Use React + Vite (React 19, Vite 8).
- Use JavaScript and JSX.
- Do not convert to TypeScript.
- Do not add Tailwind CSS, CSS Modules, or UI/component libraries unless explicitly requested.
- Keep component styles in plain `.css` files.
- Keep React components in `src/` unless intentionally reorganizing the project.
- The project currently depends only on `react` and `react-dom`. Do not add runtime dependencies unless explicitly requested.

## External APIs
- Currency rates: Frankfurter (`https://api.frankfurter.dev/v1/latest`), base EUR.
- Crypto prices: CoinGecko (`https://api.coingecko.com/api/v3/simple/price`).
- Both are called directly from the browser, without API keys and without `.env` variables.
- Do not invent other APIs, endpoints, or response fields. Check the existing code and the API docs first.
- Keep loading and error states for every request, including the "Bandyti dar kartą" retry button.

## Code changes
- Inspect the current file before modifying it.
- Do not invent project logic or APIs that do not exist.
- Preserve existing functionality unless explicitly asked to change it.
- Avoid unrelated refactors and unnecessary dependencies.
- Prefer simple solutions.
- Use functional React components and React hooks.
- Follow the existing code style: no semicolons, single quotes, 2-space indentation.
- Keep the existing number handling: a comma in amount inputs is replaced with a dot before parsing, and numbers are formatted with `Intl.NumberFormat('lt-LT')`.
- Keep the existing CSS class prefixes: `fx-*` for the currency converter, `crypto-*` for the crypto calculator.

### Component location
- The active `CryptoCalculator` component and its styles are defined in `src/App.jsx` and `src/App.css`.

## Design
Preserve the existing look:
- dark theme with a dark page background;
- burgundy / plum cards with subtle borders;
- pink primary accent (swap button, crypto icon, kicker labels);
- light primary text and muted secondary text;
- large rounded corners;
- soft glow effect at the top of the page;
- minimalist modern UI;
- responsive layouts.

Reuse colors, spacing, and radii already defined in `src/App.css` and `src/index.css` instead of inventing new ones. Do not change the overall design direction unless explicitly requested.

## Accessibility
- Keep `aria-live="polite"` on result cards and `role="alert"` on error messages.
- Keep every `label` connected to its field with `htmlFor` / `id`.
- Keep `aria-label` on icon-only buttons.

## UI language
- Keep user-facing UI text in Lithuanian unless requested otherwise.
- Keep labels and messages short and clear.
- Preserve existing terminology where practical (for example "Kursai nuo 1 EUR", "Kriptovaliutos skaičiuoklė").
- Use correct Lithuanian spelling in new text.
- Communicate with the user in Lithuanian.

## Before finishing
Check that:
1. Code matches the existing project structure.
2. Existing functionality still works (currency conversion, swap button, rates table, crypto calculator).
3. No unnecessary dependency was added.
4. UI remains responsive.
5. Imports and file paths are correct.
6. `npm run lint` and `npm run build` pass, when the agent can run them.

## Presenting changes
- Briefly explain what changed.
- Identify each changed or new file by its exact path.
- When code is meant to be pasted manually, provide the complete updated file.
- Clearly state whether a file should be created or replaced.
- Include a short way to test the result (usually `npm run dev` and what to check in the browser).

## Keeping context.md up to date
- At the end of a work session, provide an updated `context.md` (complete file) or clearly marked sections to change.
- Update the "Paskutinį kartą atnaujinta" date, the affected sections (file structure, architecture, known problems), and add an entry to the decision log.
- Do not state something as fact in `context.md` if it was not verified in the code; mark it as "Reikia patikslinti" instead.
