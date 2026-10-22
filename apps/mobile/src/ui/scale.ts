// Chart axis math, kept free of React Native so it can be unit-tested.

// Round axis: 2–5 ticks on a 1/2/2.5/5 × 10ⁿ step, choosing the step that wraps the data most tightly,
// so labels read 150, 175, 200 instead of 159, 177, 195. Flat data gets a little room.
export function niceRange(min: number, max: number): [number, number, number] {
  if (max - min < 1) { min -= 0.5; max += 0.5; }
  const mag = 10 ** Math.floor(Math.log10(max - min));
  let best: [number, number, number] = [min, max, max - min];
  for (const m of [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]) {
    const step = m * mag;
    if (max - min >= 4 && !Number.isInteger(step)) continue; // whole-number labels whenever there's room
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, n = Math.round((hi - lo) / step);
    if (n >= 2 && n <= 5 && (best[2] === max - min || hi - lo < best[1] - best[0])) best = [lo, hi, step];
  }
  return best;
}
