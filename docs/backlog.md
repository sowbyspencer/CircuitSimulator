# Product Backlog: Circuit Simulator

## Sprint 1: Walking Skeleton (Generic DC Cards & Wires)

- **US-01 (Generic Canvas Cards):** As a user, I want to drag generic DC Source and DC Load cards onto a React Flow canvas and draw bidirectional wires between terminals.
- **US-02 (DC Continuity):** As a user, I want to connect a generic DC Source (`+`/`-`) to a generic DC Load (`+`/`-`) and detect whether the circuit is closed.
- **US-03 (DC Ohm's Law):** As a user, I want the simulator to calculate current (`Amps = Watts / Volts`) across closed DC loops and through connected wires.

## Sprint 2: Persistence & Multi-Load Circuits

- **US-04 (Local Save/Open):** As a user, I want to save my diagram to a `.json` file on my device and load it back (like draw.io).
- **US-05 (Parallel Loads & Busbars):** As a user, I want to connect multiple DC loads in parallel and split connections using generic Busbars.
- **US-05a (Load Equivalent Resistance):** As a user, I want each DC Load to display its equivalent resistance in ohms, with the UI clearly distinguishing rated resistance from operating resistance when the load voltage changes. Add solver and UI tests for the displayed value.
- **US-05b (Bank-Level Source Current):** Until source impedance is modeled, treat individual branch-current readings from ideal parallel-source banks as provisional and prefer displaying the bank's total current. Add tests ensuring source-current display is invariant to source placement and wiring/order where the electrical topology is unchanged. A source wired backwards in a series chain must instead be reported as absorbing input current with negative power.
- **US-05c (Component Palette & Editing) — `DONE`:** Drag DC Sources and Loads from a left-side component palette onto the canvas, delete cards and their wires, and edit source voltage plus load rated voltage and wattage directly on the cards.

### Follow-up implementation: source impedance and realistic current sharing

Replace the interim bank-level display with a physical source model:

- Add an internal resistance value to each DC source, with a documented default and optional per-source configuration.
- Model each source as an ideal voltage source in series with its internal resistance when stamping the MNA system.
- Calculate each source's terminal voltage, branch current, output power, and internal loss from the solved circuit.
- Let parallel-source current divide naturally according to source voltage, internal resistance, and any current limits rather than forcing equal sharing.
- Add regression tests for matched sources, mismatched sources, unequal resistances, series sources, open circuits, shorts, and conservation of current and power.

## Sprint 3: Protection, Wire Gauges & Thermal Burnout

- **US-06 (Switches & Breakers):** As a user, I want to place toggleable Breakers/Fuses that open the circuit when current exceeds their amp rating.
- **US-07 (Wire Gauges & Burnout):** As a user, I want to assign AWG wire sizes that heat up and burn open if current exceeds safe ampacity over time.
- **US-07a (Load Overvoltage & Burnout) — `DONE`:** DC Loads display an immediate overvoltage warning, heat up over time when supplied voltage exceeds their rated voltage, burn open (`0A`), and can be repaired/reset on the card.

## Sprint 4: AC Domain & Inverters

- **US-08 (DC-to-AC Inverter):** As a user, I want an Inverter card that converts DC battery power into 120V AC (accounting for efficiency) and trips on overload.
- **US-09 (AC Loads & Domain Faults):** As a user, I want to wire 120V AC loads and trigger instant faults if AC and DC terminals are miswired.

## Sprint 5: Solar Generation & Battery State

- **US-10 (Solar Panels & MPPT):** As a user, I want Solar Panels and an MPPT Charge Controller to generate power and charge/discharge the battery bank.

## Unordered

- Have Components Panel Collaplable.
- Make it easier to move the ends of wires.
- More Mobile friendly.

### Epic 1: Load Domain Modeling & Presets

#### Story 1.1: Core Load Behavior Modes

- As a user, I want loads to support three distinct electrical behaviors (Constant Resistance, Constant Power, and Constant Current), so that my circuit accurately reflects real-world DC physics.
- Acceptance Criteria:
  - Load model supports three modes: ConstantResistance (Ω), ConstantPower (W), and ConstantCurrent (A).
  - ConstantResistance computes live current as I = V / R and power as P = V² / R.
  - ConstantPower computes live current as \(I = P*{\text{target}} / V\) and effective resistance as \(R*{\text{eff}} = V^2 / P\_{\text{target}}\).
  - ConstantCurrent maintains \(I = I*{\text{target}}\) and computes live power as \(P = V \cdot I*{\text{target}}\).

#### Story 1.2: Configurable Generic ("Blank") Load

- As a user, I want to place a generic blank load and switch its regulation mode between Ohms, Watts, and Amps, so that I can test custom or theoretical load scenarios.
- Acceptance Criteria:
  - Generic load defaults to ConstantResistance (e.g., 10 Ω).
  - Changing the mode updates the primary target input unit (Ω, W, or A) and preserves valid default values.
  - Solver recalculates branch voltage, current, and power immediately upon mode or value change.

#### Story 1.3: Pre-Configured Component Presets

- As a user, I want common components (light bulb, computer, LED driver, motor) to have their load behavior pre-configured by default, so that I don't have to manually look up electrical models for everyday devices.
- Acceptance Criteria:
  - Incandescent Bulb / Heater: Instantiates as ConstantResistance, deriving fixed R from rated voltage and wattage (\(R = V*{\text{rated}}^2 / P*{\text{rated}}\)).
  - Computer / Regulated Electronics: Instantiates as ConstantPower with a preset wattage and under-voltage cutoff.
  - LED Driver / Battery Charger: Instantiates as ConstantCurrent with a preset amperage and compliance voltage drop.
  - Preset mode is locked or clearly labeled as a preset while allowing rated parameters (e.g., wattage) to be edited.

### Epic 2: Newton-Raphson Non-Linear Solver Engine

#### Story 2.1: MNA Component Stamp Interface

- As a developer, I want every load type to compute its own linearized conductance (\(G*{\text{eq}}\)) and Norton equivalent current (\(I*{\text{eq}}\)) for a given node voltage, so that the solver remains decoupled from component-specific math.
- Acceptance Criteria:
  - ConstantResistance stamps \(G*{\text{eq}} = 1/R\) and \(I*{\text{eq}} = 0\).
  - ConstantCurrent stamps \(G*{\text{eq}} = 0\) and \(I*{\text{eq}} = I\_{\text{target}}\).
  - ConstantPower stamps \(G*{\text{eq}} = -P*{\text{target}} / V*k^2\) and \(I*{\text{eq}} = 2P\_{\text{target}} / V_k\).
  - Unit tests verify exact stamp outputs against analytical derivatives for all three modes.

#### Story 2.2: Iterative Newton-Raphson Solver Loop

- As a user, I want the circuit solver to iteratively converge on steady-state node voltages when non-linear loads are present, so that circuits with mixed passive and active loads yield physically accurate results.
- Acceptance Criteria:
  - Solver initializes node voltages from source voltages and iteratively updates the MNA matrix using component stamps.
  - Iteration terminates when maximum node voltage delta \(\vert{}V\_{k+1} - V_k\vert{} < 10^{-6}\,\text{V}\) and KCL current residual < 10⁻⁹ A.
  - Solver applies step damping if Δ V exceeds safe bounds to prevent zero-crossing oscillations.
  - Integration tests verify accurate convergence on mixed series/parallel circuits containing passive, constant-power, and constant-current loads.

### Epic 3: Physical Edge Cases & Fault Protection

#### Story 3.1: Under-Voltage Dropout & Compliance Clamping

- As a user, I want active loads to respect real-world minimum operating voltages instead of dividing by zero or pulling infinite current, so that the simulation stays physically realistic when a circuit is switched off or brownout occurs.
- Acceptance Criteria:
  - ConstantPower loads define a minOperatingVoltage (\(V*{\text{min}}\)); below \(V*{\text{min}}\), the load transitions smoothly into a passive high-impedance/cutoff resistance (\(R*{\text{off}} = V*{\text{min}}^2 / P\_{\text{target}}\)) without discontinuity.
  - ConstantCurrent loads clamp current to 0 A if node voltage drops to or below 0 V (preventing reverse-polarity voltage generation).
  - Unit tests confirm zero NaN or Infinity values when source voltage is set to 0 V.

#### Story 3.2: Voltage Collapse / Overload Detection

- As a user, I want the simulator to alert me if a constant-power load demands more power than the circuit can physically deliver, so that I understand why the circuit failed to stabilize.
- Acceptance Criteria:
  - Solver caps iterations at a configurable maximum (e.g., maxIterations = 100).
  - If convergence is not reached within maxIterations, the solver halts cleanly and flags a VoltageCollapse / UnstableLoad fault state on the circuit.
  - UI displays a clear warning indicator on the overloaded branch rather than freezing or displaying stale values.

#### Story 1.4: Type-Safe Load Factory Constructors

- As a developer, I want explicit named factory methods for creating loads from Ohms, Watts, or Amps, so that unit ambiguity is eliminated and rated passive loads convert cleanly into fixed resistance.
- Acceptance Criteria:
  - Load::fromOhms(ohms) creates a ConstantResistance load with R = ohms.
  - Load::fromRatedWatts(ratedWatts, ratedVolts) creates a ConstantResistance load with \(R = V*{\text{rated}}^2 / P*{\text{rated}}\).
  - Load::fromRatedAmps(ratedAmps, ratedVolts) creates a ConstantResistance load with \(R = V*{\text{rated}} / I*{\text{rated}}\).
  - Load::constantPower(watts, minVolts) creates a ConstantPower load with target P = watts.
  - Load::constantCurrent(amps) creates a ConstantCurrent load with target I = amps.
  - Raw single-argument double constructors are deleted or private to prevent accidental unit mix-ups.
