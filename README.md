# Clinic Stock Console

A stock console for a clinic's supplies team. It was built with the [DummyJSON](https://dummyjson.com/docs) API as part of the Savannah Informatics Web Engineer assessment.

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

_Supplies staff need to search, filter, sort and open stock items. They also need to correct stock counts when a physical count does not match the system. Most users work on ward tablets with unreliable Wi-Fi and share links to specific items through chat._

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

The layout has a header with the product name, signed-in user and sign-out action. Below it is a two-column layout: the category sidebar is on the left, while the toolbar, stock list and pagination are on the right.

Below 768px, the sidebar becomes a menu. Below 360px, the stock table changes into a stacked card list because a six-column table would not remain readable at that width.

### 1.2 State

Server data, URL state and local UI state are treated as three separate concerns. Each is handled by the tool best suited to it.

**Server state — TanStack Query.** Products, categories and the signed-in user come from the API and are managed by TanStack Query rather than component state. This is handled through `useAuth`, `useProducts`, `useCategories`, `useProduct` and `useUpdateProduct`.

TanStack Query provides request de-duplication, background refetching and built-in loading and error states. It does not, however, solve race conditions in a search box by itself. The search input still needs debouncing.

**URL state — search params.** Search text, category, sort order, page number and the open item ID are stored in the URL. A single `useUrlState` hook manages this through `useSearchParams`:

```
/stock?search=paracetamol&category=medicine&sort=name&page=2

/items/123
```

This means that refreshing the page or sharing a link takes the user back to the same view.

React state is used only for information that should not be stored in the URL, such as whether a modal is open, whether the sidebar is expanded, and the current value in the stock editor before it is saved.

**Local UI state — component state.** Modal visibility, the sidebar toggle and the unsaved stock-count value stay inside the component that owns them. This prevents unrelated parts of the application from re-rendering.

### 1.3 Data fetching, caching & invalidation

- **Fetching:** Components use hooks such as `useAuth`, `useProducts`, `useCategories`, `useProduct`, `useUpdateProduct` and `useUrlState`. These hooks call a small API service layer (`api/auth.js` and `api/stock.js`), which then uses `apiClient` — a configured Axios instance.

  Components do not call Axios or `fetch` directly. This keeps the Bearer token, base URL and refresh logic in one place and makes the hooks easier to test.

- **Search:** Search input is debounced before it updates the URL and sends a request. This is handled through `useUrlState`'s `setParams`, which is called by the search input.

  Changing the search or category also resets the page to 1. This prevents a user on page 10 from being left on an empty page 10 when the new results contain only two pages.

- **Caching:** `staleTime` is set according to how often each resource is expected to change. Products use 2 minutes, categories use 10 minutes because they are relatively stable, and the signed-in user uses 5 minutes.

  Stock quantity is the most frequently changing data, but it is not handled through normal cache invalidation. The reason is explained under Mutations below.

- **Mutations:** Stock corrections are **not optimistic**. When the user saves a change, the button shows a "saving" state and becomes disabled. The list and detail views update only after the server responds. This means there is nothing to roll back if the request fails.

  The update is also **not** followed by a normal invalidate-and-refetch cycle. DummyJSON's `PUT /products/{id}` does not persist changes on the server. It returns a merged object instead. If the app refetched the product after saving, it would receive the original value again and make a successful save appear to have failed.

  Instead, `useUpdateProduct` writes the mutation response directly into the cache:

  `setQueryData(['product', id], …)`

  This updates the detail view. It also makes a targeted update to cached `['products']` list pages so the stock list reflects the change without another request.

  This is a workaround for DummyJSON's limitation. It is not the general approach I would use with a real backend.

- **Auth:** The response interceptor in `apiClient.js` attempts `POST /auth/refresh` once when a request returns a 401.

  If other requests return 401 while the refresh is already running, they are placed in a queue using the `isRefreshing` flag and `failedQueue` array. They are retried with the new token once the refresh succeeds instead of each request starting its own refresh.

  If the refresh fails, or there is no refresh token, both tokens are cleared and the application redirects to `/login` using `window.location.href`.

  **Current limitation:** this redirect does not preserve the return URL. It sends the user to `/login` instead of something such as `/login?returnTo=...`. As a result, a forced logout does not currently return the user to their previous search, filter, page or open-item view after signing in again. See Decision 3.

  This is also a **hard redirect**, which reloads the page. It is different from the manual "Sign out" action in `useAuth`, which uses React Router's `navigate('/login')` and keeps the SPA running.

