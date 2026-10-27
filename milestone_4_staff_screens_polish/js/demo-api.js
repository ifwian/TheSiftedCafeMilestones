// demo-api.js  (DEMO ONLY - removed in Milestone 5)
//
// There is no server yet, so this file PRETENDS to be the server, inside the browser.
// It catches every fetch('/api/...') call from our pages and answers it itself.
// The "database" is just a list saved in this browser's localStorage, so a reservation
// made on index.html also shows up in the dashboard (admin.html).
//
// In Milestone 5 we delete this file. The same fetch() calls then go to the REAL
// Express server, and the data goes into MySQL. The pages do not need to change.
//
// Demo staff login:  username  admin   password  demo123


// Everything is inside one function, so our names cannot clash with the page scripts.
(function () {

  // ---------------------------------------------------------------
  // 1. The fake database (a list saved in localStorage)
  // ---------------------------------------------------------------

  var DEMO_KEY = 'siftedDemoReservations';
  var DEMO_SESSION_KEY = 'siftedDemoSignedIn';
  var BRANCH_NAMES = { calamba: 'Calamba', cabuyao: 'Cabuyao' };
  var ALL_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

  // Memory copy, used if localStorage is blocked by the browser
  var memoryList = null;
  var memorySignedIn = false;

  // '2026-10-24' plus 3 days is '2026-10-27'
  function demoDate(daysFromToday) {
    var date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
  }

  // Right now as 'YYYY-MM-DD HH:MM:SS' (the same style MySQL will give us later)
  function demoNow() {
    var date = new Date();
    return demoDate(0) + ' ' + String(date.getHours()).padStart(2, '0') + ':' +
      String(date.getMinutes()).padStart(2, '0') + ':' + String(date.getSeconds()).padStart(2, '0');
  }

  // A few example reservations so the dashboard is not empty at the start
  function sampleReservations() {
    var now = demoNow();
    return [
      { id: 1, customer_name: 'Ana Dela Cruz', phone: '0917 123 4567', email: 'ana@example.com', branch: 'calamba',
        reservation_date: demoDate(2), reservation_time: '12:00', guests: 2, occasion: 'Date night', allergies: null, special_requests: 'Window seat please',
        status: 'pending', admin_notes: null, created_at: now, updated_at: now },
      { id: 2, customer_name: 'Ben Santos', phone: '0918 222 3344', email: null, branch: 'cabuyao',
        reservation_date: demoDate(4), reservation_time: '18:00', guests: 5, occasion: 'Birthday', allergies: 'One guest is allergic to nuts', special_requests: null,
        status: 'confirmed', admin_notes: 'Birthday cake arrives at 6 PM', created_at: now, updated_at: now },
      { id: 3, customer_name: 'Carla Reyes', phone: '0920 555 7788', email: 'carla@example.com', branch: 'calamba',
        reservation_date: demoDate(1), reservation_time: '15:00', guests: 3, occasion: null, allergies: null, special_requests: null,
        status: 'cancelled', admin_notes: null, created_at: now, updated_at: now },
      { id: 4, customer_name: 'Dino Villanueva', phone: '0999 111 2233', email: null, branch: 'cabuyao',
        reservation_date: demoDate(-3), reservation_time: '11:00', guests: 4, occasion: 'Meeting', allergies: null, special_requests: null,
        status: 'completed', admin_notes: null, created_at: now, updated_at: now }
    ];
  }

  function loadList() {
    try {
      var text = localStorage.getItem(DEMO_KEY);
      if (text) {
        return JSON.parse(text);
      }
      var starter = sampleReservations();
      localStorage.setItem(DEMO_KEY, JSON.stringify(starter));
      return starter;
    } catch (error) {
      if (memoryList === null) {
        memoryList = sampleReservations();
      }
      return memoryList;
    }
  }

  function saveList(list) {
    memoryList = list;
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(list));
    } catch (error) {
      // localStorage is blocked: the memory copy is enough for this page visit
    }
  }

  function nextId(list) {
    var biggest = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > biggest) {
        biggest = list[i].id;
      }
    }
    return biggest + 1;
  }


  // ---------------------------------------------------------------
  // 2. Helpers
  // ---------------------------------------------------------------

  // 12 becomes 'SC-00012'
  function makeReference(id) {
    return 'SC-' + String(id).padStart(5, '0');
  }

  // The shape of one reservation that the pages expect (same as the real server will send)
  function toApi(row) {
    var copy = Object.assign({}, row);
    copy.reference = makeReference(row.id);
    copy.branch_name = BRANCH_NAMES[row.branch] || row.branch;
    return copy;
  }

  // A fake server answer
  function answer(status, data) {
    return new Response(JSON.stringify(data), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // The demo checks the cafe's main rules. The REAL server (Milestone 5) checks everything again.
  //   Customers: 2 to 10 guests, email required, at least 1 day notice, hourly times inside the branch hours.
  //   Staff edits: 1 to 20 guests, any date and time.
  var BRANCH_HOURS = { calamba: [10, 21], cabuyao: [9, 20] };   // first and last request hour (the last is 1 hour before closing)

  function basicErrors(data, isStaff) {
    var errors = {};
    var needed = ['customer_name', 'phone', 'branch', 'guests', 'reservation_date', 'reservation_time'];
    if (isStaff === false) {
      needed.push('email');
    }
    for (var i = 0; i < needed.length; i++) {
      var value = data[needed[i]];
      if (String(value === undefined || value === null ? '' : value).trim() === '') {
        errors[needed[i]] = 'This field is required.';
      }
    }
    var guests = Number(data.guests);
    var minGuests = isStaff ? 1 : 2;
    var maxGuests = isStaff ? 20 : 10;
    if (errors.guests === undefined && (Number.isInteger(guests) === false || guests < minGuests || guests > maxGuests)) {
      errors.guests = isStaff ? 'Guests must be between 1 and 20.' : 'Online reservations are for 2 to 10 guests. For larger groups, please call or message the cafe.';
    }
    if (errors.branch === undefined && BRANCH_NAMES[data.branch] === undefined) {
      errors.branch = 'Please choose a branch.';
    }
    if (isStaff === false && errors.reservation_date === undefined && String(data.reservation_date) < demoDate(1)) {
      errors.reservation_date = 'We need at least 1 day notice. Please choose tomorrow or a later date.';
    }
    if (isStaff === false && errors.reservation_time === undefined && errors.branch === undefined) {
      var hour = Number(String(data.reservation_time).slice(0, 2));
      var minutes = String(data.reservation_time).slice(3, 5);
      if (minutes !== '00' || hour < BRANCH_HOURS[data.branch][0] || hour > BRANCH_HOURS[data.branch][1]) {
        errors.reservation_time = 'Please pick one of the listed times for this branch (every hour while open).';
      }
    }
    return errors;
  }

  function isSignedIn() {
    try {
      return localStorage.getItem(DEMO_SESSION_KEY) === 'yes';
    } catch (error) {
      return memorySignedIn;
    }
  }

  function setSignedIn(value) {
    memorySignedIn = value;
    try {
      if (value) {
        localStorage.setItem(DEMO_SESSION_KEY, 'yes');
      } else {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    } catch (error) {
      // blocked: the memory copy is used
    }
  }


  // ---------------------------------------------------------------
  // 3. The fake server: one function that answers every /api address
  // ---------------------------------------------------------------

  function handleRequest(method, path, query, data) {
    var list = loadList();

    // ----- Customers: send a reservation request -----
    if (method === 'POST' && path === '/api/reservations') {
      var errors = basicErrors(data, false);
      if (Object.keys(errors).length > 0) {
        return answer(400, { error: 'Please fix the highlighted fields.', errors: errors });
      }
      var row = {
        id: nextId(list),
        customer_name: String(data.customer_name).trim(),
        phone: String(data.phone).trim(),
        email: String(data.email || '').trim() || null,
        branch: data.branch,
        reservation_date: data.reservation_date,
        reservation_time: String(data.reservation_time).slice(0, 5),
        guests: Number(data.guests),
        occasion: String(data.occasion || '').trim() || null,
        allergies: String(data.allergies || '').trim() || null,
        special_requests: String(data.special_requests || '').trim() || null,
        status: 'pending',          // new requests always start as pending
        admin_notes: null,
        created_at: demoNow(),
        updated_at: demoNow()
      };
      list.push(row);
      saveList(list);
      var made = toApi(row);
      return answer(201, {
        message: 'Your reservation request has been received. It is NOT confirmed yet: our team will contact you to confirm. If you are late, we hold your table for 15 minutes.',
        reservation: {
          reference: made.reference, customer_name: made.customer_name, branch_name: made.branch_name,
          reservation_date: made.reservation_date, reservation_time: made.reservation_time,
          guests: made.guests, status: made.status
        }
      });
    }

    // ----- Staff: sign in and out -----
    if (method === 'POST' && path === '/api/login') {
      if (data.username === 'admin' && data.password === 'demo123') {
        setSignedIn(true);
        return answer(200, { username: 'admin' });
      }
      return answer(401, { error: 'Invalid username or password.' });
    }
    if (method === 'POST' && path === '/api/logout') {
      setSignedIn(false);
      return answer(200, { message: 'Signed out.' });
    }
    if (method === 'GET' && path === '/api/me') {
      if (isSignedIn()) {
        return answer(200, { username: 'admin' });
      }
      return answer(401, { error: 'Please sign in.' });
    }

    // Everything below is for signed-in staff only
    if (path.indexOf('/api/admin/') === 0 && isSignedIn() === false) {
      return answer(401, { error: 'Please sign in.' });
    }

    // ----- Staff: the counts -----
    if (method === 'GET' && path === '/api/admin/summary') {
      var summary = { total: list.length };
      for (var s = 0; s < ALL_STATUSES.length; s++) {
        summary[ALL_STATUSES[s]] = 0;
      }
      for (var i = 0; i < list.length; i++) {
        summary[list[i].status] = summary[list[i].status] + 1;
      }
      return answer(200, { summary: summary });
    }

    // ----- Staff: the list, with search, filters and sorting -----
    if (method === 'GET' && path === '/api/admin/reservations') {
      var search = (query.get('search') || '').toLowerCase();
      var found = [];
      for (var j = 0; j < list.length; j++) {
        var r = list[j];
        var text = (r.customer_name + ' ' + r.phone + ' ' + (r.email || '') + ' ' + makeReference(r.id)).toLowerCase();
        if (search !== '' && text.indexOf(search) === -1) { continue; }
        if (query.get('status') && r.status !== query.get('status')) { continue; }
        if (query.get('branch') && r.branch !== query.get('branch')) { continue; }
        if (query.get('dateFrom') && r.reservation_date < query.get('dateFrom')) { continue; }
        if (query.get('dateTo') && r.reservation_date > query.get('dateTo')) { continue; }
        found.push(r);
      }
      var sort = query.get('sort') || 'newest';
      found.sort(function (a, b) {
        if (sort === 'upcoming') {
          return (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time);
        }
        if (sort === 'latest_date') {
          return (b.reservation_date + b.reservation_time).localeCompare(a.reservation_date + a.reservation_time);
        }
        return b.id - a.id;   // newest requests first
      });
      return answer(200, { reservations: found.map(toApi) });
    }

    // ----- Staff: one reservation (/api/admin/reservations/12), and changing it -----
    var match = /^\/api\/admin\/reservations\/(\d+)(\/status)?$/.exec(path);
    if (match) {
      var id = Number(match[1]);
      var position = -1;
      for (var k = 0; k < list.length; k++) {
        if (list[k].id === id) { position = k; }
      }
      if (position === -1) {
        return answer(404, { error: 'Reservation not found.' });
      }

      if (method === 'GET') {
        return answer(200, { reservation: toApi(list[position]) });
      }

      if (method === 'PATCH' && match[2]) {            // change only the status
        if (ALL_STATUSES.indexOf(data.status) === -1) {
          return answer(400, { error: 'Unknown status.' });
        }
        list[position].status = data.status;
        list[position].updated_at = demoNow();
        saveList(list);
        return answer(200, { reservation: toApi(list[position]) });
      }

      if (method === 'PUT') {                          // edit all the details
        var editErrors = basicErrors(data, true);
        if (ALL_STATUSES.indexOf(data.status) === -1) {
          editErrors.status = 'Please choose a status.';
        }
        if (Object.keys(editErrors).length > 0) {
          return answer(400, { error: 'Please fix the highlighted fields.', errors: editErrors });
        }
        var names = ['customer_name', 'phone', 'email', 'branch', 'guests', 'reservation_date',
          'reservation_time', 'status', 'occasion', 'allergies', 'special_requests', 'admin_notes'];
        for (var n = 0; n < names.length; n++) {
          var value = data[names[n]];
          list[position][names[n]] = (value === '' || value === undefined) ? null : value;
        }
        list[position].customer_name = String(data.customer_name).trim();
        list[position].phone = String(data.phone).trim();
        list[position].guests = Number(data.guests);
        list[position].reservation_time = String(data.reservation_time).slice(0, 5);
        list[position].updated_at = demoNow();
        saveList(list);
        return answer(200, { reservation: toApi(list[position]) });
      }

      if (method === 'DELETE') {                       // remove it
        list.splice(position, 1);
        saveList(list);
        return answer(200, { message: 'Reservation deleted.' });
      }
    }

    return answer(404, { error: 'Not found.' });
  }


  // ---------------------------------------------------------------
  // 4. Plug it in: replace fetch() for /api addresses only
  // ---------------------------------------------------------------

  var realFetch = window.fetch;

  window.fetch = function (url, options) {
    if (typeof url === 'string' && url.indexOf('/api/') === 0) {
      var settings = options || {};
      var parts = url.split('?');
      var data = {};
      if (settings.body) {
        data = JSON.parse(settings.body);
      }
      var method = settings.method || 'GET';
      // wait a moment, like a real server would, then answer
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(handleRequest(method, parts[0], new URLSearchParams(parts[1] || ''), data));
        }, 250);
      });
    }
    return realFetch.apply(window, arguments);
  };


  // ---------------------------------------------------------------
  // 5. A small label so everybody knows this is a demo
  // ---------------------------------------------------------------

  window.addEventListener('DOMContentLoaded', function () {
    var label = document.createElement('div');
    var text = 'DEMO MODE: no real server yet. Data stays in this browser only.';
    text = text + ' Staff login: admin / demo123';
    label.textContent = text;
    label.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;max-width:340px;padding:6px 10px;' +
      'background:#ffcd00;color:#121c5e;font:600 12px/1.3 sans-serif;border:2px solid #121c5e;border-radius:8px;';
    document.body.append(label);
  });

})();
