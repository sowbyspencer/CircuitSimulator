# Sprint 1 Increment

## Sprint Goal

Deliver a unit-tested DC circuit solver (generic Source + Load + Wires) and connect it to generic React Flow cards.

## Sprint Goal Result

**ACHIEVED**

## Completed Product Backlog Items

- **US-01** — Generic Canvas Cards
- **US-02** — DC Continuity
- **US-03** — DC Ohm's Law
- **US-05c** — Component Palette & Editing
- **US-07a** — Load Overvoltage & Thermal Burnout

## Increment Summary

The integrated product (`main`) now supports:

- Drag-and-drop `DcSourceNode` and `DcLoadNode` cards from a left-side component palette onto a React Flow canvas.
- Bidirectional terminal wiring (`ConnectionMode.Loose`) with pure wire connection, reconnection, and disconnection state management (`src/engine/wireActions.js`).
- Modified Nodal Analysis (MNA) solver (`src/engine/circuit.js`) handling series/parallel sources, series/parallel loads, reverse-polarity current absorption, scoped short-circuit detection, and directional wire current animation (`edgeSignedAmps`).
- Voltage-rated resistive load physics ($R = V_{\text{nom}}^2 / P$), immediate `⚠️ OVERVOLTAGE` warnings, 10 Hz thermal heating/burnout (`0A` / `🔥 BURNED OUT`), and on-card `Repair / Reset` recovery (`src/engine/loadThermal.js`).

## Definition of Done Verification

- **Automated Tests:** `npm test` (`node --test`) passes across `src/engine/circuit.test.js`, `src/engine/wireActions.test.js`, and `src/engine/loadThermal.test.js`.
- **Build Verification:** `npm run build` bundles the standalone app cleanly into `public/index.html` via `esbuild`.
- **Manual Verification:** Verified live voltage, current, power, short-circuit warnings, directional flow animation, and thermal burnout/reset in the local browser (`http://localhost:8000`) and GitHub Pages deployment.
- **Documentation & Integration:** `README.md` updated with current DC physics behavior and changes integrated into `main`.

## Sprint Review Notes

- **Findings:** Modeling voltage-rated loads as fixed resistances ($R = V_{\text{nom}}^2 / P$) naturally revealed the need to distinguish passive resistive loads from regulated constant-power and constant-current loads in future work.
- **Backlog Adjustments:** Added Epic 1, Epic 2, and Epic 3 to `docs/product-backlog.md` to introduce non-linear load modes (`ConstantPower`, `ConstantCurrent`), type-safe load factories, and an iterative Newton-Raphson MNA solver loop. Also documented the future need for internal source impedance (`US-05b`) so parallel voltage sources share current physically rather than provisionally.