### 1.4 Visual design

- **Layout:** Header, collapsible sidebar and content area. This was chosen instead of a top navigation because category filtering is a primary action. Keeping the categories in a sidebar makes them easy to reach.

- **Spacing:** A 4px/8px spacing scale is used throughout: 4, 8, 16, 24 and 32px. This keeps padding and gaps consistent across the application.

- **Typography:** A system font stack is used with one main heading size and one body size. This keeps the interface readable on ward tablets without depending on an external font.

- **Colour:** A restrained black-and-white palette keeps the interface simple, functional and focused. The design follows Dieter Rams' principles of good design. Black is used for primary elements and text, while shades of grey create hierarchy through secondary text, borders and backgrounds. Colour is used sparingly and only where it serves a clear purpose. Text and background combinations are designed to meet WCAG AA contrast requirements.

The visual language is deliberately plain. A stock console used on ward tablets over unreliable Wi-Fi does not need a large design system. It needs a small set of consistent, high-contrast and well-spaced components.

### 1.5 Accessibility

- Native `<button>`, `<a>` and `<input>` elements are used instead of clickable `<div>` elements. Focus outlines are never removed without providing a visible alternative.

- Pagination uses `<nav aria-label="Pagination">` with `aria-current="page"` and clear Previous/Next controls.

- An `aria-live` region announces save results such as "Stock updated" and "Update failed".

- Interactive targets are at least 44×44px, and the layout supports 200% browser text scaling.

### 1.6 Loading, empty and error states

| State           | Behaviour                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading         | Shows a skeleton or spinner with a short label such as "Loading stock…"                                                                             |
| Empty           | Shows "No items match your search" and provides a way to clear the filters                                                                          |
| Network / 500   | Shows "Unable to load stock. Try again" with a retry button. Verified against `/http/500`                                                           |
| Session expired | Attempts a silent refresh. If it fails, tokens are cleared and the app redirects to `/login` (the return URL is not yet preserved — see Decision 3) |
| Save failed     | Shows "Couldn't save this change. Try again" while keeping the user's entered value                                                                 |

### 1.7 Decision log

**Decision 1 — TanStack Query over hand-rolled fetch + useState/useEffect.**

Alternative rejected: manual fetching with `useEffect`.

Why: the brief specifically tests behaviour under slow connections and rapid typing. Manual fetching does not provide built-in cancellation or caching, making it easier for an old response to appear after the user has already changed the search.

**Decision 2 — search/filter/sort/page/open-item live in the URL, not component state or localStorage.**

Alternative rejected: local component state or storing the view in localStorage.

Why: the brief requires a reload and a link shared on another machine to open the same view. Only the URL can reliably be shared between machines.

**Decision 3 — silent refresh + queued retry on 401; hard redirect to `/login` on refresh failure.**

Alternative rejected: showing a blank screen or immediately sending the user to login after any 401.

Why: `expiresInMins: 1` means the token expires during testing. Silent refresh and retry prevents routine token expiry from interrupting the user. When several requests fail with 401 at the same time, they wait for one refresh instead of each starting a separate refresh request.

**Known gap:** The redirect after a failed refresh currently uses `window.location.href = '/login'`, so it does not preserve the return URL.

Because search, filter, sort, page and open-item state are already stored in the URL (Decision 2), the fix would be small: add the current path and parameters as a `returnTo` query parameter before redirecting, then read it after login. This has not yet been implemented.

**Decision 4 — no optimistic UI for stock corrections; update the cache from the mutation response instead of invalidating it.**

Alternative rejected: optimistic updates with rollback on failure, or the more conventional invalidate-and-refetch approach.

