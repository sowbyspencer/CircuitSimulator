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

## Sprint 4: AC Domain & Inverters

- **US-08 (DC-to-AC Inverter):** As a user, I want an Inverter card that converts DC battery power into 120V AC (accounting for efficiency) and trips on overload.
- **US-09 (AC Loads & Domain Faults):** As a user, I want to wire 120V AC loads and trigger instant faults if AC and DC terminals are miswired.

## Sprint 5: Solar Generation & Battery State

- **US-10 (Solar Panels & MPPT):** As a user, I want Solar Panels and an MPPT Charge Controller to generate power and charge/discharge the battery bank.
