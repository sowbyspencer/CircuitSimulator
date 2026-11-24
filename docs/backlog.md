# Product Backlog: Circuit Simulator

## Sprint 1: Walking Skeleton (Generic DC Cards & Wires)

- **US-01 (Generic Canvas Cards):** As a user, I want to drag generic DC Source and DC Load cards onto a React Flow canvas and draw bidirectional wires between terminals.
- **US-02 (DC Continuity):** As a user, I want to connect a generic DC Source (`+`/`-`) to a generic DC Load (`+`/`-`) and detect whether the circuit is closed.
- **US-03 (DC Ohm's Law):** As a user, I want the simulator to calculate current (`Amps = Watts / Volts`) across closed DC loops and through connected wires.

## Sprint 2: Persistence & Multi-Load Circuits

- **US-04 (Local Save/Open):** As a user, I want to save my diagram to a `.json` file on my device and load it back (like draw.io).
- **US-05 (Parallel Loads & Busbars):** As a user, I want to connect multiple DC loads in parallel and split connections using generic Busbars.

## Sprint 3: Protection, Wire Gauges & Thermal Burnout

- **US-06 (Switches & Breakers):** As a user, I want to place toggleable Breakers/Fuses that open the circuit when current exceeds their amp rating.
- **US-07 (Wire Gauges & Burnout):** As a user, I want to assign AWG wire sizes that heat up and burn open if current exceeds safe ampacity over time.

## Sprint 4: AC Domain & Inverters

- **US-08 (DC-to-AC Inverter):** As a user, I want an Inverter card that converts DC battery power into 120V AC (accounting for efficiency) and trips on overload.
- **US-09 (AC Loads & Domain Faults):** As a user, I want to wire 120V AC loads and trigger instant faults if AC and DC terminals are miswired.

## Sprint 5: Solar Generation & Battery State

- **US-10 (Solar Panels & MPPT):** As a user, I want Solar Panels and an MPPT Charge Controller to generate power and charge/discharge the battery bank.
