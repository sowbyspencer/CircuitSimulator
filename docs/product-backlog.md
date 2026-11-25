# Product Backlog: Circuit Simulator

## Product Goal

Build a serverless, browser-based electrical system simulator that lets users visually design DC, AC, solar, battery, and inverter systems and accurately simulate their electrical behavior, thermal limits, and failure conditions.

---

## Ordered Product Backlog

| Order | ID        | Product Backlog Item                            | Status              |
| ----: | --------- | ----------------------------------------------- | ------------------- |
|     1 | Story 1.1 | Core Load Behavior Modes (Constant R, P, I)     | Selected (Sprint 2) |
|     2 | Story 1.2 | Configurable Generic ("Blank") Load             | Selected (Sprint 2) |
|     3 | Story 1.4 | Type-Safe Load Factory Constructors             | Selected (Sprint 2) |
|     4 | Story 2.1 | MNA Component Stamp Interface                   | Selected (Sprint 2) |
|     5 | Story 2.2 | Iterative Newton-Raphson Solver Loop            | Selected (Sprint 2) |
|     6 | Story 3.1 | Under-Voltage Dropout & Compliance Clamping     | Ready               |
|     7 | Story 3.2 | Voltage Collapse / Overload Detection           | Ready               |
|     8 | Story 1.3 | Pre-Configured Component Presets                | Ready               |
|     9 | US-04     | Local Save/Open (`.json` persistence)           | Ready               |
|    10 | US-05     | Parallel Loads & Busbars                        | Ready               |
|    11 | US-05a    | Load Equivalent Resistance Display              | Ready               |
|    12 | US-05b    | Bank-Level Source Current & Impedance Follow-up | Ready               |
|    13 | US-06     | Switches & Breakers                             | Future              |
|    14 | US-07     | Wire Gauges & Thermal Burnout                   | Future              |
|    15 | US-08     | DC-to-AC Inverter                               | Future              |
|    16 | US-09     | AC Loads & Domain Faults                        | Future              |
|    17 | US-10     | Solar Panels & MPPT Charge Controller           | Future              |
|    18 | UX-01     | Collapsible Components Panel                    | Future              |
|    19 | UX-02     | Improved Wire Endpoint Reconnection UX          | Future              |
|    20 | UX-03     | Mobile & Touch Viewport Responsiveness          | Future              |
|    21 | US-01     | Generic Canvas Cards                            | Done (Sprint 1)     |
|    22 | US-02     | DC Continuity                                   | Done (Sprint 1)     |
|    23 | US-03     | DC Ohm's Law                                    | Done (Sprint 1)     |
|    24 | US-05c    | Component Palette & Editing                     | Done (Sprint 1)     |
|    25 | US-07a    | Load Overvoltage & Thermal Burnout              | Done (Sprint 1)     |

---

## Product Backlog Item Details & Acceptance Criteria

### Epic 1: Load Domain Modeling & Presets

#### Story 1.1: Core Load Behavior Modes

As a user, I want loads to support three distinct electrical behaviors (Constant Resistance, Constant Power, and Constant Current), so that my circuit accurately reflects real-world DC physics.

- **Acceptance Criteria:**
  - Load model supports three modes: `ConstantResistance` ($\Omega$), `ConstantPower` ($\text{W}$), and `ConstantCurrent` ($\text{A}$).
  - `ConstantResistance` computes live current as $I = V / R$ and power as $P = V^2 / R$.
  - `ConstantPower` computes live current as $I = P_{\text{target}} / V$ and effective resistance as $R_{\text{eff}} = V^2 / P_{\text{target}}$.
  - `ConstantCurrent` maintains $I = I_{\text{target}}$ and computes live power as $P = V \cdot I_{\text{target}}$.

#### Story 1.2: Configurable Generic ("Blank") Load

As a user, I want to place a generic blank load and switch its regulation mode between Ohms, Watts, and Amps, so that I can test custom or theoretical load scenarios.

