# Sprint 1 Log

**Sprint Goal:** Deliver a unit-tested DC circuit solver (generic Source + Load + Wires) and connect it to generic React Flow cards.

## Sprint Backlog

| Task ID   | Story        | Task Description                                                                                    | Status | Verification                               |
| :-------- | :----------- | :-------------------------------------------------------------------------------------------------- | :----- | :----------------------------------------- |
| **T-1.1** | Setup        | Initialize repo, `docs/`, and `node --test` runner.                                                 | `DONE` | `npm test` runs cleanly                    |
| **T-1.2** | US-02        | Write unit tests & logic for closed `+` and `-` DC loop detection (including bidirectional wiring). | `DONE` | `src/engine/circuit.test.js` (4/4 passing) |
| **T-1.3** | US-03        | Write unit tests & logic for calculating Load Amps and Wire Amps (`I = P / V`).                     | `DONE` | `src/engine/circuit.test.js` (4/4 passing) |
| **T-1.4** | US-01        | Set up React Flow canvas with generic `DcSourceNode` and `DcLoadNode` cards.                        | `TODO` | Visual canvas test                         |
| **T-1.5** | US-02, US-03 | Connect `solveDcCircuit` to React Flow `onConnect` and `onEdgesChange`.                             | `TODO` | Live Amps update on wire connect/delete    |

## Daily / Session Notes

- **2026-11-23:** Decided to keep engine and tests in a single repo using native `node --test` for the solver before adding React Flow UI. Starting with generic DC components only.
- **2026-11-23:** Implemented `solveDcCircuit` in `src/engine/circuit.js` and passed all 4 unit tests in `circuit.test.js` via `node --test`.
