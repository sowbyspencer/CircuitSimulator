import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { solveDcCircuit } from "./circuit.js";

describe("Sprint 1: Generic DC Circuit Solver", () => {
  const source = { id: "src-1", type: "dcSource", data: { volts: 12 } };
  const load = { id: "load-1", type: "dcLoad", data: { watts: 120 } };

  it("returns 0A when no wires are connected", () => {
    const result = solveDcCircuit([source, load], []);
    assert.equal(result.loadAmps["load-1"], 0);
  });

  it("returns 0A when only the positive wire is connected (open circuit)", () => {
    const edges = [{ id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" }];
    const result = solveDcCircuit([source, load], edges);
    assert.equal(result.loadAmps["load-1"], 0);
    assert.equal(result.edgeAmps["e1"], 0);
  });

  it("calculates 10A on load and both wires when + and - are connected", () => {
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load], edges);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.edgeAmps["e1"], 10);
    assert.equal(result.edgeAmps["e2"], 10);
  });

  it("supports bidirectional wiring (user drags from load terminal to source terminal)", () => {
    const edges = [
      { id: "e1", source: "load-1", sourceHandle: "pos", target: "src-1", targetHandle: "pos" },
      { id: "e2", source: "load-1", sourceHandle: "neg", target: "src-1", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load], edges);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.edgeAmps["e1"], 10);
    assert.equal(result.edgeAmps["e2"], 10);
  });
});
