# Sprint 1 Log

**Sprint Goal:** Deliver a unit-tested DC circuit solver (generic Source + Load + Wires) and connect it to generic React Flow cards.
**Status:** `COMPLETED` (2026-11-23)

## Sprint Backlog

| Task ID   | Story        | Task Description                                                                                    | Status | Verification                                                 |
| :-------- | :----------- | :-------------------------------------------------------------------------------------------------- | :----- | :----------------------------------------------------------- |
| **T-1.1** | Setup        | Initialize repo, `docs/`, and `node --test` runner.                                                 | `DONE` | `npm test` runs cleanly                                      |
| **T-1.2** | US-02        | Write unit tests & logic for closed `+` and `-` DC loop detection (including bidirectional wiring). | `DONE` | `src/engine/circuit.test.js`                                 |
| **T-1.3** | US-03        | Write unit tests & logic for calculating Load Amps and Wire Amps (`I = P / V`).                     | `DONE` | `src/engine/circuit.test.js`                                 |
| **T-1.4** | US-01        | Set up React Flow canvas with generic `DcSourceNode` and `DcLoadNode` cards.                        | `DONE` | Live V, A, and W readouts verified in browser                |
| **T-1.5** | US-02, US-03 | Connect `solveDcCircuit` to React Flow `onConnect`, `onReconnect`, and `onEdgesChange`.             | `DONE` | `src/engine/wireActions.test.js` & directional flow verified |

## Sprint 1 Review & Session Notes

- **2026-11-23:** Decided to keep engine and tests in a single repo using native `node --test` for the solver before adding React Flow UI. Starting with generic DC components only.
- **2026-11-23:** Implemented `solveDcCircuit` in `src/engine/circuit.js` and passed initial unit tests in `circuit.test.js` via `node --test`.
- **2026-11-23:** Set up `esbuild` static bundling (`public/index.html`) and built `DcSourceNode` and `DcLoadNode` with omnidirectional terminals (`ConnectionMode.Loose`).
- **2026-11-23:** Extracted pure wire connection/reconnection/disconnection helpers into `src/engine/wireActions.js` with full unit test coverage in `src/engine/wireActions.test.js`.
- **2026-11-23:** Upgraded `solveDcCircuit` to Modified Nodal Analysis (MNA) with Kirchhoff net-current tree solving to handle arbitrary series/parallel sources, series/parallel loads, reverse-polarity loads, short-circuit detection, and true directional current animation (`edgeSignedAmps`).
- **2026-11-23 (US-07a):** Added `src/engine/loadThermal.js` and `loadThermal.test.js` using TDD. Voltage-rated loads now fix resistance at $R = V_{\text{nom}}^2 / P$, trigger an immediate `⚠️ OVERVOLTAGE` warning when overvolted, heat up via a 10Hz simulation loop, burn open (`0A`), and expose a `Repair / Reset` button on `DcLoadNode`.
