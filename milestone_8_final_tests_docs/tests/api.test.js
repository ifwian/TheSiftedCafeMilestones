// tests/api.test.js
// Integration tests: they talk to a RUNNING server (and so to the real MySQL database).
//
// How to run (two terminals):
//   1. Terminal 1:  npm start
//   2. Terminal 2:  npm run test:api
//
// The tests read the admin login from the same .env values. If your .env is not loaded in
// terminal 2, set them first, for example in PowerShell:
//   $env:ADMIN_USERNAME="admin"; $env:ADMIN_PASSWORD="your_password"; npm run test:api
// Optional: $env:BASE_URL="http://localhost:3000"
//
// The tests create their own reservations (named "Zz Test ...") and delete them at the end.
require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert');

const BASE = process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 3000);
const HEADERS = { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' };
let cookie = '';          // the staff session cookie, after login
const createdIds = [];    // reservations made by these tests (deleted at the end)

function daysFromToday(n) {
  return new Date(Date.now() + n * 24 * 3600 * 1000).toISOString().slice(0, 10);
}
function goodReservation(name) {
  return {
    customer_name: name || 'Zz Test Customer', phone: '0917 555 0101', email: 'zz.test@example.com',
    branch: 'calamba', guests: 3, reservation_date: daysFromToday(7), reservation_time: '14:00',
    occasion: 'Test occasion', allergies: 'None', special_requests: 'automated test'
  };
}
// Sends a request. withCookie = true sends the staff cookie.
async function call(method, url, body, withCookie, extraHeaders) {
  const headers = Object.assign({}, HEADERS, extraHeaders || {});
  if (withCookie && cookie) headers.Cookie = cookie;
  const response = await fetch(BASE + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  let data = null;
  try { data = await response.json(); } catch (e) { /* not JSON */ }
  return { status: response.status, data, headers: response.headers };
}

test('server and database are reachable', async () => {
  let r;
  try {
    r = await call('GET', '/api/health');
  } catch (error) {
    console.log('\n  !! Cannot reach ' + BASE + '\n  !! Start the server FIRST in another terminal (npm start), wait for "Database: connected", then run this test again.\n');
    throw new Error('Server not running at ' + BASE);
  }
  assert.strictEqual(r.status, 200, 'Is the server running (npm start) and MySQL connected?');
  assert.strictEqual(r.data.database, 'connected');
});

test('public pages are served', async () => {
  for (const page of ['/', '/login', '/css/style.css', '/js/app.js']) {
    const response = await fetch(BASE + page);
    assert.strictEqual(response.status, 200, page);
  }
});

test('security headers are present and Express is not advertised', async () => {
  const response = await fetch(BASE + '/');
  assert.ok(response.headers.get('content-security-policy'));
  assert.strictEqual(response.headers.get('x-frame-options'), 'DENY');
  assert.strictEqual(response.headers.get('x-powered-by'), null);
});

test('create: a valid reservation is saved as pending', async () => {
  const r = await call('POST', '/api/reservations', goodReservation('Zz Test Create'));
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.data.reservation.status, 'pending');
  assert.match(r.data.reservation.reference, /^SC-\d{5}$/);
});

test('create: invalid data is refused with per-field errors', async () => {
  const bad = goodReservation(); bad.customer_name = ''; bad.guests = 99; bad.phone = 'abc';
  const r = await call('POST', '/api/reservations', bad);
  assert.strictEqual(r.status, 400);
  assert.ok(r.data.errors.customer_name && r.data.errors.guests && r.data.errors.phone);
});

test('create: the hidden honeypot field blocks bots', async () => {
  const bot = goodReservation(); bot.website = 'http://spam.example';
  assert.strictEqual((await call('POST', '/api/reservations', bot)).status, 400);
});

test('create: a request without the security header is blocked', async () => {
  const response = await fetch(BASE + '/api/reservations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goodReservation())
  });
  assert.strictEqual(response.status, 403);
});

test('create: broken JSON gets a clean 400', async () => {
  const response = await fetch(BASE + '/api/reservations', { method: 'POST', headers: HEADERS, body: '{not json' });
  assert.strictEqual(response.status, 400);
});

