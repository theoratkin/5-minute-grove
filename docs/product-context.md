# Product Context

## Core Idea

"Just 5 More Minutes" is a focus web app centered on tiny work contracts and voluntary continuation.

The user found that ordinary Pomodoro, stopwatch, and timer workflows do not work well for them because getting started is the hardest part. A 5-minute timer works better because it creates a small, believable commitment with permission to quit afterward. In Virtual Cottage 2, the end-of-timer "Add 5 minutes" button creates a useful loop: once started, clicking another 5 minutes is easy enough to keep momentum going.

## Product Thesis

The product is not primarily a timer. It is a momentum loop:

Start tiny -> complete contract -> allow stopping -> invite +5 -> repeat.

The app should treat a finished five-minute block as a neutral decision point and gently invite another five minutes. Stopping is a normal option and does not need praise, reassurance, or justification.

## Differentiation

Adjacent products exist:

- Pomodoro timers with extend-session controls.
- 5-minute rule and anti-procrastination timers.
- Gamified focus apps such as virtual gardens or cozy focus companions.
- Task breakdown tools that reduce activation friction.

The more nuanced opportunity is making the repeated, consent-based "+5 minutes" loop the central mechanic rather than an add-on.

## Target Experience

The first usable version should likely include:

- An optional session title, defaulting simply to "Session".
- A default 5-minute timer.
- A clear end-of-contract state.
- A prominent "Add 5 minutes" action.
- Equally valid options to stop, break, or switch.
- A local session history grouped by the day each session began, with options to resume or delete a session.
- Honest accounting when a session ends early: partial time is saved without awarding a completed contract.
- Recovery of an in-progress session after a refresh or accidental tab close.

Possible later layers:

- Cozy visual progress that grows with each extension.
- "Tiny quest" prompts for the next visible action.
- Stats focused on starts, rescued tasks, voluntary extensions, and bonus minutes.
- Local streaks or achievements only if they do not create shame pressure.

## Non-Goals

- Do not make this a generic Pomodoro clone.
- Do not require long up-front planning.
- Do not punish stopping after the first 5 minutes.
- Do not over-encourage or congratulate users for stopping; acknowledge the saved session plainly.
- Do not describe a partial block as a completed five-minute contract; encouragement should remain truthful.
- Do not overbuild accounts, social features, or heavy analytics early.
