// server.js
// The Sifted Cafe web server (MILESTONE 5: server and database).
// This ONE file:
//   1. shows the website (the public/ folder),
//   2. checks reservation requests and saves them in MySQL (status = pending).
// Staff login and the dashboard come in Milestones 6 and 7.
//
// Start it with:  npm start
//
// The file is in parts. Read them from top to bottom:
//   1. Settings          5. Public route (Create)
//   2. Database          6. Unknown API addresses
//   3. Helper functions  7. Website pages and errors
//   4. Checking input    8. Start the server

require('dotenv').config();

var path = require('path');
var express = require('express');
var mysql = require('mysql2/promise');


// ---------------------------------------------------------------
// 1. Settings
// ---------------------------------------------------------------

// The fixed lists (hardcoded on purpose, so they are easy to read and explain).
var BRANCHES = {
  calamba: 'Calamba',
  cabuyao: 'Cabuyao'
};
var STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

// Opening hours of each branch, in 24-hour numbers (confirmed by the Calamba manager, 10/15/2026):
//   Calamba 10:00 AM to 10:00 PM,  Cabuyao 9:00 AM to 9:00 PM, every day.
var BRANCH_HOURS = {
  calamba: { open: 10, close: 22 },
  cabuyao: { open: 9, close: 21 }
};
var LAST_BOOKING_HOURS_BEFORE_CLOSING = 1;   // not answered in the interview: we assume 1 hour until the owner says otherwise

// Request times are EVERY HOUR. This makes the list for one branch, for example
// Calamba: ['10:00', '11:00', ... '21:00'].
function makeSlots(branch) {
  var hours = BRANCH_HOURS[branch];
  var slots = [];
  for (var hour = hours.open; hour <= hours.close - LAST_BOOKING_HOURS_BEFORE_CLOSING; hour++) {
    slots.push((hour < 10 ? '0' : '') + hour + ':00');
  }
  return slots;
}
var SLOTS = { calamba: makeSlots('calamba'), cabuyao: makeSlots('cabuyao') };
var ALL_SLOTS = SLOTS.calamba.concat(SLOTS.cabuyao);   // used only if the branch itself is wrong

var MIN_GUESTS = 2;                 // online groups are 2 to 10 guests (staff may enter 1 to 20)
var MAX_GUESTS = 10;
var STAFF_MIN_GUESTS = 1;
var STAFF_MAX_GUESTS = 20;
var SLOT_CAPACITY = 20;             // each branch can seat 20 guests at the same time slot
var MIN_DAYS_AHEAD = 1;             // at least 1 day notice: no same-day reservations
var MAX_DAYS_AHEAD = 60;            // how far ahead: not answered in the interview, so we assume 60 days until the owner says otherwise
var HOLD_MINUTES = 15;              // a late customer's table is held for 15 minutes
var RETENTION_MONTHS = process.env.RETENTION_MONTHS === undefined ? 6 : Number(process.env.RETENTION_MONTHS);
                                    // old records are deleted after 6 months (0 = never delete)
var TIME_ZONE = 'Asia/Manila';      // what "today" means for the cafe


// ---------------------------------------------------------------
// 2. Database (MySQL)
// ---------------------------------------------------------------

// A "pool" keeps a few connections open and lends one to each query.
// The password comes from the .env file.
var pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sifted_cafe_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true   // give DATE columns back as text like '2026-10-20'
});

// Runs any SQL. The "?" marks are filled in by the driver from the "values" list,
// so what a visitor types can never become part of the SQL (this stops SQL injection).
// For SELECT it gives back the rows. For INSERT / UPDATE / DELETE it gives back
// an object with insertId and affectedRows.
async function runSql(sql, values) {
  var result = await pool.execute(sql, values || []);
  return result[0];
}

var COLUMNS = 'id, customer_name, phone, email, branch, reservation_date, reservation_time, ' +
  'guests, occasion, allergies, special_requests, status, admin_notes, created_at, updated_at';


// ---------------------------------------------------------------
// 3. Helper functions
// ---------------------------------------------------------------