test('create: the cafe rules are enforced by the server', async () => {
  const cases = [
    ['1 guest online', { guests: 1 }, 'guests'],
    ['11 guests online', { guests: 11 }, 'guests'],
    ['same-day booking', { reservation_date: daysFromToday(0) }, 'reservation_date'],
    ['no email', { email: '' }, 'email'],
    ['half-hour time', { reservation_time: '14:30' }, 'reservation_time'],
    ['Calamba before opening (9 AM)', { reservation_time: '09:00' }, 'reservation_time'],
    ['Calamba at closing (10 PM)', { reservation_time: '22:00' }, 'reservation_time']
  ];
  for (const [label, change, field] of cases) {
    const r = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Rules'), change));
    assert.strictEqual(r.status, 400, label);
    assert.ok(r.data.errors[field], label + ' should complain about ' + field);
  }
  // Cabuyao opens at 9 AM, so 9:00 is fine there
  const early = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cabuyao'), { branch: 'cabuyao', reservation_time: '09:00' }));
  assert.strictEqual(early.status, 201);
});

test('capacity: a branch seats 20 guests per time slot (pending and confirmed count)', async () => {
  const slot = { reservation_date: daysFromToday(25), reservation_time: '16:00', branch: 'cabuyao' };
  const a = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap A'), slot, { guests: 10 }));
  const b = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap B'), slot, { guests: 8 }));
  assert.strictEqual(a.status, 201);
  assert.strictEqual(b.status, 201);                       // 18 of 20 seats used
  const tooMany = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap C'), slot, { guests: 3 }));
  assert.strictEqual(tooMany.status, 409);                 // 18 + 3 is more than 20
  assert.ok(tooMany.data.errors.reservation_time);
  const fits = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap D'), slot, { guests: 2 }));
  assert.strictEqual(fits.status, 201);                    // exactly 20
  const otherBranch = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap E'), slot, { branch: 'calamba', guests: 5 }));
  assert.strictEqual(otherBranch.status, 201);             // the other branch has its own 20 seats
  const otherTime = await call('POST', '/api/reservations', Object.assign(goodReservation('Zz Test Cap F'), slot, { reservation_time: '17:00', guests: 5 }));
  assert.strictEqual(otherTime.status, 201);               // another time slot is free
});

test('protected: staff routes refuse visitors without a session', async () => {
  assert.strictEqual((await call('GET', '/api/admin/reservations')).status, 401);
  assert.strictEqual((await call('GET', '/api/admin/summary')).status, 401);
  assert.strictEqual((await call('DELETE', '/api/admin/reservations/1')).status, 401);
  assert.strictEqual((await call('GET', '/api/me')).status, 401);
  const page = await fetch(BASE + '/admin', { redirect: 'manual' });
  assert.strictEqual(page.status, 302);
  assert.match(page.headers.get('location'), /\/login/);
});

test('login: a wrong password is refused', async () => {
  const r = await call('POST', '/api/login', { username: 'admin', password: 'definitely-wrong-' + Date.now() });
  assert.strictEqual(r.status, 401);
});

test('login: the right password gives an HttpOnly cookie', async () => {
  const username = process.env.ADMIN_USERNAME, password = process.env.ADMIN_PASSWORD;
  assert.ok(username && password, 'Set ADMIN_USERNAME and ADMIN_PASSWORD (see the comment at the top of this file).');
  const r = await call('POST', '/api/login', { username, password });
  assert.strictEqual(r.status, 200);
  const setCookie = r.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(';')[0];
  assert.strictEqual((await call('GET', '/api/me', undefined, true)).data.username, username);
});

test('read: the list and the summary work for staff', async () => {
  const list = await call('GET', '/api/admin/reservations', undefined, true);
  assert.strictEqual(list.status, 200);
  assert.ok(Array.isArray(list.data.reservations) && list.data.reservations.length >= 1);
  const summary = await call('GET', '/api/admin/summary', undefined, true);
  assert.strictEqual(summary.status, 200);
  assert.strictEqual(summary.data.summary.total >= 1, true);
});

