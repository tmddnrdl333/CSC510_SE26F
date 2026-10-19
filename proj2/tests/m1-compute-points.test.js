// M1 / UC9: src/points/computePoints.js -- the README formula
// ("10% of bill", "15% for Local Legends"), 1 point = $0.01 on redemption.

const {
  computeOrderPoints,
  BASE_RATE_PERCENT,
  LOCAL_LEGEND_RATE_PERCENT,
} = require('../src/points/computePoints');

describe('M1: computeOrderPoints', () => {
  test('rates match the README', () => {
    expect(BASE_RATE_PERCENT).toBe(10);
    expect(LOCAL_LEGEND_RATE_PERCENT).toBe(15);
  });

  test('a $50 order earns 5 points (proj1a-report/results-table.md UC9 row)', () => {
    expect(computeOrderPoints(50)).toBe(5);
  });

  test('a $50 Local Legend order earns 7 points (7.5 rounded down)', () => {
    expect(computeOrderPoints(50, { isLocalLegend: true })).toBe(7);
  });

  test.each([
    [42.75, false, 4],
    [42.75, true, 6],
    [9.99, false, 0],
    [10, false, 1],
    [100, false, 10],
    [100, true, 15],
    [0.29 * 1000, false, 29], // 290 -> 29 even though 0.29 * 1000 is 289.99999999999994 in JS
  ])('$%p (Local Legend: %p) -> %p points', (amount, isLocalLegend, expected) => {
    expect(computeOrderPoints(amount, { isLocalLegend })).toBe(expected);
  });

  test('never negative or NaN: zero, negative, and non-numeric totals earn 0', () => {
    expect(computeOrderPoints(0)).toBe(0);
    expect(computeOrderPoints(-50)).toBe(0);
    expect(computeOrderPoints('abc')).toBe(0);
    expect(computeOrderPoints(undefined)).toBe(0);
    expect(computeOrderPoints(Infinity)).toBe(0);
  });

  test('numeric strings (as Firestore sometimes returns) are accepted', () => {
    expect(computeOrderPoints('50')).toBe(5);
  });

  test('Local Legend never earns fewer points than the base rate', () => {
    for (let cents = 0; cents <= 20000; cents += 37) {
      const amount = cents / 100;
      expect(computeOrderPoints(amount, { isLocalLegend: true })).toBeGreaterThanOrEqual(computeOrderPoints(amount));
    }
  });
});
