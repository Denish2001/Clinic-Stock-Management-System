# Clinic Stock Console

A stock console for a clinic's supplies team, built against the [DummyJSON](https://dummyjson.com/docs) API as part of the Savannah Informatics Web Engineer assessment.

- **Live app:** `[https://clinic-stock-console.netlify.app]`
- **Repo:** `[https://github.com/Denish2001/Clinic-Stock-Management-System]`

---

## Contents

1. [Design](#1-design)
2. [Build](#2-build)
3. [Deployment & CI/CD](#3-deployment--cicd)
4. [AI Reflection](#4-ai-reflection)
5. [Running locally](#running-locally)

---

## 1. Design

_Supplies team needs to search, filter, sort and open stock items, and correct a stock count when a physical count disagrees with the system. Most are on ward tablets over patchy wifi, and they share links to specific items over chat._

### 1.1 Components & screen layout

The screen is organised by feature rather than by generic UI role:

```
App
├─ Auth        (LoginForm)
├─ Layout      (Header, Sidebar, MainContent)
├─ Stock
│   ├─ StockToolbar   (SearchInput, CategoryFilter, SortControl)
│   ├─ StockList      (StockRow / StockCard, Pagination)
│   ├─ StockDetails
│   └─ StockEditor    (quantity form, save/cancel)
└─ Shared      (Button, LoadingState, ErrorState, EmptyState, ConfirmDialog)
```

Layout: header (product name, signed-in user, sign out) above a two-column body — category sidebar on the left, toolbar/list/pagination on the right. Below 768px the sidebar collapses into a menu; below 360px the stock table becomes a stacked card list, since a six-column table can't survive that width readably.

### 1.2 State

Server data, URL state and local UI state are treated as three different things, rather than one store trying to do all three jobs.

**Server state — TanStack Query.** Products, categories and the signed-in user come from the API and are owned by TanStack Query rather than component state (`useAuth`, `useProducts`, `useCategories`, `useProduct`, `useUpdateProduct`). It gives request de-duplication, background refetching, and built-in loading/error flags. Caveat: it does not fix race conditions in a search box by itself — the input still needs debouncing (below).

**URL state — search params.** Search text, category, sort, page and the open item id live in the URL, managed through a single `useUrlState` hook wrapping `useSearchParams`:

```
/stock?search=paracetamol&category=medicine&sort=name&page=2
/items/123
```

This is what makes a reload or a pasted link land a colleague on the same view. React state is used only for things a URL should never carry: whether a modal is open, whether the sidebar is expanded, and the in-progress value of the stock-editor form before save.

**Local UI state — component state.** Modal visibility, sidebar toggle, and the stock-count input before it's saved. Kept local to the component that owns it so it doesn't force unrelated parts of the screen to re-render.

### 1.3 Data fetching, caching & invalidation

- **Fetching:** components call hooks (`useAuth`, `useProducts`, `useCategories`, `useProduct`, `useUpdateProduct`, `useUrlState`, …) which call a small API service layer (`api/auth.js`, `api/stock.js`), which calls `apiClient` — a configured Axios instance, not `fetch`. Components never call Axios or `fetch` directly — keeps the Bearer token, base URL, and refresh logic in one place and keeps hooks testable.
- **Search:** debounced before it updates the URL and fires a request (via `useUrlState`'s `setParams`, called from the search input). Changing search or category also resets page to 1, so a user on page 10 is never left on an empty page 10 of a 2-page result.
- **Caching:** `staleTime` is tuned per resource — products 2 minutes, categories 10 minutes (relatively stable), signed-in user 5 minutes. Stock quantity is the most volatile piece of data, but it is **not** handled through cache invalidation — see Mutations below.
- **Mutations:** stock corrections are **not optimistic** — the save button shows a "saving" state and disables; the list/detail only update once the server responds, so there's nothing to visibly roll back on failure. However, the update is _not_ applied via invalidate-and-refetch either. DummyJSON's `PUT /products/{id}` doesn't persist writes server-side — it just echoes back a merged object (1.8) — so refetching afterwards would immediately overwrite the just-saved value with the original, unchanged record and make a successful save look like it silently failed. `useUpdateProduct` instead writes the mutation's response directly into the cache: `setQueryData(['product', id], …)` for the detail view, plus a targeted patch of any cached `['products']` list pages so the stock list reflects the change without a refetch. This is a workaround for the mock API's specific limitation, not the general pattern this app would use against a real backend.
- **Auth:** the response interceptor in `apiClient.js` attempts `POST /auth/refresh` once on a 401. If other requests fail with 401 while that refresh is already in flight, they're queued (`isRefreshing` flag + `failedQueue`) and retried with the new token once it resolves, rather than each firing its own refresh call. If refresh fails, or there's no refresh token to use, both tokens are cleared and the app hard-redirects via `window.location.href = '/login'`. **Current limitation:** this redirect does not preserve the return URL — it goes to a bare `/login`, not `/login?returnTo=...` — so a forced logout does not currently return the user to their search/filter/page/open-item view after signing back in (see Decision 3). Note also that this is a _hard_ redirect (full page reload), distinct from the manual "Sign out" action in `useAuth`, which uses React Router's `navigate('/login')` and keeps the SPA mounted.

### 1.4 Visual design

- **Layout:** header + collapsible sidebar + content. Chosen over top-nav-only because category filtering is a primary action, and a persistent sidebar keeps it one click away.
- **Spacing:** 4px/8px scale (4, 8, 16, 24, 32) for all padding/gaps, so touch targets stay consistent and nothing is hand-tuned per screen.
- **Typography:** system font stack, one heading size, one body size — legible on a ward tablet without a font-loading dependency.
- **Colour:** A restrained black-and-white palette is used to keep the interface simple, functional, and visually focused, following Dieter Rams' principles of good design. Black is used for primary elements and text, while shades of grey provide hierarchy through secondary text, borders, and backgrounds. Colour is kept minimal and purposeful, with contrast between text and backgrounds designed to meet WCAG AA requirements.

A deliberately plain visual language: a stock console for ward tablets over patchy wifi doesn't need a design system, just a small set of consistent, high-contrast, well-spaced components.

### 1.5 Accessibility

- Native `<button>`, `<a>`, `<input>` elements — not styled `<div>`s. Focus outlines are never removed without a visible replacement.
- Pagination uses `<nav aria-label="Pagination">` with `aria-current="page"`, plus explicit Previous/Next controls.
- An `aria-live` region announces save results ("Stock updated" / "Update failed").
- Interactive targets are at least 44×44px; layout tolerates 200% browser text scaling.

### 1.6 Loading, empty and error states

| State           | Behaviour                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading         | Skeleton or spinner with a short label, e.g. "Loading stock…"                                                                                      |
| Empty           | "No items match your search" with a way to clear filters                                                                                           |
| Network / 500   | "Unable to load stock. Try again" with a retry button. Verified against `/http/500`                                                                |
| Session expired | Silent refresh attempt; on failure, tokens are cleared and the app hard-redirects to `/login` (return URL not yet preserved — see 1.7, Decision 3) |
| Save failed     | "Couldn't save this change. Try again"; input keeps the user's entered value                                                                       |

### 1.7 Decision log

**Decision 1 — TanStack Query over hand-rolled fetch + useState/useEffect.**
Alternative rejected: manual fetching in `useEffect`.
Why: the brief specifically tests behaviour under a slow connection and rapid typing. Manual fetching has no built-in cancellation or caching, so it's easy to render a response for a query the user already replaced.

**Decision 2 — search/filter/sort/page/open-item live in the URL, not component state or localStorage.**
Alternative rejected: local component state, or persisting the view in localStorage.
Why: the brief requires a reload and a link pasted on another machine to land on the same view. Only the URL is shared between machines.

**Decision 3 — silent refresh + queued retry on 401; hard redirect to `/login` on refresh failure.**
Alternative rejected: blank screen or immediately dumping the user to login on any 401.
Why: `expiresInMins: 1` means the token expires mid-session during testing, so a silent refresh-and-retry avoids interrupting the user for routine token rollover. Concurrent 401s are queued behind a single in-flight refresh rather than each firing its own refresh call.
**Known gap:** the redirect on refresh failure is currently a hard `window.location.href = '/login'`, which does not preserve the return URL. Because search/filter/sort/page/open-item all live in the URL (Decision 2), a full fix is small — append the current path+params as a `returnTo` query param before redirecting, and read it back after login — but it isn't implemented yet.

**Decision 4 — no optimistic UI for stock corrections; cache updated from the mutation response, not by invalidation.**
Alternative rejected: optimistic update with rollback on failure; or the more conventional invalidate-and-refetch after a successful save.
Why: a rejected optimistic update means visibly reverting a stock number in front of the user — worse than a short, honest wait for an inventory count. Invalidate-and-refetch was also rejected once built specifically against DummyJSON, because the API doesn't persist writes: a refetch after save would silently overwrite the new value with the old one and make a real save look like a failed one. `useUpdateProduct` instead writes the server's mutation response straight into the relevant query cache entries.

**Decision 5 — debounce search, reset page to 1 on search/category change.**
Alternative rejected: firing a request per keystroke; leaving page number untouched on filter change.
Why: without debouncing, fast typing sends requests for text already replaced. Without resetting the page, a filter change can strand the user on a page number that no longer exists.

### 1.8 Known limitation of the API

DummyJSON is a general-purpose product API, not a real inventory system: no concurrency control (no version/ETag/`updatedAt` to detect two people editing the same item), and writes aren't actually persisted server-side — `PUT /products/{id}` just echoes back a merged object. The app is built against it as required, and this limitation is documented rather than simulated — there's no fake optimistic-locking layer pretending the API guarantees something it doesn't. It does, however, directly shape the caching strategy in 1.3/Decision 4: mutation results are written into the cache rather than triggering a refetch, precisely because a refetch against this API would return stale data.

---

## 2. Build

**Stack:** React 18.2 + Vite 5.1 + JavaScript (JSX), TanStack Query 5.24, Axios 1.6, React Router 6.22, plain CSS (no CSS-in-JS or utility framework — matches the "small, restrained" visual language in Section 1).

**Implemented:**

- Sign-in with `expiresInMins: 1`, silent refresh-and-retry on 401 with request queueing for concurrent failures, hard redirect to `/login` on refresh failure (return-URL preservation not yet implemented — see Decision 3).
- Paginated stock list with search, category filter, sort control.
- Item detail at `/items/:id`, shareable and reload-safe.
- Stock correction via `PUT /products/{id}`, non-optimistic save state, cache updated from the mutation response rather than refetched.
- Loading / empty / error states on every data-loading screen, verified against `?delay=2000` and `/http/500`.
- Full keyboard operability and 360px-wide layout.

**Tooling:**

- **Formatter:** Prettier 3.2, with `format:check` script that fails on unformatted files.
- **Linter:** ESLint 9 (flat config, `eslint.config.js`) — `@eslint/js` recommended rules + `eslint-plugin-react-hooks` recommended rules + `eslint-plugin-react-refresh` (Vite Fast Refresh safety, allowing constant exports alongside components). One rule dialed back from its recommended default: `no-unused-vars` is set to `'warn'` rather than `'error'` — destructured props (e.g. from route params or query results) sometimes go unused during active development, and an error there was blocking builds for a case that isn't a real bug.
- **Commits:** Conventional Commits enforced by `@commitlint/cli` + `@commitlint/config-conventional`, wired to a `commit-msg` hook via Husky 9. `lint-staged` also runs Prettier and `eslint --fix` on staged `.js`/`.jsx`/`.json`/`.md`/`.css` files pre-commit.
- **Editor config:** `.editorconfig` committed.
- **Tests:** Vitest 1.3. `["utils.test.js - Debounce — cancels a pending call when a new value arrives within the debounce window"]`

**Note on the mock API:** see [1.8](#18-known-limitation-of-the-api) — no concurrency control, writes not persisted. Handled by documenting the limitation, and by writing mutation responses directly into the query cache instead of building a fake optimistic-locking layer.

---

## 3. Deployment & CI/CD

- **Live URL:** `[Netlify URL]`
- **Deploy branch:** `main` (deploys automatically on merge)
- **CI provider:** GitHub Actions (`.github/workflows/ci.yml`)

**Pipeline, on every pull request:**

1. Install dependencies
2. `format:check` (Prettier) — blocks merge on failure
3. Lint (ESLint) — blocks merge on failure
4. `commitlint` against the PR's commits — blocks merge on failure
5. Test suite (Vitest) — blocks merge on failure

**Deploy:** Netlify is connected to the GitHub repo and set to auto-deploy the `main` branch. Merging a PR into `main` (after CI passes) triggers a production deploy. A `netlify.toml` in the repo root sets the build command, publish directory, and an SPA redirect rule (`/*` → `/index.html`) so that client-side routes like `/items/123` don't 404 on a direct load or refresh.

---

## 4. AI Reflection

1. **What did you use AI for, per section?**
   - **Section 1 (Design):** wrote the design myself first, then used AI to explain jargon I wasn't sure of and to brainstorm and pressure-test approaches. Where AI proposed a better approach than my first draft, I adopted it — but the initial design and the decision log were mine before any AI input.
   - **Section 2 (Build):** used AI for implementation help — scaffolding, and for fixing errors as they came up during the build.
   - **Section 3 (Deployment & CI/CD):** used AI to help configure and troubleshoot the pipeline and deploy setup.
   - **Section 4 (this reflection):** written by me, based on my own process — not generated.

2. **Tools / workflow used:** DeepSeek and Claude, used situationally — DeepSeek and Claude for general help, Claude specifically when I hit errors or needed something more robust. I didn't follow a structured spec-driven workflow (no Superpowers/GSD/Spec Kit/etc.); I worked through the brief section by section on my own.

3. **One example where AI improved your work, and what I prompted it with:** I initially planned to write a custom `useFetch` hook to handle data fetching myself. I asked AI about this approach, and it suggested TanStack Query with Axios instead. This saved significant time and effort compared to hand-rolling caching, request de-duplication, and loading/error state management myself.

4. **One example where AI output was wrong, incomplete, or subtly bad, and how I caught it:** AI-generated code for the category sidebar broke navigation from the item detail page — clicking a category while viewing `/items/:id` didn't take me back to the stock list at all. I caught this by testing the actual user flow (open an item, then click a category), noticed nothing happened, and traced it to the component not distinguishing between "already on `/stock`" and "somewhere else." I fixed it by adding an `isOnStockPage` check: if not on the stock page, the handler starts a fresh query string and explicitly navigates to `/stock?...` instead of just updating the current URL's params.

5. **Two decisions I made without AI, and why I trusted my own judgment there:**
   - **Visual design:** I chose a minimalist, black-and-white theme (Dieter Rams-influenced) rather than a more colourful UI, because colour shouldn't carry clinical meaning in this context — status colours should be the exception, not the norm. This was a judgment call about the domain, not a technical one, so I didn't need AI input on it.
   - **Routing strategy:** I chose `BrowserRouter` over `HashRouter` on my own, specifically because I knew I was deploying to Netlify (which supports SPA redirect rules) rather than GitHub Pages (which historically needs hash routing to avoid 404s on refresh). This was a deployment-target-specific call I was confident about without checking.

6. **One part of my codebase I'd struggle to defend, and why:** `apiClient.js` (the Axios instance with request/response interceptors for auth and token refresh). I can defend the first half — attaching the Bearer token to outgoing requests — but not the refresh-queueing mechanism in full: the `isRefreshing` flag, the `failedQueue` array, and `processQueue` exist to handle multiple requests failing with 401 at the same time while a single refresh is in flight, but I know _what_ this does more confidently than _how_ it correctly sequences and resolves those queued promises. I'd want to trace through it line by line before I'd call it fully mine. I'd also flag that its redirect-to-login path doesn't currently preserve the return URL, unlike what the design doc originally claimed.

**Time spent (honest, not rounded down):** ~8 hours, spread across four days (roughly 2 hours/day).

---

## Running locally

```bash
git clone [repo URL]
cd [repo folder]
yarn install
yarn dev
```

App runs at `http://localhost:3000` (Vite default). Sign in with any DummyJSON test user, e.g. `emilys` / `emilyspass`.

**Scripts:**

```bash
yarn format:check   # Prettier check
yarn lint           # ESLint
yarn test           # Vitest
yarn build          # production build (dist/)
```

No environment variables or API keys are required — DummyJSON is public.
