# 5 Minute Grove

![5 Minute Grove wide logo](media/logo-wide.inkscape.svg)

> Start with five minutes. Grow from there.

A calm, local-first focus timer built around approachable starts and voluntary continuation.

5 Minute Grove is for the moment when starting is harder than continuing. Choose an approachable amount of time—five minutes by default—focus until the timer ends, and then decide whether to stop or add another five minutes. Reaching that first stopping point is enough; continuing is always optional.

## How it works

1. Choose a task, or begin with **Anything** when naming the work would add friction.
2. Set a small starting duration and start the timer.
3. When the timer ends, either finish or voluntarily add five minutes.
4. Each completed whole minute grows one leaf in a persistent grove. A tree matures after 60 leaves.

The grove is a keepsake, not a productivity economy. There are no streaks, penalties, missed-day states, or rewards that can be spent.

## Features

- Custom starting durations with a prominent **Add 5 minutes** continuation loop
- Pause, resume, stop early, and adjust the active timer by one minute
- Honest partial-time accounting when a session ends before its chosen time
- Active-session recovery after refreshes or accidental tab closures
- A lightweight Focus list with task creation, editing, reordering, completion, reopening, and deletion
- Inline hashtag recognition in task titles
- Whole-session reassignment between open tasks
- Persistent grove growth based on completed focus minutes
- Local-only durable storage with cross-tab synchronization and conflict protection
- Configurable themes, sound volume, desktop notifications, and a gentle late-night reminder
- Responsive controls, keyboard support, focus management, and reduced-motion support
- Localized interfaces in English, Spanish, Brazilian Portuguese, French, German, Simplified Chinese, Japanese, Korean, Indonesian, and Russian
- Versioned JSON archive primitives for portable task, session, and grove data

## Product principles

This is not a Pomodoro clone. Changes should preserve the product's core principle:

- Optimize for getting started, not for maximizing session length.
- Keep the end-of-timer choice small and low-pressure.
- Treat stopping after the chosen time as a valid outcome.
- Reward starts and voluntary continuations without shame or streak pressure.
- Keep task planning lightweight; do not turn the Focus list into a backlog manager.
- Describe partial work truthfully rather than calling it a finished block.

More context lives in [the product documentation](docs/product-context.md).

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) and Svelte 5
- TypeScript
- Vite
- Tailwind CSS 4
- Paraglide JS for type-safe localization
- IndexedDB for durable tasks, sessions, and grove state
- `localStorage` for active-timer recovery and device preferences
- Node's built-in test runner

## Getting started

### Prerequisites

- Node.js 22 or newer
- npm

### Install and run

```sh
git clone https://github.com/theoratkin/5-minute-grove.git
cd 5-minute-grove
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173`.

To expose the development server on your local network:

```sh
npm run dev -- --host
```

No environment variables or external services are required.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run generate:i18n` | Compile the generated Paraglide localization modules |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run Svelte and TypeScript diagnostics |
| `npm run check:watch` | Run diagnostics in watch mode |
| `npm test` | Run the Node test suite |
| `npm run generate:logo` | Regenerate the themed Svelte logo from its Inkscape source |

Run the full local verification suite before submitting a change:

```sh
npm run check
npm test
npm run build
```

## Keyboard shortcuts

Shortcuts are ignored while typing in an input or editable control.

| State | Shortcut | Action |
| --- | --- | --- |
| Timer idle | `Enter` | Start the selected duration |
| Timer running or paused | `Space` | Pause or resume |
| Timer complete | `+` | Add five minutes |

Development builds also provide `M` to advance one minute, `F` to finish the current timer through the normal completion path, and `Shift+I` to reopen the introduction.

## Project structure

```text
.
├── src/
│   ├── routes/                 # Page composition and localized routing
│   └── lib/
│       ├── app/                # Preferences, persistence, archives, migrations
│       ├── features/
│       │   ├── focus-list/     # Tasks and Focus list UI
│       │   ├── focus-session/  # Timer state, recovery, and session flow
│       │   ├── grove/          # Persistent growth model
│       │   ├── session-history/# Internal completed-session records
│       │   └── task-intention/ # Starting intention UI
│       ├── paraglide/          # Generated localization code (do not hand-edit)
│       └── styles/             # Design tokens and themes
├── messages/                   # Source translation catalogs
├── tests/                      # State, storage, migration, and i18n tests
├── docs/                       # Durable product and technical decisions
└── media/                      # Editable design sources
```

Routes should remain focused on composition. Product behavior belongs with its feature, while cross-feature infrastructure belongs in `src/lib/app`.

## Data and privacy

5 Minute Grove is local-first. It has no account requirement and does not send focus data to an application backend.

- Tasks, completed sessions, and grove state are stored in the browser's IndexedDB database.
- Active-timer recovery and interface preferences are device-local in `localStorage`.
- Durable writes are revision-checked and synchronized between tabs in the same browser.
- Clearing site data or using a private browsing session can remove locally stored data.
- Desktop notifications are optional and permission is requested only when they are enabled.

The portable archive contract and migration policy are documented in [docs/storage-model.md](docs/storage-model.md).

## Localization

English is the base locale. Source catalogs live in `messages/{locale}.json`; generated Paraglide files under `src/lib/paraglide/` must not be edited by hand or committed. `npm ci`, `npm run check`, and the deployment workflow regenerate them explicitly so clean checkouts have the modules before type-checking.

When changing user-facing copy:

1. Add or update the message in every locale catalog.
2. Preserve interpolation placeholders across translations.
3. Consume the generated message function from `$lib/paraglide/messages.js`.
4. Run `npm test` to verify catalog and placeholder parity.

Locale resolution uses the localized URL first, then the saved cookie, the browser preference, and finally English.

## Logo workflow

Edit `media/logo.inkscape.svg`, then run:

```sh
npm run generate:logo
```

This regenerates `src/lib/app/GroveLogo.svelte` and maps the source palette to theme tokens. Treat the generated Svelte component as read-only.

## Deployment

The production site is a static SvelteKit build deployed to GitHub Pages at
[`5minutegrove.com`](https://5minutegrove.com). Create the same build locally with:

```sh
npm run build
```

Output is written to `build/`. Pushing to `main` runs checks, tests, builds the site, and deploys it through `.github/workflows/deploy-pages.yml`. Every localized route is prerendered so direct links and refreshes work without an application server; the static adapter also emits a `404.html` fallback for unknown URLs.

The repository must use **GitHub Actions** as its Pages source and have `5minutegrove.com` configured as its custom domain. DNS setup and the one-time repository settings are described in [the technical direction](docs/technical-direction.md#github-pages-deployment).

## Documentation

- [Product context](docs/product-context.md) — product thesis, experience, and non-goals
- [Technical direction](docs/technical-direction.md) — architecture and engineering constraints
- [Storage model](docs/storage-model.md) — persistence, archive, migration, and multi-tab semantics
- [Decision log](docs/decision-log.md) — chronological product and implementation decisions

When behavior changes, update the relevant durable documentation alongside the code.

## Contributing

Issues and pull requests are welcome. Keep changes focused, follow the existing feature-oriented architecture, add tests for behavioral changes, and preserve the permission to stop described above.

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