Why: with an optimistic update, a failed request would require the stock number to visibly change back in front of the user. For an inventory system, a short and honest wait is preferable.

Invalidate-and-refetch was also rejected because DummyJSON does not persist writes. Refetching after a successful save would return the old value and make the successful update look like a failure.

`useUpdateProduct` therefore writes the server's mutation response directly into the relevant query cache entries.

**Decision 5 — debounce search and reset page to 1 when search or category changes.**

Alternative rejected: sending a request for every keystroke and keeping the current page number when the filter changes.

Why: without debouncing, fast typing sends requests for search terms the user has already replaced. Without resetting the page, changing a filter can leave the user on a page that no longer exists.

### 1.8 Known limitation of the API

DummyJSON is a general-purpose product API, not a real inventory system. It does not provide concurrency control such as version numbers, ETags or `updatedAt` values to detect when two people edit the same item. Its writes are also not persisted server-side. `PUT /products/{id}` simply returns a merged object.

The application uses DummyJSON because it is required by the assessment. Rather than pretending that the API provides guarantees it does not, the limitation is documented.

This limitation also affects the caching strategy described in 1.3 and Decision 4. Mutation responses are written directly into the cache instead of triggering a refetch because a refetch would return the old data.

---

## 2. Build

**Stack:** React 18.2 + Vite 5.1 + JavaScript (JSX), TanStack Query 5.24, Axios 1.6, React Router 6.22 and plain CSS.

No CSS-in-JS or utility framework is used. This matches the small and restrained visual approach described in Section 1.

**Implemented:**

- Sign-in with `expiresInMins: 1`, silent refresh and retry on 401, request queueing for concurrent failures, and a hard redirect to `/login` when refresh fails. Return-URL preservation is not yet implemented — see Decision 3.

- Paginated stock list with search, category filtering and sorting.

- Item details at `/items/:id`, with shareable and reload-safe URLs.

- Stock correction using `PUT /products/{id}`. The save is not optimistic, and the cache is updated from the mutation response instead of being refetched.

- Loading, empty and error states on every data-loading screen. These were tested with `?delay=2000` and `/http/500`.

- Full keyboard support and a layout that works at 360px wide.

**Tooling:**

- **Formatter:** Prettier 3.2, with a `format:check` script that fails when files are not formatted.

- **Linter:** ESLint 9 using the flat configuration in `eslint.config.js`. It uses `@eslint/js` recommended rules, `eslint-plugin-react-hooks` recommended rules and `eslint-plugin-react-refresh` for Vite Fast Refresh safety.

  One rule was relaxed from its recommended setting: `no-unused-vars` is set to `'warn'` rather than `'error'`. Destructured props from route parameters or query results can sometimes be unused during development, and treating this as an error was blocking builds for something that was not a real bug.

- **Commits:** Conventional Commits are enforced with `@commitlint/cli` and `@commitlint/config-conventional`. Husky 9 runs the check through a `commit-msg` hook.

  `lint-staged` also runs Prettier and `eslint --fix` on staged `.js`, `.jsx`, `.json`, `.md` and `.css` files before each commit.

- **Editor config:** `.editorconfig` is committed to the repository.

- **Tests:** Vitest 1.3.

  `utils.test.js - Debounce — cancels a pending call when a new value arrives within the debounce window`

