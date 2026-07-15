# Decision Log

## 2026-07-12

- Chose SvelteKit as the intended web app framework.
- Initialized durable agent documentation only; no app scaffolding yet.
- Captured the product distinction: this is a consent-based 5-minute continuation loop, not a standard Pomodoro clone.
- Recorded that stopping after the first 5 minutes must count as success.
- Chose a feature-oriented SvelteKit architecture with a small shared UI layer instead of Atomic Design as the primary code organization model.
- Scaffolded the SvelteKit TypeScript app with the current `sv` CLI.
- Built the first local-first MVP as a single route with a 5-minute timer, voluntary +5 continuation, valid stop/break/switch outcomes, and local recent session history.
- Added optional desktop notifications for completed 5-minute contracts, requested from Start/Add 5 user actions and treated as nonessential when unsupported or denied.
- Renamed the accumulated optional block from "Sprint" to "Session": titles are optional (default "Session"), current session time and extensions are visible, and history is grouped by session start date with resume and delete actions.
- Added a locally persisted theme preference with Soft daylight as the default and Gruvbox Dark as the first alternate theme.
- Added Quiet night, a subdued blue-charcoal dark theme designed as the calmer counterpart to Soft daylight; retained Gruvbox Dark as an existing, higher-saturation option.
