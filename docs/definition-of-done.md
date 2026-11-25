# Definition of Done

A Product Backlog Item is **Done** and eligible for inclusion in the Increment only when all of the following criteria are satisfied:

- **Acceptance Criteria Met:** All functional and edge-case acceptance criteria defined in `docs/product-backlog.md` are satisfied.
- **TDD & Automated Tests:** Unit tests (`src/engine/*.test.js`) and integration tests covering the behavior are written and passing via `npm test`.
- **No Regressions:** Existing circuit physics, thermal burnout, and MNA solver tests continue to pass with zero known regressions.
- **Clean Build:** The static browser bundle compiles cleanly without errors via `npm run build` (`public/index.html`).
- **Manual Verification:** User-facing UI interactions, node cards, and wire flow animations are manually verified in the browser (`npm run dev`).
- **Documentation Updated:** `README.md`, `docs/product-backlog.md`, and `docs/sprint-backlog.md` reflect the current system behavior.
- **Integrated into `main`:** All code, tests, and build artifacts are committed and merged into `main`.
- **Usable Increment:** The deployed/built application remains self-contained, serverless, and immediately usable end-to-end.
