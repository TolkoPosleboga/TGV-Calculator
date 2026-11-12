function calculateEnthalpy(t, humidity, pressure = 101325.0) {
    if (t === undefined || t === null || humidity === undefined || humidity === null) {
        return null;
    }
    const phi = humidity / 100.0;
    const B = pressure;

    const p_sat = Math.pow(10, (658 + 10.2 * t) / (236 + t));
    const p_v = phi * p_sat;
    const d = 622 * (p_v / (B - p_v));
    const I = 1.005 * t + (d / 1000) * (2500 + 1.86 * t);

    return parseFloat(I.toFixed(1));
}

function calculateMoistureContent(t, humidity, pressure = 101325.0) {
    if (t === undefined || t === null || humidity === undefined || humidity === null) {
        return 0;
    }
    const phi = humidity / 100.0;
    const B = pressure;

    const p_sat = Math.pow(10, (658 + 10.2 * t) / (236 + t));
    const p_v = phi * p_sat;
    return 622 * (p_v / (B - p_v)); // г/кг
}