// 12 becomes 'SC-00012'
function makeReference(id) {
  var text = String(id);
  while (text.length < 5) {
    text = '0' + text;
  }
  return 'SC-' + text;
}

// Turns a database row into the object we send to the browser.
function toApi(row) {
  return {
    id: row.id,
    reference: makeReference(row.id),
    customer_name: row.customer_name,
    phone: row.phone,
    email: row.email,
    branch: row.branch,
    branch_name: BRANCHES[row.branch] || row.branch,
    reservation_date: row.reservation_date,
    reservation_time: String(row.reservation_time).slice(0, 5),   // '19:00:00' becomes '19:00'
    guests: row.guests,
    occasion: row.occasion,
    allergies: row.allergies,
    special_requests: row.special_requests,
    status: row.status,
    admin_notes: row.admin_notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Gets one reservation row (or null if it does not exist).
async function findReservation(id) {
  var rows = await runSql('SELECT ' + COLUMNS + ' FROM reservations WHERE id = ?', [id]);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

// What is today's date at the cafe? Gives { date: '2026-10-24' }
function getCafeNow() {
  var formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var parts = formatter.formatToParts(new Date());
  var pieces = {};
  for (var i = 0; i < parts.length; i++) {
    pieces[parts[i].type] = parts[i].value;
  }
  return { date: pieces.year + '-' + pieces.month + '-' + pieces.day };
}

// '2026-10-24' plus 5 days becomes '2026-10-29'
function addDays(dateText, days) {
  var parts = dateText.split('-');
  var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + days));
  return date.toISOString().slice(0, 10);
}

// '2026-10-24' minus 6 months becomes '2026-04-24'
function monthsBefore(dateText, months) {
  var parts = dateText.split('-');
  var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1 - months, Number(parts[2])));
  return date.toISOString().slice(0, 10);
}

// True only for real dates. '2026-02-31' is rejected.
function isRealDate(text) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) {
    return false;
  }
  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  // JavaScript moves Feb 31 to March 3, so the numbers would not match any more.
  var date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Removes spaces at the start and end. Anything that is not text becomes ''.
function cleanText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}


// ---------------------------------------------------------------
// 4. Checking input (server-side validation)
// ---------------------------------------------------------------
// The browser (public/js/app.js) checks the form too, but only to be friendly.
// Anyone can skip the browser, so THIS is the check we trust.

