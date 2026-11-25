# Sprint 2 Backlog

## Sprint Goal

Implement non-linear load modeling (`ConstantResistance`, `ConstantPower`, `ConstantCurrent`) and an iterative Newton-Raphson MNA solver loop so mixed passive and active DC loads coexist accurately in the simulator.

## Selected Product Backlog Items

- **Story 1.1** — Core Load Behavior Modes
- **Story 1.2** — Configurable Generic ("Blank") Load
- **Story 1.4** — Type-Safe Load Factory Constructors
- **Story 2.1** — MNA Component Stamp Interface
- **Story 2.2** — Iterative Newton-Raphson Solver Loop

## Delivery Plan

| Task      | PBI            | Description                                                                                                                                                                          | Status |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| **T-2.1** | Story 1.1, 1.4 | Create `Load` domain model with `fromOhms`, `fromRatedWatts`, `fromRatedAmps`, `constantPower`, and `constantCurrent` factories + unit tests.                                        | `TODO` |
| **T-2.2** | Story 2.1      | Implement linearized conductance ($G_{\text{eq}}$) and Norton current ($I_{\text{eq}}$) stamp methods for all three load modes + analytical derivative unit tests.                   | `TODO` |
| **T-2.3** | Story 2.2      | Upgrade `solveDcCircuit` in `src/engine/circuit.js` to run an iterative Newton-Raphson loop with convergence tolerances ($10^{-6}\,\text{V}$, $10^{-9}\,\text{A}$) and step damping. | `TODO` |
| **T-2.4** | Story 2.2      | Write integration tests for mixed series/parallel circuits combining resistive, constant-power, and constant-current loads.                                                          | `TODO` |
| **T-2.5** | Story 1.2      | Update `DcLoadNode` UI to switch between Ohms ($\Omega$), Watts ($\text{W}$), and Amps ($\text{A}$) modes and recalculate live readouts immediately.                                 | `TODO` |
