import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { connectWire, moveWire, disconnectWire } from "./wireActions.js";

describe("Wire Connection, Reconnection, and Disconnection", () => {
  it("connects a new wire between two terminals", () => {
    const initialEdges = [];
    const params = {
      source: "src-1",
      sourceHandle: "pos",
      target: "load-1",
      targetHandle: "pos",
    };

    const updated = connectWire(initialEdges, params);
    assert.equal(updated.length, 1);
    assert.equal(updated.at(0).source, "src-1");
    assert.equal(updated.at(0).target, "load-1");
  });

  it("prevents duplicate wires between the exact same two terminals", () => {
    const existing = [{ id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" }];
    const duplicateParams = {
      source: "src-1",
      sourceHandle: "pos",
      target: "load-1",
      targetHandle: "pos",
    };

    const updated = connectWire(existing, duplicateParams);
    assert.equal(updated.length, 1);
  });

  it("moves an existing wire endpoint to a new terminal (reconnect)", () => {
    const initialEdges = [{ id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" }];
    const newConnection = {
      source: "src-1",
      sourceHandle: "pos",
      target: "load-2",
      targetHandle: "pos",
    };

    const updated = moveWire(initialEdges, initialEdges.at(0), newConnection);
    assert.equal(updated.length, 1);
    assert.equal(updated.at(0).id, "e1");
    assert.equal(updated.at(0).target, "load-2");
    assert.equal(updated.at(0).targetHandle, "pos");
  });

  it("disconnects and removes a wire when dropped into empty space", () => {
    const initialEdges = [
      { id: "e1", source: "src-1", sourceHandle: "pos", target: "load-1", targetHandle: "pos" },
      { id: "e2", source: "src-1", sourceHandle: "neg", target: "load-1", targetHandle: "neg" },
    ];

    const updated = disconnectWire(initialEdges, "e1");
    assert.equal(updated.length, 1);
    assert.equal(updated.at(0).id, "e2");
  });

  it("generates unique IDs and prevents reverse-direction duplicates", () => {
    const e1 = connectWire([], {
      source: "src-1",
      sourceHandle: "pos",
      target: "load-1",
      targetHandle: "pos",
    });
    const e2 = connectWire(e1, {
      source: "load-1",
      sourceHandle: "pos",
      target: "src-1",
      targetHandle: "pos",
    });

    assert.equal(e2.length, 1);
    assert.ok(e1.at(0).id);
  });
});
