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

## 2026-07-16

- Replaced the timer card's large introductory banner with a lean global header that keeps the product title, About navigation, and theme settings available across routes.
- Moved the persisted theme selector into a focused settings modal and added a concise About page centered on the permission-to-stop product contract.
- Added Warm linen and Cocoa night themes, pairing warm paper and charcoal surfaces with honey-gold controls and restrained terracotta accents while retaining the app's existing semantic color roles and accessible primary-action contrast.
- Added durable active-session recovery using an absolute segment end time, including honest completion when a contract expires while the page is suspended or closed.
- Split natural contract completion from ending a session early. Partial work is now saved without incrementing the completed-contract count.
- Expanded the completed-contract decision into Add 5 minutes, Finish here, Take a break, and Switch task while preserving Add 5 as the primary invitation.
- Added persisted sound and notification preferences; notification permission is requested only when the user explicitly enables alerts.
- Added keyboard shortcuts, completion-state focus management, consistent focus rings and touch targets, reduced-motion handling, a pre-hydration theme restore, mobile history disclosure, and undoable session deletion.
- Added Node-based unit coverage for timer restoration/background expiry, partial-time accounting, history migration, and delete undo behavior.
- Reframed timer completion copy as a calm invitation to add another five minutes and replaced reassuring stop/break messages with neutral session-saved feedback, while retaining the confetti animation.
- Removed the redundant Take a break completion action; Finish here already provides the same permission-to-stop outcome.
