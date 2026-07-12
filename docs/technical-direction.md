# Technical Direction

## Stack

Use SvelteKit when the user asks to start implementation.

Suggested initial shape:

- SvelteKit app with TypeScript.
- Local-first state using browser storage for early MVP persistence.
- Minimal dependencies until concrete needs appear.
- Responsive web UI for desktop and mobile.

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
- Keep product-meaningful components near their feature. For example, `AddFiveButton` and `EndOfTimerPrompt` belong in `focus-session`, not shared UI.
- Add abstractions only when they clarify real behavior or remove meaningful duplication.

This fits the product better than pure Atomic Design because the app's complexity is expected to come from timer state, session flow, persistence, and behavioral nuance rather than a large visual component system.

## MVP Scope Candidate

When implementation begins, a pragmatic MVP would be:

- Single main route.
- Task/intention input.
- 5-minute countdown timer.
- End-of-timer decision screen with:
  - Add 5 minutes
  - Done
  - Break
  - Switch task
- Session summary:
  - task label
  - starts
  - total minutes
  - extension count
  - start/end time
- Local persistence for recent sessions.

## UX Constraints

- Starting should take as few interactions as possible.
- The "+5 minutes" action should be easy to choose, but stopping should remain legitimate.
- Avoid visual or copy patterns that imply failure when the user stops.
- Keep controls stable in size so timer transitions do not shift the layout.
- Use restrained, task-focused UI rather than a marketing page.

## Future Technical Questions

- Whether to use localStorage, IndexedDB, or a small local-first library.
- Whether cozy/gamified visuals should be CSS/Svelte, canvas, or later Three.js.
- Whether to support PWA installability.
- Whether to add account sync later.
