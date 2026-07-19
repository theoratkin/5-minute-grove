# Technical Direction

## Stack

Use SvelteKit when the user asks to start implementation.

Suggested initial shape:

- SvelteKit app with TypeScript.
- Local-first state using browser storage for history, preferences, and active-session recovery.
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
- Keep product-meaningful components near their feature. For example, `AddFiveButton` and `EndOfTimerPrompt` belong in `focus-session`, not shared UI.
- Add abstractions only when they clarify real behavior or remove meaningful duplication.

This fits the product better than pure Atomic Design because the app's complexity is expected to come from timer state, session flow, persistence, and behavioral nuance rather than a large visual component system.

## MVP Scope Candidate

When implementation begins, a pragmatic MVP would be:

- Single main route.
- Task/intention input and a lightweight local Focus list.
- Direct minutes-and-seconds countdown input that remembers the last chosen starting duration.
- End-of-timer decision screen with:
  - Add 5 minutes
  - Done
  - Switch task
- Current session summary with total elapsed time and extension count.
- Separate local persistence for planned task state and internal focus-attempt records. The task is the user-facing object; attempt records preserve timestamps, recovery, and honest accounting without appearing as a second workflow.
- Use one stable system ID for the shared Untitled task, and assign an entire active attempt when its task changes.
- Versioned local persistence for cumulative grove growth, credited idempotently per elapsed session minute.
- Absolute end timestamps for timer accuracy across throttled background tabs and refresh recovery.

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

## Future Technical Questions

- Whether to use localStorage, IndexedDB, or a small local-first library.
- Whether future grove interactions outgrow the current inline SVG and CSS approach.
- Whether to support PWA installability.
- Whether to add account sync later.