- **Acceptance Criteria:**
  - Generic load defaults to `ConstantResistance` (e.g., $10\,\Omega$).
  - Changing the mode updates the primary target input unit ($\Omega$, $\text{W}$, or $\text{A}$) and preserves valid default values.
  - Solver recalculates branch voltage, current, and power immediately upon mode or value change.

#### Story 1.3: Pre-Configured Component Presets

As a user, I want common components (light bulb, computer, LED driver, motor) to have their load behavior pre-configured by default, so that I don't have to manually look up electrical models for everyday devices.

- **Acceptance Criteria:**
  - **Incandescent Bulb / Heater:** Instantiates as `ConstantResistance`, deriving fixed $R$ from rated voltage and wattage ($R = V_{\text{rated}}^2 / P_{\text{rated}}$).
  - **Computer / Regulated Electronics:** Instantiates as `ConstantPower` with a preset wattage and under-voltage cutoff.
  - **LED Driver / Battery Charger:** Instantiates as `ConstantCurrent` with a preset amperage and compliance voltage drop.
  - Preset mode is locked or clearly labeled as a preset while allowing rated parameters (e.g., wattage) to be edited.

#### Story 1.4: Type-Safe Load Factory Constructors

As a developer, I want explicit named factory methods for creating loads from Ohms, Watts, or Amps, so that unit ambiguity is eliminated and rated passive loads convert cleanly into fixed resistance.

- **Acceptance Criteria:**
  - `Load.fromOhms(ohms)` creates a `ConstantResistance` load with $R = \text{ohms}$.
  - `Load.fromRatedWatts(ratedWatts, ratedVolts)` creates a `ConstantResistance` load with $R = V_{\text{rated}}^2 / P_{\text{rated}}$.
  - `Load.fromRatedAmps(ratedAmps, ratedVolts)` creates a `ConstantResistance` load with $R = V_{\text{rated}} / I_{\text{rated}}$.
  - `Load.constantPower(watts, minVolts)` creates a `ConstantPower` load with target $P = \text{watts}$.
  - `Load.constantCurrent(amps)` creates a `ConstantCurrent` load with target $I = \text{amps}$.
  - Raw single-argument constructors are removed or private to prevent accidental unit mix-ups.

---

### Epic 2: Newton-Raphson Non-Linear Solver Engine

#### Story 2.1: MNA Component Stamp Interface

As a developer, I want every load type to compute its own linearized conductance ($G_{\text{eq}}$) and Norton equivalent current ($I_{\text{eq}}$) for a given node voltage, so that the solver remains decoupled from component-specific math.

- **Acceptance Criteria:**
  - `ConstantResistance` stamps $G_{\text{eq}} = 1/R$ and $I_{\text{eq}} = 0$.
  - `ConstantCurrent` stamps $G_{\text{eq}} = 0$ and $I_{\text{eq}} = I_{\text{target}}$.
  - `ConstantPower` stamps $G_{\text{eq}} = -P_{\text{target}} / V_k^2$ and $I_{\text{eq}} = 2P_{\text{target}} / V_k$.
  - Unit tests verify exact stamp outputs against analytical derivatives for all three modes.

#### Story 2.2: Iterative Newton-Raphson Solver Loop

As a user, I want the circuit solver to iteratively converge on steady-state node voltages when non-linear loads are present, so that circuits with mixed passive and active loads yield physically accurate results.

- **Acceptance Criteria:**
  - Solver initializes node voltages from source voltages and iteratively updates the MNA matrix using component stamps.
  - Iteration terminates when maximum node voltage delta $|V_{k+1} - V_k| < 10^{-6}\,\text{V}$ and KCL current residual $< 10^{-9}\,\text{A}$.
  - Solver applies step damping if $\Delta V$ exceeds safe bounds to prevent zero-crossing oscillations.
  - Integration tests verify accurate convergence on mixed series/parallel circuits containing passive, constant-power, and constant-current loads.

---

### Epic 3: Physical Edge Cases & Fault Protection

#### Story 3.1: Under-Voltage Dropout & Compliance Clamping