test('read: search and filters narrow the list', async () => {
  const found = await call('GET', '/api/admin/reservations?search=Zz%20Test%20Create&status=pending&branch=calamba', undefined, true);
  assert.ok(found.data.reservations.length >= 1);
  const none = await call('GET', '/api/admin/reservations?search=no-such-person-xyz', undefined, true);
  assert.strictEqual(none.data.reservations.length, 0);
  assert.strictEqual((await call('GET', '/api/admin/reservations?sort=drop-table', undefined, true)).status, 400);
});

test('SQL injection text is treated as plain text', async () => {
  const r = await call('GET', "/api/admin/reservations?search=" + encodeURIComponent("' OR '1'='1"), undefined, true);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.reservations.length, 0);
});

test('update, status change, read one, delete (full CRUD on one reservation)', async () => {
  // Create
  const made = await call('POST', '/api/reservations', goodReservation('Zz Test Crud'));
  assert.strictEqual(made.status, 201);
  const id = Number(made.data.reservation.reference.slice(3));
  createdIds.push(id);

  // Read one
  let one = await call('GET', '/api/admin/reservations/' + id, undefined, true);
  assert.strictEqual(one.data.reservation.customer_name, 'Zz Test Crud');

  // Update (edit)
  const edit = Object.assign(goodReservation('Zz Test Crud Edited'), { guests: 5, status: 'pending', admin_notes: 'edited by test', occasion: 'Meeting', allergies: 'Shellfish' });
  const updated = await call('PUT', '/api/admin/reservations/' + id, edit, true);
  assert.strictEqual(updated.status, 200);
  one = await call('GET', '/api/admin/reservations/' + id, undefined, true);
  assert.strictEqual(one.data.reservation.customer_name, 'Zz Test Crud Edited');
  assert.strictEqual(one.data.reservation.guests, 5);
  assert.strictEqual(one.data.reservation.admin_notes, 'edited by test');
  assert.strictEqual(one.data.reservation.occasion, 'Meeting');
  assert.strictEqual(one.data.reservation.allergies, 'Shellfish');

  // Edit with bad data is refused and changes nothing
  const refused = await call('PUT', '/api/admin/reservations/' + id, Object.assign({}, edit, { guests: 500 }), true);
  assert.strictEqual(refused.status, 400);
  assert.ok(refused.data.errors.guests);

  // Status change
  const confirmed = await call('PATCH', '/api/admin/reservations/' + id + '/status', { status: 'confirmed' }, true);
  assert.strictEqual(confirmed.data.reservation.status, 'confirmed');
  assert.strictEqual((await call('PATCH', '/api/admin/reservations/' + id + '/status', { status: 'banana' }, true)).status, 400);

  // Delete, then it is really gone
  assert.strictEqual((await call('DELETE', '/api/admin/reservations/' + id, undefined, true)).status, 200);
  assert.strictEqual((await call('GET', '/api/admin/reservations/' + id, undefined, true)).status, 404);
  assert.strictEqual((await call('DELETE', '/api/admin/reservations/' + id, undefined, true)).status, 404);
  createdIds.pop();
});

test('bad ids are refused', async () => {
  assert.strictEqual((await call('GET', '/api/admin/reservations/abc', undefined, true)).status, 400);
  assert.strictEqual((await call('GET', '/api/admin/reservations/99999999', undefined, true)).status, 404);
});

test('logout ends the session', async () => {
  assert.strictEqual((await call('POST', '/api/logout', undefined, true)).status, 200);
  assert.strictEqual((await call('GET', '/api/admin/reservations', undefined, true)).status, 401);
});

// Clean up: sign in again and delete the reservations the tests made ("Zz Test ...").
test.after(async () => {
  try {
    const login = await call('POST', '/api/login', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
    cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const list = await call('GET', '/api/admin/reservations?search=Zz%20Test', undefined, true);
    for (const row of (list.data && list.data.reservations) || []) {
      if (row.customer_name.startsWith('Zz Test')) await call('DELETE', '/api/admin/reservations/' + row.id, undefined, true);
    }
    await call('POST', '/api/logout', undefined, true);
  } catch (e) { console.log('Cleanup skipped:', e.message); }
});
