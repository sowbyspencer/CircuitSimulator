# Circuit Simulator

A serverless, browser-based solar and electrical diagram simulator with local JSON file persistence (draw.io-style) and eventual real-time circuit physics—including wire gauge ampacity limits, thermal burnout, breaker trips, and DC-to-AC inverter conversion.

## Project Workflow & Architecture

This project follows an incremental **Scrum** and **Test-Driven Development (TDD)** workflow:

- **`src/engine/`**: Pure JavaScript circuit solver and thermal physics. Zero UI or React dependencies so all math can be tested headlessly.
- **`src/components/`**: React Flow UI cards and interactive wire edges.
- **`docs/backlog.md`**: Prioritized product backlog across sprints.
- **`docs/sprint-log.md`**: Active sprint tasks, status, and session notes.

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
