import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { solveDcCircuit } from "./circuit.js";

describe("Sprint 1: Generic DC Circuit Solver", () => {
  const source = { id: "src-1", type: "dcSource", data: { volts: 12 } };
  const load = { id: "load-1", type: "dcLoad", data: { watts: 120 } };

  function connectedEdges(sourceId = "src-1", loadId = "load-1") {
    return [
      { id: "e1", source: sourceId, sourceHandle: "pos", target: loadId, targetHandle: "pos" },
      { id: "e2", source: sourceId, sourceHandle: "neg", target: loadId, targetHandle: "neg" },
    ];
  }

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

  it("propagates source voltage to connected loads and tracks source total amps", () => {
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load], edges);
    assert.equal(result.loadVolts["load-1"], 12);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.sourceAmps["src-1"], 10);
  });

  it("calculates parallel / daisy-chained loads accurately (120W + 60W on 12V = 15A total)", () => {
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 60 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "e3", source: "load-1", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
      { id: "e4", source: "load-1", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, load, load2], edges);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.loadAmps["load-2"], 5);
    assert.equal(result.sourceAmps["src-1"], 15);
    assert.equal(result.edgeAmps["e1"], 15);
    assert.equal(result.edgeAmps["e3"], 5);
  });

  it("splits load current evenly across two equal-voltage sources wired in parallel", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "src-2", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "neg" },
      { id: "e3", source: "src-2", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e4", source: "src-2", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load], edges);
    assert.equal(result.loadVolts["load-1"], 12);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.sourceAmps["src-1"], 5);
    assert.equal(result.sourceAmps["src-2"], 5);
  });

  it("stacks voltage when two 12V sources are wired in series (- to + = 24V, 120W load = 5A)", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const edges = [
      // Top source (+) to Load (+)
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      // Series jumper: Top source (-) to Bottom source (+)
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      // Bottom source (-) to Load (-)
      { id: "e3", source: "src-2", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load], edges);
    assert.equal(result.loadVolts["load-1"], 24);
    assert.equal(result.loadAmps["load-1"], 5);
    assert.equal(result.sourceAmps["src-1"], 5);
    assert.equal(result.sourceAmps["src-2"], 5);
    assert.equal(result.edgeAmps["e1"], 5);
    assert.equal(result.edgeAmps["e2"], 5);
    assert.equal(result.edgeAmps["e3"], 5);
  });

  it("stacks three 12V sources in series to produce 36V", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const source3 = { id: "src-3", type: "dcSource", data: { volts: 12 } };
    const load360 = { id: "load-360", type: "dcLoad", data: { watts: 360 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-360", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e3", source: "src-2", sourceHandle: "neg", target: "src-3", targetHandle: "pos" },
      { id: "e4", source: "src-3", sourceHandle: "neg", target: "load-360", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, source3, load360], edges);
    assert.equal(result.loadVolts["load-360"], 36);
    assert.equal(result.loadAmps["load-360"], 10);
    assert.equal(result.edgeAmps["e2"], 10);
  });

  it("returns 0A when Top Source (+) and Bottom Source (-) feed loads without a jumper between sources", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
      { id: "e3", source: "src-2", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "e4", source: "src-2", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load, load2], edges);
    assert.equal(result.loadAmps["load-1"], 0);
    assert.equal(result.loadAmps["load-2"], 0);
    assert.equal(result.sourceAmps["src-1"], 0);
    assert.equal(result.sourceAmps["src-2"], 0);
  });

  it("does not treat another load as a jumper wire between + and -", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "load-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e3", source: "src-2", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
    ];

    const result = solveDcCircuit([source, source2, load, load2], edges);
    assert.equal(result.loadAmps["load-1"], 0);
    assert.equal(result.loadAmps["load-2"], 0);
    assert.equal(result.edgeAmps["e3"], 0);
  });

  it("detects a dead short when a source's + and - terminals are tied together", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "e3", source: "src-2", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load], edges);
    assert.equal(result.hasShortCircuit, true);
    assert.equal(result.loadAmps["load-1"], 0);
  });

  it("powers Top Load at 12V (10A) while Bottom Load remains open (0A) when Bottom Load (+) is disconnected", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e3", source: "src-2", sourceHandle: "pos", target: "load-1", targetHandle: "neg" },
      { id: "e4", source: "src-2", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load, load2], edges);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.loadAmps["load-2"], 0);
  });

  it("calculates current when two 120W loads are wired in series across 24V (10A loop)", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e3", source: "load-1", sourceHandle: "neg", target: "load-2", targetHandle: "pos" },
      { id: "e4", source: "src-2", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, source2, load, load2], edges);
    assert.equal(result.loadVolts["load-1"], 12);
    assert.equal(result.loadVolts["load-2"], 12);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.loadAmps["load-2"], 10);
    assert.equal(result.edgeAmps["e3"], 10);
  });

  it("reports directional edge flow (positive when drawn with flow, negative when drawn against flow)", () => {
    const edges = [
      // Drawn WITH conventional current: Source (+) -> Load (+)
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      // Drawn AGAINST conventional current: Source (-) -> Load (-) (current actually flows Load (-) -> Source (-))
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];

    const result = solveDcCircuit([source, load], edges);
    assert.equal(result.edgeSignedAmps["e1"], 10);
    assert.equal(result.edgeSignedAmps["e2"], -10);
  });

  it("powers a generic resistive load when the source polarity is wired backwards", () => {
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "neg" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "pos" },
    ];
    const result = solveDcCircuit([source, load], edges);

    // A generic load is non-polarized, so reverse wiring preserves voltage and
    // current magnitude while reversing the signed wire direction.
    assert.equal(result.hasShortCircuit, false);
    assert.equal(result.loadVolts["load-1"], 12);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.sourceAmps["src-1"], 10);
    assert.equal(result.edgeAmps["e1"], 10);
    assert.equal(result.edgeAmps["e2"], 10);
    assert.equal(result.edgeSignedAmps["e1"], 10);
    assert.equal(result.edgeSignedAmps["e2"], -10);
  });

  it("reports a backwards series source as absorbing current instead of outputting it", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const source3 = { id: "src-3", type: "dcSource", data: { volts: 12 } };
    const source4 = { id: "src-4", type: "dcSource", data: { volts: 12 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "pos" },
      { id: "e3", source: "src-2", sourceHandle: "neg", target: "src-3", targetHandle: "pos" },
      { id: "e4", source: "src-3", sourceHandle: "neg", target: "src-4", targetHandle: "neg" },
      { id: "e5", source: "src-4", sourceHandle: "pos", target: "load-1", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, source2, source3, source4, load], edges);

    assert.equal(result.loadVolts["load-1"], 24);
    assert.equal(result.loadAmps["load-1"], 5);
    assert.equal(result.sourceAmps["src-1"], 5);
    assert.equal(result.sourceAmps["src-2"], 5);
    assert.equal(result.sourceAmps["src-3"], 5);
    assert.equal(result.sourceInputAmps["src-4"], 5);
    assert.equal(result.sourceAmps["src-4"], 0);
  });

  it("returns a complete zero-valued result for an empty circuit", () => {
    const result = solveDcCircuit([], []);

    assert.deepEqual(result, {
      loadAmps: {},
      loadVolts: {},
      sourceAmps: {},
      sourceInputAmps: {},
      edgeAmps: {},
      edgeSignedAmps: {},
      shortEdgeIds: [],
      hasShortCircuit: false,
    });
  });

  it("keeps zero-power loads at zero current and voltage", () => {
    const zeroLoad = { id: "load-zero", type: "dcLoad", data: { watts: 0 } };
    const result = solveDcCircuit([source, zeroLoad], connectedEdges("src-1", "load-zero"));

    assert.equal(result.loadAmps["load-zero"], 0);
    assert.equal(result.loadVolts["load-zero"], 0);
    assert.equal(result.sourceAmps["src-1"], 0);
  });

  it("supports non-integer voltage and power without losing precision beyond output rounding", () => {
    const fractionalSource = { id: "src-fractional", type: "dcSource", data: { volts: 9 } };
    const fractionalLoad = { id: "load-fractional", type: "dcLoad", data: { watts: 10 } };
    const result = solveDcCircuit([fractionalSource, fractionalLoad], connectedEdges("src-fractional", "load-fractional"));

    assert.equal(result.loadVolts["load-fractional"], 9);
    assert.equal(result.loadAmps["load-fractional"], 1.111);
    assert.equal(result.sourceAmps["src-fractional"], 1.111);
  });

  it("flags unequal parallel ideal sources as a short circuit", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 5 } };
    const edges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "src-2", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, source2], edges);

    assert.equal(result.hasShortCircuit, true);
    assert.deepEqual(result.sourceAmps, { "src-1": 0, "src-2": 0 });
  });

  it("limits short-circuit edges to the affected electrical circuit", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "short-pos", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "short-neg", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "good-pos", source: "src-2", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
      { id: "good-neg", source: "src-2", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
      { id: "short-jumper", source: "load-1", sourceHandle: "pos", target: "load-1", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load, source2, load2], edges);

    assert.equal(result.hasShortCircuit, true);
    assert.deepEqual(result.shortEdgeIds.sort(), ["short-jumper", "short-neg", "short-pos"]);
  });

  it("still solves a healthy circuit when another disconnected circuit is shorted", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 120 } };
    const edges = [
      { id: "good-pos", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "good-neg", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "short-pos", source: "src-2", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
      { id: "short-neg", source: "src-2", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
      { id: "short-jumper", source: "src-2", sourceHandle: "pos", target: "src-2", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load, source2, load2], edges);

    assert.equal(result.hasShortCircuit, true);
    assert.equal(result.loadVolts["load-1"], 12);
    assert.equal(result.loadAmps["load-1"], 10);
    assert.equal(result.sourceAmps["src-1"], 10);
    assert.deepEqual(result.shortEdgeIds.sort(), ["short-jumper", "short-neg", "short-pos"]);
  });

  it("does not mutate load nodes or retain resistance between calls", () => {
    const reusableLoad = { id: "load-reused", type: "dcLoad", data: { watts: 120 } };
    const edges = connectedEdges("src-1", "load-reused");

    const first = solveDcCircuit([source, reusableLoad], edges);
    reusableLoad.data.watts = 0;
    const second = solveDcCircuit([source, reusableLoad], edges);

    assert.equal(first.loadAmps["load-reused"], 10);
    assert.equal(second.loadAmps["load-reused"], 0);
    assert.equal(second.loadVolts["load-reused"], 0);
    assert.equal("_R" in reusableLoad, false);
  });

  it("conserves current across a source and parallel loads", () => {
    const load2 = { id: "load-2", type: "dcLoad", data: { watts: 60 } };
    const edges = [
      ...connectedEdges("src-1", "load-1"),
      { id: "e3", source: "src-1", sourceHandle: "pos", target: "load-2", targetHandle: "pos" },
      { id: "e4", source: "src-1", sourceHandle: "neg", target: "load-2", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, load, load2], edges);

    assert.equal(result.sourceAmps["src-1"], result.loadAmps["load-1"] + result.loadAmps["load-2"]);
    assert.equal(result.edgeAmps["e1"], 10);
    assert.equal(result.edgeAmps["e3"], 5);
    assert.equal(result.edgeAmps["e2"], 10);
    assert.equal(result.edgeAmps["e4"], 5);
  });

  it("reports current on parallel return wires instead of leaving one at 0A", () => {
    const source2 = { id: "src-2", type: "dcSource", data: { volts: 12 } };
    const edges = [
      { id: "pos-1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "pos-2", source: "src-2", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "neg-1", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "neg-2", source: "src-2", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
      { id: "src-pos", source: "src-1", sourceHandle: "pos", target: "src-2", targetHandle: "pos" },
      { id: "src-neg", source: "src-1", sourceHandle: "neg", target: "src-2", targetHandle: "neg" },
    ];
    const result = solveDcCircuit([source, source2, load], edges);

    assert.equal(result.loadAmps["load-1"], 10);
    assert.ok(result.edgeAmps["neg-1"] > 0);
    assert.ok(result.edgeAmps["neg-2"] > 0);
  });

  it("surges current (20A / 480W) when a 24V source feeds a 12V 120W rated load", () => {
    const source24 = { id: "src-24", type: "dcSource", data: { volts: 24 } };
    const load12 = { id: "load-12", type: "dcLoad", data: { nominalVolts: 12, watts: 120 } };
    const result = solveDcCircuit([source24, load12], connectedEdges("src-24", "load-12"));

    assert.equal(result.loadVolts["load-12"], 24);
    assert.equal(result.loadAmps["load-12"], 20);
    assert.equal(result.sourceAmps["src-24"], 20);
  });

  it("opens the circuit (0A) once a load has burned out", () => {
    const source24 = { id: "src-24", type: "dcSource", data: { volts: 24 } };
    const burnedLoad = {
      id: "load-burned",
      type: "dcLoad",
      data: { nominalVolts: 12, watts: 120, burned: true },
    };
    const result = solveDcCircuit([source24, burnedLoad], connectedEdges("src-24", "load-burned"));

    assert.equal(result.loadAmps["load-burned"], 0);
    assert.equal(result.sourceAmps["src-24"], 0);
    assert.equal(result.edgeAmps["e1"], 0);
  });
});