**Note on the mock API:** See [1.8](#18-known-limitation-of-the-api). DummyJSON does not provide concurrency control and does not persist writes. The application handles this by documenting the limitation and writing mutation responses directly into the query cache instead of creating a fake optimistic-locking system.

---

## 3. Deployment & CI/CD

- **Live URL:** `https://clinic-stock-console.netlify.app`

- **Deploy branch:** `main` (deploys automatically after merge)

- **CI provider:** GitHub Actions (`.github/workflows/ci.yml`)

**Pipeline, on every pull request:**

1. Install dependencies

2. `format:check` (Prettier) — blocks the merge if it fails

3. Lint (ESLint) — blocks the merge if it fails

4. `commitlint` checks the PR's commits — blocks the merge if it fails

5. Test suite (Vitest) — blocks the merge if it fails

**Deploy:** Netlify is connected to the GitHub repository and automatically deploys the `main` branch.

After a PR is merged into `main` and CI passes, Netlify creates a production deployment.

A `netlify.toml` file in the repository root defines the build command, publish directory and SPA redirect rule (`/*` → `/index.html`). This allows client-side routes such as `/items/123` to work when loaded or refreshed directly.

---

## 4. AI Reflection

1. **What did you use AI for, per section?**

   - **Section 1 (Design):** I created the design myself first. I then used AI to explain unfamiliar terms, brainstorm ideas and pressure-test my decisions. When AI suggested a better approach, I adopted it. The initial design and decision log were mine before I used AI.

   - **Section 2 (Build):** I used AI for implementation help, including scaffolding and fixing errors that came up during development.

   - **Section 3 (Deployment & CI/CD):** I used AI to help configure and troubleshoot the CI/CD pipeline and deployment setup.

   - **Section 4 (this reflection):** This section was written by me based on my own process. It was not generated by AI.

2. **Tools / workflow used:** I used DeepSeek and Claude as needed. I used them for general help and used Claude more specifically when I encountered errors or needed a more robust solution.

   I did not use a structured spec-driven workflow such as Superpowers, GSD or Spec Kit. I worked through the brief section by section on my own.

3. **One example where AI improved your work, and what you prompted it with:**

   I initially planned to create a custom `useFetch` hook to handle data fetching myself. I asked AI about this approach, and it suggested using TanStack Query with Axios instead.

   This saved significant time and effort because I did not have to build caching, request de-duplication and loading/error state management from scratch.

4. **One example where AI output was wrong, incomplete, or subtly bad, and how I caught it:**

   AI-generated code for the category sidebar broke navigation from the item detail page. Clicking a category while viewing `/items/:id` did not take me back to the stock list.

   I found the problem by testing the actual user flow: opening an item and then clicking a category. When nothing happened, I traced the problem to the component not distinguishing between being on `/stock` and being somewhere else.

   I fixed it by adding an `isOnStockPage` check. If the user is not on the stock page, the handler creates a new query string and explicitly navigates to `/stock?...` instead of only updating the current URL parameters.

5. **Two decisions I made without AI, and why I trusted my own judgment there:**

   - **Visual design:** I chose a minimalist black-and-white theme influenced by Dieter Rams rather than a more colourful interface.

     I made this choice because colour should not carry clinical meaning in this context. Status colours should be the exception, not the norm. This was a design judgment about the product and its users, rather than a technical decision, so I did not need AI input.

   - **Routing strategy:** I chose `BrowserRouter` over `HashRouter` because I knew the application would be deployed to Netlify.

     Netlify supports SPA redirect rules, while GitHub Pages has traditionally required hash routing to avoid 404 errors when refreshing client-side routes. This was a deployment-specific decision I was confident making without AI.

6. **One part of my codebase I'd struggle to defend, and why:**

   `apiClient.js` — the Axios instance containing the request and response interceptors for authentication and token refresh.

   I can explain the first part: attaching the Bearer token to outgoing requests. I am less confident explaining the refresh queue in full.

   The `isRefreshing` flag, `failedQueue` array and `processQueue` function handle multiple requests that fail with 401 while one refresh request is already running. I understand what this mechanism is supposed to do better than I understand how it correctly sequences and resolves every queued promise.

   Before calling this code fully mine, I would want to trace it line by line and understand the complete flow.

   I would also flag that its redirect-to-login path does not currently preserve the return URL, even though the original design document claimed that it did.

**Time spent (honest, not rounded down):** ~8 hours, spread across four days (roughly 2 hours per day).

---

## Running locally

```bash
git clone [repo URL]

cd [repo folder]

yarn install

yarn dev
```

The app runs at `http://localhost:3000` (Vite default).

Sign in with any DummyJSON test user, for example `emilys` / `emilyspass`.

**Scripts:**

```bash
yarn format:check   # Prettier check

yarn lint           # ESLint

yarn test           # Vitest

yarn build          # production build (dist/)
```

No environment variables or API keys are required because DummyJSON is public.
