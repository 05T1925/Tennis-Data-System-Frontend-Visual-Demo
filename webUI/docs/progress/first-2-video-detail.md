# First-2 Video Detail

## Stage And Goal

First-2 implements only First's `/video/demo-upload-001` page as a restrained professional data workbench. The frozen First-1R2 Fixture, routing, metric registry, validator, and selectors remain the baseline. Statistics pages remain route skeletons.

## Evidence-forced-b Closure

The prior `evidence-forced-b` used Point 4's Player B Serve Shot despite Player B having `forced_error_count=0`. It now references `rally-4-shot-3` and `rally-4-shot-5`, both Player B non-Serve samples, and its label explicitly says no Player B forced errors were detected. Metric values and denominators did not change. A Core semantic regression test verifies zero value, clear label, Player B ownership, and non-Serve samples.

## Reference Audit

Read-only reference files were `frontend-reference` VideoArea, ScoreTimeline, RightPanel, HighlightsList, OverallStats, analysis helpers, mock data, and relevant App video-time code; and `demo_test` DashboardLayout, VideoDetailPage, analysis tabs, presentation, and types. The implementation borrowed only native-video lifecycle, time-update/seek interaction, contextual panels, and safe missing-data patterns. It did not copy their layouts, Tailwind/Ant Design, icons, CSS, large App structure, score model, or visuals.

## Implementation

New First files: `components/AppShell.tsx`, `features/video/presentation.ts`, `hooks/useLocalVideoUrl.ts`, `hooks/useLocalVideoUrl.test.tsx`, and `pages/VideoDetailPage.tsx`. Modified First files are `app/App.tsx`, global CSS, module CSS, and page tests. Modified Core files are `selectors/match.ts`, Fixture, Core tests, and semantic tests. No file was deleted except replacing the original minimal App and styles in place. No dependency was added and the lockfile is unchanged.

The App Shell uses an 84px rail with an accessible current navigation state. The header exposes title, safe fixture filename, match, singles, hard court, analysis completion, Mock data, algorithm version, and duration. The 16:9 video region is the primary visual; without a selected video it renders a deterministic court-line placeholder. A labelled local-file input accepts MP4/WebM/QuickTime and uses an Object URL. Replacing a file revokes the previous URL, unmount revokes the current URL, invalid/empty files show a safe error, and no file data, full path, or URL is logged or persisted.

Core now provides pure clamp, URL parsing, analysis/media time mapping, and playback context selectors. The page keeps Fixture analysis time as authority. Normal timeline, clip, evidence, previous, and next actions update URL `time` with `replace`; media `timeupdate` updates state without history writes. Snapshot mode fixes the URL time, disables selection controls, and does not autoplay. Point gaps show the previous score and no current Shot; after the final Point the final cumulative score is retained.

The right panel contains cumulative score, current Point, and current Shot. The Point/Rally timeline has 12 labelled buttons with winner, rally length, reason, start time, and key-point text. Five shared Clips seek the same analysis state. The metric section uses public Core selectors and Formatter output for four ALL metrics and six A/B comparisons, including samples, P0/P1, confidence, and evidence navigation. P1 disclosure says it is demonstration-rule data rather than a CV conclusion.

## Responsive And Accessibility

At 1920 the bounded workbench keeps the video central and the live panel narrow. At 1440 the video, score context, and timeline share the first viewport. At 1024 the live panel moves below the video; browser validation found `scrollWidth=1009` at a 1024 viewport, so document-level horizontal scrolling is absent. The timeline retains its own horizontal scroll. Buttons, file label, navigation aria labels/current state, timeline `aria-pressed`, disabled controls, focus treatment, contrast, and reduced-motion behavior are present.

## Verification

Core tests: 17 passed. First tests: 10 passed. Total: 27 passed, with all prior tests retained. New coverage includes mapping, parsing, Point/gap/final context, zero forced-error Evidence, local Object URL creation/replacement/unmount/error handling, video-detail rendering, 12 timeline nodes, timeline/Clip interaction, URL initialization, snapshot, and gap state.

`pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` were run successfully. Dev server verification covered root, video detail, normal/snapshot time URLs, three skeleton routes, and 404. Browser checked timeline and fastest-serve Clip both update `time=10610` and reported no console errors. Screenshots were generated at 1440x900, 1920x1080, and 1024x768 using the snapshot URL. Vite was stopped and port 5181 released after verification.

## Boundaries And Remaining Work

Data overview, rally, and serve pages are not implemented. First-3, Second, Third, API, backend, upload, CV, export, and authentication are not started. `demo_test`, `frontend-reference`, `second`, and `third` were not modified. Git writes are none; `webUI` is not a Git repository. Known limitation: local video playback can only be fully exercised with a user-provided compatible local video; the deterministic no-video mode, mapping functions, and lifecycle tests are complete.
