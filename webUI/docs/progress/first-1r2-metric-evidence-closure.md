# First-1R2 Metric And Evidence Closure

## Goal

Close the remaining shared Fixture data-semantic issues from First-1R without changing the workspace, page visuals, routing, dependencies, lockfile, or any reference project. First-2 has not started.

## Corrected Facts

- `findFastestServe` deterministically selects valid Serve Shots by descending speed, then ascending `startTimeMs`, then ascending Shot ID. The global fastest Shot is `rally-3-shot-2` (Player A, Point 3, 35 m/s); `clip-fast-serve` uses that result.
- `evidence-fast-serve-a` and `evidence-fast-serve-b` reference only their respective player. Player B's fastest Serve evidence is selected independently and never links to Player A footage.
- `winner_count` now counts only `Point.endReason === 'winner'`. Ace and service winner remain exclusively in their own serve metrics.
- `ace_rate` and `service_winner_rate` use non-fault Serve Shots as both their denominator and `sampleSize`.
- `max_shot_speed_mps` only considers finite, non-negative, non-Serve Shot speeds. `safeMax` returns `null` for an empty or non-finite input.

## Sample Size Contract

The Fixture uses an explicit `switch` by metric code. Point metrics use player-participating Points; non-Serve shot metrics use non-Serve Shots; hand-specific metrics use the matching stroke; Rally counts use all Rallies and Rally win rates use their category; serve attempts and double-fault rate use serving Points; serve success rates use first/second attempts; Ace/service-winner rates use valid Serve Shots; serve point-win rates use successful first/second Serve Points; speed metrics use finite speed observations; and direction rates use known-direction Serve Shots. A zero denominator produces `metricValue=null` and `sampleSize=0`.

## Evidence And Clips

Evidence validates its full Point/Rally/Shot ownership chain. P1 player metrics require Evidence and every referenced Shot must belong to that player. Serve, winner, error, and long-rally Clips validate `playerSlot` against their referenced event. The Fixture uses player-specific A/B fastest-serve and serve-sample Evidence, an A service-winner Evidence, and a B zero-Ace sample Evidence rather than falsely linking B to A's Ace.

## Validator And Tests

`validateDemoMatchBundle` now rejects duplicate `metricCode + playerSlot` keys (`METRIC_KEY_DUPLICATE`), broken Evidence parent chains, missing P1 Evidence, cross-player P1 Evidence, incorrect clip players, and score-chain discontinuities. It independently validates detailed `sampleSize` rules for the shared metric registry, including winner, serve-rate, serve-speed, serve-point-win, and max-shot-speed cases.

The original tests were retained. New semantic assertions cover actual global/A/B fastest Serve evidence, B zero-Ace isolation, winner-count separation, detailed serve sample sizes, empty `safeMax`, duplicate metric keys, Evidence chain errors, absent P1 Evidence, invalid serve/winner Clip players, and invalid score continuity.

## Modified Files

- `packages/core/src/fixtures/demoMatch.ts`
- `packages/core/src/validation/bundle.ts`
- `packages/core/tests/semantic.test.ts`
- `docs/CONTENT_CONTRACT.md`
- `docs/progress/first-1r2-metric-evidence-closure.md`

## Boundary And Quality State

No First page visual, layout, CSS, player, or First-2/First-3 code was changed. `second`, `third`, `demo_test`, and `frontend-reference` were not changed. No dependency or lockfile change was made. No Git write operation was performed; `webUI` has no Git repository metadata.

The required quality commands completed successfully: format, format check, lint, typecheck, test, and build. Development-server route verification was performed on port 5181 and its process was stopped after verification.