// Checks a reservation. Gives back { errors, values }.
//   errors - one message for each bad field, like { phone: 'Please enter a contact number.' }
//   values - the cleaned data, ready for the database
// When isStaff is true (a staff edit), a few rules are relaxed: the date may be in the past
// and the time may be any time, and the email may be empty. Staff also set the status and the private notes.
function checkReservation(data, isStaff) {
  var errors = {};
  var values = {};
  isStaff = (isStaff === true);   // if nobody says "staff", it is a public request (strict rules)
  if (!data || typeof data !== 'object') {
    data = {};
  }
  var now = getCafeNow();

  // --- Name ---
  var name = cleanText(data.customer_name);
  if (name === '') {
    errors.customer_name = 'Please enter your name.';
  } else if (name.length < 2) {
    errors.customer_name = 'Name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.customer_name = 'Name must be 100 characters or fewer.';
  } else if (/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name) === false) {
    errors.customer_name = 'Name can only contain letters, spaces, apostrophes, periods and hyphens.';
  } else {
    values.customer_name = name;
  }

  // --- Phone ---
  var phone = cleanText(data.phone);
  var digits = phone.replace(/\D/g, '');
  if (phone === '') {
    errors.phone = 'Please enter a contact number.';
  } else if (/^\+?[0-9\s\-()]+$/.test(phone) === false || phone.length > 20) {
    errors.phone = 'Contact number can only contain digits, spaces, + - ( ).';
  } else if (digits.length < 7 || digits.length > 15) {
    errors.phone = 'Contact number must have between 7 and 15 digits.';
  } else {
    values.phone = phone;
  }

  // --- Email (required for customers, because we confirm by email; staff edits may leave it empty) ---
  var email = cleanText(data.email);
  if (email === '' && isStaff) {
    values.email = null;
  } else if (email === '') {
    errors.email = 'Please enter your email address. We use it to confirm your reservation.';
  } else if (email.length > 254 || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) === false) {
    errors.email = 'Please enter a valid email address.';
  } else {
    values.email = email.toLowerCase();
  }

  // --- Branch ---
  var branch = cleanText(data.branch);
  if (BRANCHES[branch] === undefined) {
    errors.branch = 'Please choose a branch.';
  } else {
    values.branch = branch;
  }

  // --- Guests ---
  var guestsText = '';
  if (data.guests !== undefined && data.guests !== null) {
    guestsText = String(data.guests).trim();
  }
  var guests = Number(guestsText);
  var minGuests = isStaff ? STAFF_MIN_GUESTS : MIN_GUESTS;
  var maxGuests = isStaff ? STAFF_MAX_GUESTS : MAX_GUESTS;
  if (guestsText === '') {
    errors.guests = 'Please enter the number of guests.';
  } else if (Number.isInteger(guests) === false) {
    errors.guests = 'Number of guests must be a whole number.';
  } else if (guests < minGuests || guests > maxGuests) {
    if (isStaff) {
      errors.guests = 'Guests must be between ' + minGuests + ' and ' + maxGuests + '.';
    } else {
      errors.guests = 'Online reservations are for ' + minGuests + ' to ' + maxGuests + ' guests. For larger groups, please call or message the cafe.';
    }
  } else {
    values.guests = guests;
  }

  // --- Date ---
  var date = cleanText(data.reservation_date);
  if (date === '') {
    errors.reservation_date = 'Please choose a date.';
  } else if (isRealDate(date) === false) {
    errors.reservation_date = 'Please choose a valid date.';
  } else if (isStaff === false && date < addDays(now.date, MIN_DAYS_AHEAD)) {
    errors.reservation_date = 'We need at least 1 day notice. Please choose tomorrow or a later date.';
  } else if (isStaff === false && date > addDays(now.date, MAX_DAYS_AHEAD)) {
    errors.reservation_date = 'Reservations can be requested up to ' + MAX_DAYS_AHEAD + ' days ahead.';
  } else {
    values.reservation_date = date;
  }

  // --- Time ---
  var time = cleanText(data.reservation_time).slice(0, 5);   // '19:00' (also accepts '19:00:00')
  if (time === '') {
    errors.reservation_time = 'Please choose a time.';
  } else if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time) === false) {
    errors.reservation_time = 'Please choose a valid time.';
  } else if (isStaff === false && values.branch !== undefined && SLOTS[values.branch].includes(time) === false) {
    errors.reservation_time = 'Please pick one of the listed times for this branch (every hour while open).';
  } else if (isStaff === false && values.branch === undefined && ALL_SLOTS.includes(time) === false) {
    errors.reservation_time = 'Please pick one of the listed times.';
  } else {
    values.reservation_time = time + ':00';   // MySQL TIME looks like HH:MM:SS
  }

  // --- Occasion (optional): birthday, meeting... ---
  var occasion = cleanText(data.occasion);
  if (occasion.length > 100) {
    errors.occasion = 'Occasion must be 100 characters or fewer.';
  } else {
    values.occasion = occasion === '' ? null : occasion;
  }

  // --- Allergies or special needs (optional) ---
  var allergies = cleanText(data.allergies);
  if (allergies.length > 300) {
    errors.allergies = 'Allergies or special needs must be 300 characters or fewer.';
  } else {
    values.allergies = allergies === '' ? null : allergies;
  }

  // --- Special requests (optional) ---
  var requests = cleanText(data.special_requests);
  if (requests.length > 500) {
    errors.special_requests = 'Special requests must be 500 characters or fewer.';
  } else if (requests === '') {
    values.special_requests = null;
  } else {
    values.special_requests = requests;
  }

  // --- Only for staff edits: status and private notes ---
  if (isStaff) {
    var status = cleanText(data.status);
    if (STATUSES.includes(status) === false) {
      errors.status = 'Status must be one of: ' + STATUSES.join(', ') + '.';
    } else {
      values.status = status;
    }

    var notes = cleanText(data.admin_notes);
    if (notes.length > 1000) {
      errors.admin_notes = 'Notes must be 1000 characters or fewer.';
    } else if (notes === '') {
      values.admin_notes = null;
    } else {
      values.admin_notes = notes;
    }
  }

  return { errors: errors, values: values };
}


