# Agent Context

This repository is for a planned SvelteKit web app called "Just 5 More Minutes".

## Current State

- No app has been scaffolded yet.
- The user explicitly asked to initialize durable agent docs only.
- Do not start building the web app until the user asks.

## Product Summary

The app is based on a focus pattern the user discovered:

1. Start with a tiny, honest 5-minute work contract.
2. When the timer ends, the contract is complete and stopping is allowed.
3. The app offers a prominent "Add 5 minutes" action.
4. Repeated voluntary extensions turn activation into momentum.

The key nuance is consent-based continuation. This is not a standard Pomodoro clone and should not treat stopping after 5 minutes as failure.

## Working Principles

- Preserve the "permission to quit" mental contract.
- Optimize for getting started, not maximizing session length at all costs.
- Make the end-of-timer decision small and low-pressure.
- Reward starts and voluntary continuations.
- Avoid shame, streak pressure, or punitive mechanics.
- Keep the app lightweight enough that using it does not become another task.

## Planned Stack

- SvelteKit for the web app.
- Prefer a simple local-first MVP unless the user asks for accounts or sync.
- Choose implementation details in line with SvelteKit conventions once the project is scaffolded.

## Durable Docs

- Product context: `docs/product-context.md`
- Technical direction: `docs/technical-direction.md`
- Decision log: `docs/decision-log.md`

