# Circuit Simulator

A serverless, browser-based solar and electrical diagram simulator with local JSON file persistence (draw.io-style) and real-time circuit physics—including wire gauge ampacity limits, load/wire burnout, breaker trips, and DC-to-AC inverter conversion.

## Project Workflow & Architecture

This project follows an incremental **Scrum** and **Test-Driven Development (TDD)** workflow:

- **`src/engine/`**: Pure JavaScript circuit solver and thermal physics. Zero UI or React dependencies so all math can be tested headlessly.
- **`src/components/`**: React Flow UI cards and interactive wire edges.
- **`docs/backlog.md`**: Prioritized product backlog across sprints.
- **`docs/sprint-log.md`**: Active sprint tasks, status, and session notes.

## Current DC Simulation Behavior

- Loads are modeled as non-polarized resistive loads. Their resistance is derived from the configured power and the circuit reference voltage, so reversing a load connection preserves voltage and current magnitude while reversing signed wire flow.
- A source normally reports positive output current and output power.
- A source wired backwards in a series chain can absorb current from the rest of the circuit. It reports this as `Input` current and negative power rather than incorrectly reporting positive output.
- Short-circuit status is scoped to the affected connected circuit, and healthy disconnected circuits continue to solve normally.
- Parallel ideal voltage sources do not have physically determined branch-current sharing. Their individual current readings are provisional until source impedance is implemented; the planned model is documented in [the backlog](./docs/backlog.md).
- Loads are configured by rated/nominal voltage and watts. The solver derives their equivalent resistance from those values and the circuit operating voltage; the measured input voltage and current are displayed separately.

## Prerequisites

- **Node.js (v20+)** (Used only for running tests and building the static bundle; the finished app runs 100% client-side in the browser.)

## Getting Started

Run the unit test suite:

```bash
npm test
```

Run tests in watch mode while developing:

```bash
npm run test:watch
```

Start the local development server (`http://localhost:8000`):

```bash
npm run dev
```

Build the standalone static webpage bundle into `public/`:

```bash
npm run build
```
