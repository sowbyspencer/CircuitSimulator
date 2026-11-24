import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stepLoadThermal } from "./loadThermal.js";

describe("DC Load Overvoltage & Thermal Burnout", () => {
  it("operates safely with no overvoltage warning when input voltage matches rated voltage", () => {
    const load = {
      id: "load-1",
      type: "dcLoad",
      data: { nominalVolts: 12, watts: 120, temp: 25, burned: false },
    };

    const next = stepLoadThermal(load, 12, 0.1);
    assert.equal(next.data.overvoltage, false);
    assert.equal(next.data.burned, false);
    assert.equal(next.data.temp, 25);
  });

  it("triggers an immediate overvoltage warning on the very first tick at 24V before burning out", () => {
    const load = {
      id: "load-1",
      type: "dcLoad",
      data: { nominalVolts: 12, watts: 120, temp: 25, burned: false },
    };

    // Single 0.1s tick at 24V (4x rated power dissipation)
    const next = stepLoadThermal(load, 24, 0.1);
    assert.equal(next.data.overvoltage, true);
    assert.equal(next.data.burned, false);
    assert.ok(next.data.temp > 25);
  });

  it("burns out a 12V load after ~1.5 seconds of exposure to 24V", () => {
    let load = {
      id: "load-1",
      type: "dcLoad",
      data: { nominalVolts: 12, watts: 120, temp: 25, burned: false },
    };

    // Simulate 15 ticks at 0.1s each (1.5 seconds total)
    for (let i = 0; i < 15; i++) {
      load = stepLoadThermal(load, 24, 0.1);
    }

    assert.equal(load.data.burned, true);
    assert.equal(load.data.overvoltage, false);
  });

  it("cools back down safely if voltage drops back to 12V before burnout completes", () => {
    let load = {
      id: "load-1",
      type: "dcLoad",
      data: { nominalVolts: 12, watts: 120, temp: 90, burned: false },
    };

    load = stepLoadThermal(load, 12, 0.1);
    assert.equal(load.data.overvoltage, false);
    assert.equal(load.data.burned, false);
    assert.ok(load.data.temp < 90);
  });
});
