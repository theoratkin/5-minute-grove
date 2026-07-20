# Storage Model

## Durable Data Boundary

The portable dataset contains:

- focus tasks, including historical aggregate totals;
- all retained completed focus sessions;
- grove state, including its per-session credit ledger and settled-tree state.

An active timer is recovery state for the current device, not a portable completed record. Theme, notification, sound, sleep-reminder, introduction, and language choices are also device-local preferences.

## Archive Contract

`src/lib/app/dataArchive.ts` defines the storage-engine-independent JSON contract:

```json
{
  "format": "5-minute-grove",
  "schemaVersion": 1,
  "exportedAt": "2026-07-19T12:00:00.000Z",
  "data": {
    "tasks": [],
    "sessions": [],
    "grove": {
      "version": 2,
      "totalLeaves": 0,
      "creditedMinutesBySession": {},
      "settledMatureTreeCount": 0
    }
  }
}
```

Parsing rejects invalid JSON, a foreign format, newer or unregistered schema versions, malformed task/session records, and unknown grove versions before storage is changed. Registered older archive versions migrate sequentially to the current schema before validation.

## Import Semantics

Replace imports normalize the archive and replace the portable dataset.

Merge imports are destination-aware:

- sessions deduplicate by stable ID, with the later-ended record winning a conflict;
- task fields use the later `updatedAt` record;
- retained session totals are combined with the maximum non-reconstructable aggregate baseline from either copy, avoiding both double-counting shared history and losing aggregate-only time;
- grove credit ledgers take the maximum credited minute per session;
- only credits new to the destination increase its visible leaves, preserving the destination's intentional reset baseline.

Archive imports validate and merge in memory first, then replace all three records in one IndexedDB transaction. Callers should reload or rehydrate the workspace after a successful import.

## Public Schema Baseline

The canonical browser database is IndexedDB database `5-minute-grove`, version 1, with one `app-data` object store. It contains `tasks`, `sessions`, and `grove` records plus revision metadata. Keeping related records in one store allows atomic replacement without coupling the public archive to the physical database layout.

IndexedDB version 1, archive version 1, active-session version 2, and grove version 2 are the first public formats. Pre-public localStorage task/history/grove keys, active-session version 1, grove version 1, and old task/session title aliases are intentionally unsupported. Fresh installations create the empty version 1 database through migration `0 → 1`.

Writes are queued within an app instance to preserve user-action order. Finishing a session commits its completed record, task aggregates, and current grove together. A database error leaves the in-memory workspace available and displays a localized warning rather than silently claiming the change was saved.

Unbounded history is intentionally no longer coupled to an interface limit. Active timer recovery and preferences remain in localStorage because they are small device-local values and benefit from synchronous startup access.

## Adding a Migration

Both IndexedDB and archive upgrades use `src/lib/app/migrationRegistry.ts`. The registry requires one step for every version boundary, runs steps in ascending order, rejects duplicate targets and gaps, and refuses data newer than the current application understands.

For an IndexedDB schema change:

1. Increment `DATABASE_VERSION` by one.
2. Append a `DATABASE_MIGRATIONS` entry whose `toVersion` equals the new version.
3. Make object-store or index changes through the provided upgrade transaction. Do not open a separate transaction.
4. Keep every older migration unchanged so a user can upgrade directly from any released version.
5. Add a migration fixture and test the oldest supported direct-upgrade path.

For a portable archive change:

1. Increment `DATA_ARCHIVE_SCHEMA_VERSION` by one.
2. Append an `ARCHIVE_MIGRATIONS` entry for that exact target version.
3. Return a copied candidate with its `schemaVersion` advanced and all new fields populated deterministically.
4. Keep exports on the newest version while continuing to parse every registered older version.
5. Add fixtures covering each supported source version, malformed input, and a missing-step failure.

IndexedDB upgrade steps run inside the browser's atomic version-change transaction. If any step throws or aborts, the database remains at its prior version. Archive migrations run entirely in memory before an import can mutate stored data.

## Multi-tab Consistency

Every successful durable-data transaction increments a revision stored beside the data. A tab remembers the revision it loaded and checks it inside the same read-write transaction as its next mutation. If another tab committed first, the stale transaction aborts before writing anything.

After a commit, the writing tab publishes the new revision through `BroadcastChannel`, with a localStorage `storage` event as a compatibility fallback. Other tabs reload the authoritative IndexedDB snapshot and update tasks, completed sessions, and grove state without requiring a page refresh.

Conflicting edits are intentionally not merged from stale in-memory snapshots because that would make deletions and ordering ambiguous. The committed change wins, both tabs converge on it, and the losing tab receives a localized conflict notice. A focus session already committed by another tab is recognized by its stable session ID and settled locally without adding its task totals twice.