As a user, I want active loads to respect real-world minimum operating voltages instead of dividing by zero or pulling infinite current, so that the simulation stays physically realistic when a circuit is switched off or brownout occurs.

- **Acceptance Criteria:**
  - `ConstantPower` loads define a `minOperatingVoltage` ($V_{\text{min}}$); below $V_{\text{min}}$, the load transitions smoothly into a passive high-impedance/cutoff resistance ($R_{\text{off}} = V_{\text{min}}^2 / P_{\text{target}}$) without discontinuity.
  - `ConstantCurrent` loads clamp current to $0\,\text{A}$ if node voltage drops to or below $0\,\text{V}$ (preventing reverse-polarity voltage generation).
  - Unit tests confirm zero `NaN` or `Infinity` values when source voltage is set to $0\,\text{V}$.

#### Story 3.2: Voltage Collapse / Overload Detection

As a user, I want the simulator to alert me if a constant-power load demands more power than the circuit can physically deliver, so that I understand why the circuit failed to stabilize.

- **Acceptance Criteria:**
  - Solver caps iterations at a configurable maximum (e.g., `maxIterations = 100`).
  - If convergence is not reached within `maxIterations`, the solver halts cleanly and flags a `VoltageCollapse` / `UnstableLoad` fault state on the circuit.
  - UI displays a clear warning indicator on the overloaded branch rather than freezing or displaying stale values.

---

### Additional Functional & UX Stories

#### US-04: Local Save/Open

As a user, I want to save my diagram to a `.json` file on my device and load it back (like draw.io).

#### US-05: Parallel Loads & Busbars

As a user, I want to connect multiple DC loads in parallel and split connections using generic Busbars.

#### US-05a: Load Equivalent Resistance

As a user, I want each DC Load to display its equivalent resistance in ohms, with the UI clearly distinguishing rated resistance from operating resistance when the load voltage changes. Add solver and UI tests for the displayed value.

#### US-05b: Bank-Level Source Current & Physical Source Impedance

Until source impedance is modeled, treat individual branch-current readings from ideal parallel-source banks as provisional and prefer displaying the bank's total current. Add tests ensuring source-current display is invariant to source placement and wiring/order where the electrical topology is unchanged. A source wired backwards in a series chain must instead be reported as absorbing input current with negative power.

- **Follow-up implementation (Source Impedance):**
  - Add an internal resistance value to each DC source, with a documented default and optional per-source configuration.
  - Model each source as an ideal voltage source in series with its internal resistance when stamping the MNA system.
  - Calculate each source's terminal voltage, branch current, output power, and internal loss from the solved circuit.
  - Let parallel-source current divide naturally according to source voltage, internal resistance, and any current limits rather than forcing equal sharing.
  - Add regression tests for matched sources, mismatched sources, unequal resistances, series sources, open circuits, shorts, and conservation of current and power.

#### US-06: Switches & Breakers

As a user, I want to place toggleable Breakers/Fuses that open the circuit when current exceeds their amp rating.

#### US-07: Wire Gauges & Burnout

As a user, I want to assign AWG wire sizes that heat up and burn open if current exceeds safe ampacity over time.

#### US-08: DC-to-AC Inverter

As a user, I want an Inverter card that converts DC battery power into 120V AC (accounting for efficiency) and trips on overload.

#### US-09: AC Loads & Domain Faults

As a user, I want to wire 120V AC loads and trigger instant faults if AC and DC terminals are miswired.

#### US-10: Solar Panels & MPPT

As a user, I want Solar Panels and an MPPT Charge Controller to generate power and charge/discharge the battery bank.

#### UX-01: Collapsible Components Panel

As a user, I want the left-side component palette to be collapsible so I can maximize canvas workspace.

#### UX-02: Improved Wire Endpoint Reconnection UX

As a user, I want larger/clearer terminal hit targets so moving the ends of existing wires is effortless.

#### UX-03: Mobile & Touch Viewport Responsiveness

As a user, I want touch-friendly drag, pan, and card controls so the simulator is usable on mobile and tablet screens.
