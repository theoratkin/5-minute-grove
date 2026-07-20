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
- Promoted focus and history state into a layout-scoped workspace, keeping one actionable recent-sessions sidebar across the timer and About routes while an active timer continues through navigation.
- Added Warm linen and Cocoa night themes, pairing warm paper and charcoal surfaces with honey-gold controls and restrained terracotta accents while retaining the app's existing semantic color roles and accessible primary-action contrast.
- Added durable active-session recovery using an absolute segment end time, including honest completion when a contract expires while the page is suspended or closed.
- Split natural contract completion from ending a session early. Partial work is now saved without incrementing the completed-contract count.
- Expanded the completed-contract decision into Add 5 minutes, Finish here, Take a break, and Switch task while preserving Add 5 as the primary invitation.
- Added persisted sound and notification preferences; notification permission is requested only when the user explicitly enables alerts.
- Added keyboard shortcuts, completion-state focus management, consistent focus rings and touch targets, reduced-motion handling, a pre-hydration theme restore, mobile history disclosure, and undoable session deletion.
- Added a development-only `F` shortcut that fast-forwards a running or paused timer through the normal contract-completion path for testing the finish UI.
- Added a development-only `M` shortcut that skips one minute while preserving running or paused state, and completes through the normal timer path when a minute or less remains.
- Added Node-based unit coverage for timer restoration/background expiry, partial-time accounting, history migration, and delete undo behavior.
- Reframed timer completion copy as a calm invitation to add another five minutes and replaced reassuring stop/break messages with neutral session-saved feedback, while retaining the confetti animation.
- Removed the redundant Take a break completion action; Finish here already provides the same permission-to-stop outcome.
- Shifted the interface away from productivity-dashboard styling toward a quiet windowsill-and-session-notes metaphor: ambient paper light replaces the graph grid, the vignette provides gentle visual progress, status copy is more conversational, and surfaces are less rigid. Session time and extension counts remain prominent.
- Expanded the windowsill vignette into a persistent local grove. Every completed five-minute contract adds one leaf, 50 leaves mature a tree, and mature trees accumulate without streaks, decay, currency, or reversal when history is deleted. Growth is credited idempotently per session and backfilled once from retained local records.

## 2026-07-17

- Increased grove growth to five leaves per completed five-minute contract—one leaf per completed minute, awarded together when the contract finishes. Existing credited contracts migrate to the new rate without double-counting.
- Changed grove growth to happen live at one leaf per completed minute and raised tree maturity to 60 leaves so one focused hour grows a full tree. A full foreground tree remains visible for the end-of-timer choice, then joins the background grove when the user chooses Add 5 minutes or starts a new session.
- Adopted Google Fonts' Nunito Sans for the interface and timer, with Lora for display copy. The timer uses tabular lining numerals and restrained tracking so its digits remain stable and legible throughout the countdown.
- Replaced the full-size barren foreground tree with one plant that grows through distinct silhouettes: a pointed green stem at zero leaves, a branchless green sprout at 1–5, a brown one-branch sapling at 6–15, a compact three-branch young tree at 16–30, a scaled full-tree silhouette at 31–45, and a full-size tree from 46 leaves. Removed the unrelated side sprout so every visible plant represents grove progress.
- Renamed the product from "Just 5 More Minutes" to "Five Minute Grove" to reflect its calm, cumulative growth metaphor while preserving the five-minute contract.
- Added a confirmed grove reset in settings. Resetting clears visible growth while preserving session history and its credit baseline, so old sessions do not regrow the grove after a reload.
- Opened the grove vignette into a fully outdoor, edge-to-edge landscape. The interior window frame, sill, and furniture were removed; the mug appears separately as a quiet ritual cue only when a five-minute contract is complete.
- Reworked every post-sprout tree silhouette around natural binary forks instead of branches attached independently to one central stem: the sapling forks once, the young tree twice, and the later tree three times.
- Made the forked silhouettes deliberately irregular: sibling limbs differ in angle and length, later forks occur at uneven heights, and some eligible limbs do not divide.

## 2026-07-18

- Renamed the local-storage and notification namespaces to `five-minute-grove`; no backward-compatibility path is retained because the app has not been deployed.
- Added an optional, local-first sleep reminder that appears from midnight through 5:59 a.m. local time, at most once per local calendar day. It is intentionally gentle, dismissible, and enabled by default with an opt-out in preferences.
- Added a first-visit introduction that briefly distinguishes the app's tiny, honest work contract and voluntary +5 loop from a conventional timer. Dismissal is stored locally, and a development-only `Shift+I` shortcut reopens it from any route for testing.
- Added subtle “−1:00” and “+1:00” controls around the running clock for small, voluntary timer adjustments, moving them beneath the countdown on mobile. They preserve elapsed-time accuracy and do not affect the session's extension count; both give one gentle ripple that fades before reaching the viewport edge, with remove pitching the optional C4 sound across C3–C4 in C major and add pitching it across C4–C5.
- Replaced the forced five-minute starting duration with a segmented minutes-and-seconds field that remembers the user's last choice. Five minutes remains the deliberate post-timer extension, preserving the product's consent-based momentum loop without making every new session reset prescriptive.
- Replaced the session journal as the primary sidebar with a lightweight local Focus list. Tasks can be planned, focused, completed, and reopened, while sessions remain separate effort records that accumulate time without implying completion. Existing history stays available in a collapsible archive, and “Finish session” remains distinct from “Mark done.”
- Made tasks the sole user-facing work model. Direct unnamed starts now accumulate under one system-managed Untitled task, an active focus attempt can be reassigned in full to any open task, and internal session records are no longer exposed as an archive. “Stop for now” remains distinct from completing a named task.
- Made the shared Untitled inbox ephemeral on explicit assignment: choosing a named task through the assignment control removes the Untitled row, folding any focus already saved there into the chosen task so credited time is not lost.

