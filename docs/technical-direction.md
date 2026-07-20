# Technical Direction

## Stack

Use SvelteKit when the user asks to start implementation.

Suggested initial shape:

- SvelteKit app with TypeScript.
- Local-first state using browser storage for history, preferences, and active-session recovery.
- Minimal dependencies until concrete needs appear.
- Responsive web UI for desktop and mobile.
- Paraglide JS for compiler-generated, type-safe localization with request-scoped SSR locale handling.
- Resolve locale from the URL first, then a saved cookie, then the browser's preferred language, with English as the base fallback.

## Code Architecture

Use a feature-oriented SvelteKit structure with a small shared UI layer. Do not use Atomic Design as the primary architecture, though reusable UI primitives can borrow its discipline.

Suggested structure:

```txt
src/
  routes/
    +layout.svelte
    +page.svelte

  lib/
    features/
      focus-session/
        components/
          FocusTimer.svelte
          SessionControls.svelte
          SessionSummary.svelte
          EndOfTimerPrompt.svelte
        focusSession.store.ts
        focusSession.types.ts
        focusSession.utils.ts

      session-history/
        components/
          SessionHistory.svelte
          SessionHistoryItem.svelte
        sessionHistory.store.ts
        sessionHistory.types.ts
        sessionHistory.storage.ts

      focus-list/
        components/
          FocusList.svelte
        focusTask.types.ts
        focusTask.state.ts
        focusTask.storage.ts

      task-intention/
        components/
          TaskIntentionInput.svelte
        taskIntention.types.ts

    ui/
      Button.svelte
      IconButton.svelte
      Modal.svelte
      ProgressRing.svelte

    app/
      storage.ts
      time.ts
      notifications.ts

    styles/
      tokens.css
```

Guidelines:

- Keep `routes/` focused on page composition.
- Put product behavior and product-specific components in `lib/features/`.
- Put only generic reusable primitives in `lib/ui/`.
- Put cross-feature infrastructure in `lib/app/`.
- Keep user-facing copy in `messages/{locale}.json` and consume generated functions from `$lib/paraglide/messages.js`; generated Paraglide output is not hand-edited.
- Keep product-meaningful components near their feature. For example, `AddFiveButton` and `EndOfTimerPrompt` belong in `focus-session`, not shared UI.
- Add abstractions only when they clarify real behavior or remove meaningful duplication.

This fits the product better than pure Atomic Design because the app's complexity is expected to come from timer state, session flow, persistence, and behavioral nuance rather than a large visual component system.

## MVP Scope Candidate

When implementation begins, a pragmatic MVP would be:

- Single main route.
- Task/intention input and a lightweight local Focus list.
- Derive normalized hashtags from task titles through one shared parser. Keep the title as the durable source of truth so highlighting and future filtering do not require a parallel tag-editing workflow.
- Direct minutes-and-seconds countdown input that remembers the last chosen starting duration.
- End-of-timer decision screen with:
  - Add 5 minutes
  - Done
  - Switch task
- Current session summary with total elapsed time and extension count.
- Separate local persistence for planned task state and internal focus-attempt records. The task is the user-facing object; attempt records preserve timestamps, recovery, and honest accounting without appearing as a second workflow.
- Use one stable system ID for the shared Anything task, and assign an entire active attempt when its task changes.
- Versioned local persistence for cumulative grove growth, credited idempotently per elapsed session minute.
- Absolute end timestamps for timer accuracy across throttled background tabs and refresh recovery.

## Durable Storage

- Treat tasks, completed sessions, and grove state as the portable durable dataset. Active timer recovery and interface preferences remain device-local because restoring a running timer on another device would have ambiguous clock and notification semantics.
- Retain completed session records without an artificial display-oriented cap. UI projections may show a smaller window, but persistence and exports must keep the canonical records.
- Wrap locally stored task and session collections in independently versioned records and continue accepting the original unwrapped arrays as a one-way migration path.
- Use the versioned `5-minute-grove` data archive as the public portability boundary. Validate and normalize an entire archive before any write; reject unknown archive or grove versions rather than silently discarding data.
- Support explicit replace and merge imports. Merge by stable task/session IDs, preserve aggregate task baselines left by the former capped history, and add only previously uncredited grove minutes so a local grove reset is not undone.
- Store the unbounded canonical collections in the native `5-minute-grove` IndexedDB database. Serialize writes from one app instance and commit related task, session, and grove updates in one transaction.
- On the first database open, atomically copy the legacy localStorage task, session, and grove values into IndexedDB, record the completed migration in the same transaction, and then remove the migrated keys. A failed transaction leaves the original localStorage data intact for retry.
- Keep active timer recovery and lightweight device preferences in localStorage; these values are small, synchronous, and intentionally outside the portable durable dataset.
- Keep the archive format independent of the IndexedDB layout so exports remain stable through future database migrations.

## UX Constraints

- Starting should take as few interactions as possible.
- The "+5 minutes" action should be easy to choose, but stopping should remain legitimate.
- Keep five minutes as the continuation invitation rather than forcing it as every session's starting duration.
- Avoid visual or copy patterns that imply failure when the user stops.
- Keep stop feedback neutral and concise; let the completed-timer copy gently invite continuation without over-explaining either choice.
- Keep controls stable in size so timer transitions do not shift the layout.
- Use restrained, task-focused UI rather than a marketing page.
- Do not put the changing once-per-second timer value in a live region; announce meaningful phase changes instead.
- Respect reduced-motion preferences for decorative and interaction animation.

## Logo Asset Workflow

- Keep the editable Inkscape source at `media/logo.inkscape.svg`.
- Keep the exported illustration in an Inkscape layer labeled `v2`.
- Label one representative shape for each palette color `dirt`, `trunk`, and `leaf`. Other shapes that use the same source fill are mapped with it.
- Run `npm run generate:logo` after editing the source. This regenerates `src/lib/app/GroveLogo.svelte`, removes hidden/reference content, and maps the three fills to theme tokens.
- Treat `GroveLogo.svelte` as generated code; make drawing changes in Inkscape rather than editing the component directly.

## Future Technical Questions

- Whether multi-tab editing needs optimistic revision conflicts, live synchronization, or an explicit single-writer policy as usage patterns become clearer.
- Whether future grove interactions outgrow the current inline SVG and CSS approach.
- Whether to support PWA installability.
- Whether to add account sync later.
