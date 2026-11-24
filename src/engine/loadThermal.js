const AMBIENT_TEMP = 25;
const BURNOUT_TEMP = 150;
const OVERVOLTAGE_TOLERANCE = 1.1; // >10% above rated voltage triggers warning & heating

export function stepLoadThermal(load, inputVolts, dt) {
  const data = load.data || {};
  if (data.burned) {
    return {
      ...load,
      data: { ...data, overvoltage: false, temp: data.temp ?? BURNOUT_TEMP },
    };
  }

  const ratedVolts = data.nominalVolts ?? 12;
  const currentTemp = data.temp ?? AMBIENT_TEMP;

  if (ratedVolts > 0 && inputVolts > ratedVolts * OVERVOLTAGE_TOLERANCE) {
    const ratio = inputVolts / ratedVolts;
    // At 2x rated voltage (24V on 12V load), ratio^2 = 4 -> +85°C/sec -> burns out in ~1.5s
    const heatRate = ratio * ratio * 21.25;
    const nextTemp = currentTemp + heatRate * dt;

    if (nextTemp >= BURNOUT_TEMP) {
      return {
        ...load,
        data: {
          ...data,
          temp: BURNOUT_TEMP,
          burned: true,
          overvoltage: false,
        },
      };
    }

    return {
      ...load,
      data: {
        ...data,
        temp: nextTemp,
        overvoltage: true,
      },
    };
  }

  // Safe voltage: clear overvoltage warning and cool down toward ambient
  const cooledTemp = Math.max(AMBIENT_TEMP, currentTemp - 40 * dt);
  return {
    ...load,
    data: {
      ...data,
      temp: cooledTemp,
      overvoltage: false,
    },
  };
}
