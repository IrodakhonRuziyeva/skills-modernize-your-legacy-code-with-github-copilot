const acct = require('../index');

beforeEach(() => {
  // reset to default 1000.00
  acct.writeBalance(1000_00);
});

test('initial balance is 1000.00 cents', () => {
  expect(acct.readBalance()).toBe(1000_00);
});

test('formatBalance formats correctly', () => {
  expect(acct.formatBalance(1000_00)).toBe('001000.00');
  expect(acct.formatBalance(0)).toBe('000000.00');
});

test('parseAmountToCents parses decimals', () => {
  expect(acct.parseAmountToCents('150.25')).toBe(15025);
  expect(acct.parseAmountToCents('0.5')).toBe(50);
  expect(acct.parseAmountToCents('10')).toBe(1000);
});

test('creditAccount increases balance', () => {
  const nb = acct.creditAccount(50025); // +500.25
  expect(nb).toBe(1500_25);
  expect(acct.readBalance()).toBe(1500_25);
});

test('debitAccount decreases balance when sufficient funds', () => {
  acct.writeBalance(1500_25);
  const nb = acct.debitAccount(20025); // -200.25
  expect(nb).toBe(1300_00);
  expect(acct.readBalance()).toBe(1300_00);
});

test('debitAccount throws on insufficient funds', () => {
  acct.writeBalance(100_00);
  expect(() => acct.debitAccount(200_00)).toThrow(/Insufficient funds/);
});

test('writeBalance enforces max range', () => {
  const big = 1_000_000_00; // 1,000,000.00 (over max)
  expect(() => acct.writeBalance(big)).toThrow(/Balance out of allowed range/);
});

test('creditAccount throws when exceeding max', () => {
  acct.writeBalance(999_900_00);
  expect(() => acct.creditAccount(200_00)).toThrow(/Resulting balance exceeds maximum allowed/);
});