// ---------------------------------------------------------------
// The Express app: security headers, JSON, and the "fetch" header check
// ---------------------------------------------------------------

var app = express();
app.disable('x-powered-by');   // do not tell visitors we use Express

// Basic security headers for every answer.
app.use(function (req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');            // the browser must not guess file types
  res.set('X-Frame-Options', 'DENY');                      // our pages cannot be shown inside another site
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Scripts and styles may only come from our own site (plus Google Fonts for the fonts).
  res.set('Content-Security-Policy',
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; script-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");
  next();
});

app.use(express.json({ limit: '20kb' }));   // read JSON from the browser (maximum 20 KB)

// Every request that CHANGES something (POST, PUT, PATCH, DELETE) must carry the header
// "X-Requested-With: fetch". Our own pages always add it. A form on another website cannot,
// so this blocks "cross-site request forgery" (CSRF).
app.use('/api', function (req, res, next) {
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({ error: 'Request blocked: missing security header.' });
  }
  next();
});

// A quick check for troubleshooting: http://localhost:3000/api/health
app.get('/api/health', async function (req, res) {
  try {
    await runSql('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('[health] Cannot reach MySQL: ' + error.message);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});


// How many guests are already booked at this branch, date and time? (pending + confirmed)
async function guestsAlreadyBooked(branch, date, time) {
  var rows = await runSql(
    "SELECT COALESCE(SUM(guests), 0) AS total FROM reservations " +
    "WHERE branch = ? AND reservation_date = ? AND reservation_time = ? AND status IN ('pending', 'confirmed')",
    [branch, date, time]
  );
  return Number(rows[0].total);
}

// ---------------------------------------------------------------
// 5. Public route: CREATE a reservation (customers use this)
// ---------------------------------------------------------------

// A very small limit: at most 10 saved reservations from one address every 15 minutes.
var createLog = {};   // address -> list of times (in milliseconds)

function tooManyRequests(address) {
  var now = Date.now();
  var recent = [];
  var oldList = createLog[address] || [];
  for (var i = 0; i < oldList.length; i++) {
    if (now - oldList[i] < 15 * 60 * 1000) {
      recent.push(oldList[i]);
    }
  }
  createLog[address] = recent;
  if (recent.length >= 10) {
    return true;
  }
  recent.push(now);
  return false;
}

app.post('/api/reservations', async function (req, res, next) {
  try {
    var body = req.body || {};

    // The hidden "website" field is a trap for bots. People never see it, so it must be empty.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return res.status(400).json({ error: 'We could not process this request.' });
    }

    // 1. Check the data
    var result = checkReservation(body, false);
    if (Object.keys(result.errors).length > 0) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', errors: result.errors });
    }
    var v = result.values;

    // 2. Is there room? Each branch seats 20 guests at the same time slot.
    //    Pending and confirmed requests both count, so we never promise the same seats twice.
    var taken = await guestsAlreadyBooked(v.branch, v.reservation_date, v.reservation_time);
    if (taken + v.guests > SLOT_CAPACITY) {
      var seatsLeft = Math.max(0, SLOT_CAPACITY - taken);
      var fullMessage = seatsLeft === 0
        ? 'Sorry, that time is fully booked. Please choose another time or date.'
        : 'Sorry, only ' + seatsLeft + ' seat' + (seatsLeft === 1 ? '' : 's') + ' left at that time. Please choose another time or fewer guests.';
      return res.status(409).json({ error: fullMessage, errors: { reservation_time: fullMessage } });
    }

    // 3. Limit spam (only requests that would really be saved are counted)
    if (tooManyRequests(req.ip)) {
      return res.status(429).json({ error: 'Too many reservation requests from this device. Please wait a few minutes or contact the cafe directly.' });
    }

    // 4. Save it. The status is ALWAYS 'pending' for new requests.
    var saved = await runSql(
      "INSERT INTO reservations (customer_name, phone, email, branch, reservation_date, reservation_time, guests, occasion, allergies, special_requests, status) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [v.customer_name, v.phone, v.email, v.branch, v.reservation_date, v.reservation_time, v.guests, v.occasion, v.allergies, v.special_requests]
    );

    // 5. We only get here if the INSERT worked. Read the row back and answer.
    var row = toApi(await findReservation(saved.insertId));
    res.status(201).json({
      message: 'Your reservation request has been received. It is NOT confirmed yet: our team will contact you to confirm. If you are late, we hold your table for ' + HOLD_MINUTES + ' minutes.',
      reservation: {
        reference: row.reference,
        customer_name: row.customer_name,
        branch_name: row.branch_name,
        reservation_date: row.reservation_date,
        reservation_time: row.reservation_time,
        guests: row.guests,
        status: row.status
      }
    });
  } catch (error) {
    next(error);
  }
});


// ---------------------------------------------------------------
// 6. Unknown API addresses
// ---------------------------------------------------------------

// Any other /api address does not exist
app.use('/api', function (req, res) {
  res.status(404).json({ error: 'Not found.' });
});


// ---------------------------------------------------------------
// 7. Website pages and the error handler
// ---------------------------------------------------------------

var publicFolder = path.join(__dirname, '..', 'public');

// Everything else in public/ (index.html, css, js, assets) is sent as it is.
app.use(express.static(publicFolder));

// This must be the last one. It catches errors from the routes above.
app.use(function (err, req, res, next) {
  // The browser sent something that is not valid JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large.' });
  }

  // Anything else: the details go to the terminal, and the browser gets a safe message.
  console.error('[error] ' + req.method + ' ' + req.originalUrl + ' -> ' + err.message);
  var message = 'Something went wrong on our side. Please try again.';
  var status = 500;
  var databaseDown = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'];
  if (databaseDown.includes(err.code)) {
    status = 503;
    message = 'The reservation system is temporarily unavailable. Please try again later or contact the cafe directly.';
    console.error('        Check that MySQL is running, that database.sql was run, and that .env is correct.');
  }
  res.status(status).json({ error: message });
});


// Old records are deleted after 6 months (the cafe's rule for names and phone numbers).
// The cut-off date is worked out here and sent to MySQL as a "?" value.
async function deleteOldReservations() {
  if (RETENTION_MONTHS <= 0) {
    return 0;
  }
  var cutoff = monthsBefore(getCafeNow().date, RETENTION_MONTHS);
  var result = await runSql('DELETE FROM reservations WHERE reservation_date < ?', [cutoff]);
  if (result.affectedRows > 0) {
    console.log('  Privacy clean-up: deleted ' + result.affectedRows + ' reservation(s) older than ' + RETENTION_MONTHS + ' months.');
  }
  return result.affectedRows;
}


// ---------------------------------------------------------------
// 8. Start the server
// ---------------------------------------------------------------

function start() {
  var port = Number(process.env.PORT) || 3000;
  return app.listen(port, async function () {
    console.log('\nThe Sifted Cafe is running:');
    console.log('  Website: http://localhost:' + port + '/');

    // Test the database. The website still runs if MySQL is down, so we say so clearly.
    try {
      await runSql('SELECT 1');
      console.log('  Database: connected');
      await deleteOldReservations();                          // once now...
      setInterval(function () {                               // ...and once a day while the server runs
        deleteOldReservations().catch(function (error) {
          console.error('  Clean-up problem: ' + error.message);
        });
      }, 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error('\n  !! DATABASE PROBLEM: ' + error.message);
      console.error('  Check that MySQL is running, that database.sql was run, and that .env is correct.\n');
    }
  });
}

// Start only when this file is run directly (npm start).
// The tests load this file too, and they must not start a second server.
if (require.main === module) {
  start();
}

module.exports = { app: app, start: start, checkReservation: checkReservation, monthsBefore: monthsBefore, deleteOldReservations: deleteOldReservations };
