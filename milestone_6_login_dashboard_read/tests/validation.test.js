// tests/validation.test.js
// Unit tests for the server-side validation. They do NOT need MySQL or a running server.
// Run with:  npm test
const test = require('node:test');
const assert = require('node:assert');

// The server file must be loadable without starting the server (see "require.main" in server.js).
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'test';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
const { checkReservation, monthsBefore } = require('../server/server.js');

// Returns a date text like '2026-10-24', n days from today.
function daysFromToday(n) {
  const d = new Date(Date.now() + n * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// A reservation that should pass. Each test changes one field.
function goodData() {
  return {
    customer_name: 'Ana Dela Cruz',
    phone: '0917 123 4567',
    email: 'ana@example.com',
    branch: 'calamba',
    guests: 4,
    reservation_date: daysFromToday(5),
    reservation_time: '18:00',
    occasion: 'Birthday',
    allergies: 'No peanuts please',
    special_requests: 'Window seat please'
  };
}

test('a good reservation has no errors and is cleaned for the database', () => {
  const result = checkReservation(goodData(), false);
  assert.deepStrictEqual(result.errors, {});
  assert.strictEqual(result.values.reservation_time, '18:00:00');
  assert.strictEqual(result.values.guests, 4);
  assert.strictEqual(result.values.occasion, 'Birthday');
  assert.strictEqual(result.values.allergies, 'No peanuts please');
});

test('name: empty, too short, and odd characters are rejected', () => {
  for (const bad of ['', ' ', 'A', '<script>alert(1)</script>', '12345']) {
    const data = goodData(); data.customer_name = bad;
    assert.ok(checkReservation(data, false).errors.customer_name, 'should reject: ' + bad);
  }
});

test('name: accents, apostrophes and hyphens are allowed', () => {
  for (const ok of ["Niño Reyes", "Mary-Ann O'Neil", 'José']) {
    const data = goodData(); data.customer_name = ok;
    assert.strictEqual(checkReservation(data, false).errors.customer_name, undefined, ok);
  }
});

test('phone: letters and too few digits are rejected', () => {
  for (const bad of ['', 'abcdefg', '12345', '1234567890123456789']) {
    const data = goodData(); data.phone = bad;
    assert.ok(checkReservation(data, false).errors.phone, 'should reject: ' + bad);
  }
});

test('email is REQUIRED for customers (the cafe confirms by email)', () => {
  const data = goodData();
  data.email = '';
  assert.ok(checkReservation(data, false).errors.email);
  data.email = 'not-an-email';
  assert.ok(checkReservation(data, false).errors.email);
  data.email = 'Ana@Example.com';
  assert.strictEqual(checkReservation(data, false).values.email, 'ana@example.com');
});

test('email may be empty in a staff edit (older records may not have one)', () => {
  const data = goodData(); data.email = ''; data.status = 'pending';
  const result = checkReservation(data, true);
  assert.strictEqual(result.errors.email, undefined);
  assert.strictEqual(result.values.email, null);
});

test('branch must be one of the two real branches', () => {
  const data = goodData();
  data.branch = 'manila';
  assert.ok(checkReservation(data, false).errors.branch);
  data.branch = 'cabuyao';
  assert.strictEqual(checkReservation(data, false).errors.branch, undefined);
});

test('guests online: 2 to 10 whole numbers only', () => {
  for (const bad of [0, 1, 11, 20, -1, 2.5, 'abc', '', null]) {
    const data = goodData(); data.guests = bad;
    assert.ok(checkReservation(data, false).errors.guests, 'should reject: ' + bad);
  }
  for (const ok of [2, 10, '6']) {
    const data = goodData(); data.guests = ok;
    assert.strictEqual(checkReservation(data, false).errors.guests, undefined, String(ok));
  }
});

test('guests in a staff edit: 1 to 20 (phone bookings of bigger groups)', () => {
  for (const ok of [1, 15, 20]) {
    const data = goodData(); data.guests = ok; data.status = 'pending';
    assert.strictEqual(checkReservation(data, true).errors.guests, undefined, String(ok));
  }
  const data = goodData(); data.guests = 21; data.status = 'pending';
  assert.ok(checkReservation(data, true).errors.guests);
});

test('date: today (no same-day), past, impossible, wrong format and too far ahead are rejected', () => {
  for (const bad of [daysFromToday(0), daysFromToday(-2), '2026-02-31', '24/10/2026', '', daysFromToday(90)]) {
    const data = goodData(); data.reservation_date = bad;
    assert.ok(checkReservation(data, false).errors.reservation_date, 'should reject: ' + bad);
  }
});

test('date: tomorrow is accepted (1 day notice is enough)', () => {
  // The cafe date uses the Manila time zone, so we ask for 2 days to stay safe near midnight.
  const data = goodData(); data.reservation_date = daysFromToday(2);
  assert.strictEqual(checkReservation(data, false).errors.reservation_date, undefined);
});

test('time: only whole hours inside the branch opening hours', () => {
  const data = goodData();
  for (const bad of ['03:00', '18:30', '18:15', '25:00', '22:00', '']) {
    data.reservation_time = bad;
    assert.ok(checkReservation(data, false).errors.reservation_time, 'calamba should reject: ' + bad);
  }
  for (const ok of ['10:00', '21:00']) {   // Calamba: 10:00 to 21:00 (closes 22:00)
    data.reservation_time = ok;
    assert.strictEqual(checkReservation(data, false).errors.reservation_time, undefined, 'calamba ' + ok);
  }
});

test('time: Cabuyao opens at 9:00 and closes at 9:00 PM, Calamba opens at 10:00', () => {
  const data = goodData();
  data.branch = 'cabuyao';
  data.reservation_time = '09:00';
  assert.strictEqual(checkReservation(data, false).errors.reservation_time, undefined);
  data.reservation_time = '21:00';
  assert.ok(checkReservation(data, false).errors.reservation_time, 'cabuyao last request is 20:00');
  data.branch = 'calamba';
  data.reservation_time = '09:00';
  assert.ok(checkReservation(data, false).errors.reservation_time, 'calamba is not open at 9');
});

test('occasion and allergies are optional but limited in length', () => {
  const data = goodData();
  data.occasion = ''; data.allergies = '';
  const ok = checkReservation(data, false);
  assert.strictEqual(ok.values.occasion, null);
  assert.strictEqual(ok.values.allergies, null);
  data.occasion = 'x'.repeat(101);
  data.allergies = 'y'.repeat(301);
  const bad = checkReservation(data, false);
  assert.ok(bad.errors.occasion && bad.errors.allergies);
});

test('other requests: more than 500 characters is rejected', () => {
  const data = goodData();
  data.special_requests = 'x'.repeat(501);
  assert.ok(checkReservation(data, false).errors.special_requests);
});

test('missing or strange input does not crash', () => {
  for (const input of [undefined, null, 'text', 42, [], {}]) {
    const result = checkReservation(input, false);
    assert.ok(Object.keys(result.errors).length >= 5);
  }
});

test('the public check ignores a status sent by the customer', () => {
  const data = goodData(); data.status = 'confirmed';
  const result = checkReservation(data, false);
  assert.strictEqual(result.values.status, undefined);
});

test('staff edits: past dates and any time are allowed, status is required and checked', () => {
  const data = goodData();
  data.reservation_date = daysFromToday(-10);
  data.reservation_time = '03:30';
  data.status = 'confirmed';
  assert.deepStrictEqual(checkReservation(data, true).errors, {});
  data.status = 'banana';
  assert.ok(checkReservation(data, true).errors.status);
});

test('calling it without the second argument is treated as a public request (strict)', () => {
  const data = goodData();
  data.reservation_date = daysFromToday(-3);
  assert.ok(checkReservation(data).errors.reservation_date);
});

test('privacy clean-up: the cut-off date is 6 months back', () => {
  assert.strictEqual(monthsBefore('2026-10-24', 6), '2026-04-24');
  assert.strictEqual(monthsBefore('2026-03-15', 6), '2025-09-15');
});