## 2026-07-19

- Added Gruvbox Light as the light counterpart to Gruvbox Dark, adapting its warm cream, olive, amber, and red palette to the app's semantic theme roles and accessible action contrast.

- Restyled the product name from "Five Minute Grove" to "5 Minute Grove" for a more appealing, compact brand, including the internal package, storage, and notification namespaces. Used a temporary one-way migration from `five-minute-grove:*` browser storage to `5-minute-grove:*`, then removed it after the active development environment migrated.
- Added local task renaming, deliberate one-step reordering, and confirmed deletion. These secondary actions stay behind a per-task menu, with inline editing and confirmation, so the focus list remains calm and Start/complete remain the primary card actions.
- Widened the desktop focus-list column from 20rem to 24rem and the overall workspace from 72rem to 80rem; mobile keeps the existing full-width stacked layout.
- Made task titles directly editable, naturally wrapping text that saves on blur or Enter. Reordering uses `svelte-dnd-action` with a dedicated grip in the card's outer gutter, preserving ordinary text selection and the full title width while supporting pointer, touch, and keyboard input; Move up/down remains available as an explicit fallback.
- Kept the outer drag gutter visually quiet on precise pointers by revealing only the hovered or keyboard-focused task's grip. The grip stays visible on touch devices, with Move up/down still available from the task menu.
- Added lightweight hashtag recognition to task titles. Hashtags are highlighted in task cards and normalized through a shared parser that can support filtering later, while the original title remains the only stored task text.
- Adopted Paraglide JS as the localization layer. Extracted UI copy, metadata, accessibility labels, notifications, and feedback messages into the English base catalog; added request-scoped SvelteKit middleware, localized URL rerouting, document language/direction, and locale-aware date/time formatting. Per-locale builds remain disabled while that feature is experimental.
- Launched the localized interface in English, Spanish, Brazilian Portuguese, French, German, Simplified Chinese, Japanese, Korean, Indonesian, and Russian. Language choice lives in preferences, uses native language names, and persists through Paraglide's localized-URL and cookie strategy; catalog parity and interpolation placeholders are covered by an automated test.
- Added a locally persisted sound-effects volume control alongside the existing sound toggle. Existing users retain the previous full-volume behavior by default, disabling sounds keeps the chosen level for later, and restrained periodic previews make adjustments audible without firing on every slider step.
- Replaced the duplicated active task-name input and assignment dropdown with one compact task chip. Its secondary panel makes rename, create-and-assign, and whole-attempt reassignment explicit while leaving the paused and finished timer decisions visually dominant.
- Renamed the shared Untitled task to Anything across supported locales, making the organization-free starting option feel intentional and inviting while retaining migration support for existing local data.
- Began the post-MVP storage hardening with a versioned portable archive for tasks, completed sessions, and grove state. Imports validate fully before mutation and support replace or stable-ID merge semantics with rollback protection for multi-key localStorage writes.
- Removed the 12-session and 100-task persistence caps so display concerns no longer discard canonical user data. Task and session collections now persist in versioned wrappers while transparently migrating the original array format.
- Kept active timer recovery and interface preferences device-local, and established IndexedDB as the next canonical storage step before unbounded history can approach localStorage quotas. The public archive schema remains storage-engine-independent.
- Moved canonical tasks, completed sessions, and grove state into native IndexedDB. The first open atomically migrates and then removes the former localStorage values; in-tab writes are serialized, session completion and archive replacement use real transactions, and localized feedback makes persistence failures visible.

## 2026-07-20

- Promoted theme selection from the general preferences panel to a dedicated palette dropdown in the global header, keeping frequent appearance changes direct while leaving device preferences grouped separately.
- Split preferences into a quick menu for language and timer feedback plus a complete settings modal. Wellbeing and grove reset remain available without crowding the frequently used controls.
- Added Catppuccin Latte, Catppuccin Mocha, Tokyo Night, Monokai, and Rosé Pine as familiar programmer-inspired themes. Each palette is adapted to the app's semantic color roles, with accessible primary-action contrast and unchanged consent-based interaction emphasis.
- Added optimistic revision checks to every durable IndexedDB transaction so a stale tab cannot overwrite a newer commit. Conflicts abort before mutation, refresh from the authoritative database state, and show localized feedback.
- Added live same-browser synchronization through BroadcastChannel with a localStorage event fallback. Tasks, sessions, and grove progress update across tabs, and a stable session ID prevents a focus finished elsewhere from being credited twice.
- Added one sequential migration registry for IndexedDB and portable archives. Database creation now runs as migration 0→1; future steps execute atomically in the browser upgrade transaction, while archive migrations complete in memory before validation or storage mutation. Missing, duplicate, and forward-version paths fail explicitly.
- Established the unreleased IndexedDB/archive implementation as the first public storage baseline after confirming the sole development browser had migrated. Removed the pre-public localStorage bridge, active-session v1, grove v1, Sprint/intention history conversion, and title-based Untitled aliases while retaining corruption-safe normalization and future migration registries.
- Kept the button splash's two-layer shape, timing, fill, and glow while rendering it from capped 320px textures whose geometry is scaled proportionally. This avoids rasterizing viewport-diagonal DOM layers on high-density mobile displays.
- Made Anything directly editable in the Focus list. Committing a different title creates a normal named task, transfers Anything's saved focus and session count, moves any active attempt to the new task, and removes the shared inbox.
- Distinguished starting from assigning: starting another task from the Focus list now saves the current Anything attempt and begins a fresh attempt on the selected task, preserving Anything and its credited focus. Only explicit assignment or renaming transfers Anything's focus and removes it.
