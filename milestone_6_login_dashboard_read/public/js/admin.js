// admin.js
// The staff dashboard (admin.html), READ-ONLY version (MILESTONE 6).
// Staff can see, search, filter and view reservations.
// Edit, status change and delete are added in Milestone 7.
//
// Safety note: text that customers typed is always put on the page with textContent,
// never innerHTML, so it can never run as HTML or script.
//
// The file has 5 parts:
//   1. Settings and helper functions
//   2. Starting the page
//   3. Summary cards
//   4. The reservation list (READ)
//   5. View details


// ---------------------------------------------------------------
// 1. Settings and helper functions
// ---------------------------------------------------------------

// The words shown for each status
var STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show'
};

// Things the page remembers while it is open
var currentReservation = null;     // the reservation shown in the detail window
var latestLoadNumber = 0;          // used to ignore old answers (see loadList)
var searchTimer = null;            // used to wait until the staff stops typing

// Short name for document.getElementById
function byId(id) {
  return document.getElementById(id);
}

// Makes a new element. className and text are optional (use '' to skip them).
function makeElement(tag, className, text) {
  var element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;   // textContent is safe: it never runs HTML
  }
  return element;
}

// Makes a button that runs onClick when it is clicked.
function makeButton(text, className, onClick) {
  var button = makeElement('button', className, text);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

// '2026-10-20' becomes 'Tue, Oct 20, 2026'
function formatDateShort(dateText) {
  var parts = dateText.split('-');
  var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
}

// '19:00' becomes '7:00 PM'
function formatTime12(timeText) {
  var hour = Number(timeText.slice(0, 2));
  var minute = timeText.slice(3, 5);
  var suffix = 'AM';
  if (hour >= 12) {
    suffix = 'PM';
  }
  var hour12 = hour % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  return hour12 + ':' + minute + ' ' + suffix;
}

// A small colored label for a status, like "Pending"
function makeStatusBadge(status) {
  return makeElement('span', 'badge badge-' + status, STATUS_LABELS[status] || status);
}

// Shows a small message in the corner that disappears after a few seconds.
function showToast(message, kind) {
  var box = makeElement('div', 'toast alert alert-' + (kind || 'success'), message);
  byId('toasts').append(box);
  setTimeout(function () {
    box.remove();
  }, 5000);
}

// Sends a request to the server and gives back the answer as an object.
//   askServer('GET', '/api/admin/summary')
//   askServer('PUT', '/api/admin/reservations/12', { ...the new details... })
// If the server says "error", this function throws an error with .status and .fieldErrors.
// If the server says 401 (not signed in), the browser goes to the login page.
async function askServer(method, url, body) {
  var options = {
    method: method,
    headers: { 'Accept': 'application/json', 'X-Requested-With': 'fetch' }
  };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  var response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    var offline = new Error('Could not reach the server. Please check that it is running.');
    offline.status = 0;
    offline.fieldErrors = {};
    throw offline;
  }

  var data = {};
  try {
    data = await response.json();
  } catch (parseError) {
    // The answer was not JSON. data stays empty.
  }

  if (response.status === 401) {
    window.location.href = '/login';   // the session ended: sign in again
  }
  if (response.ok === false) {
    var error = new Error(data.error || 'Something went wrong.');
    error.status = response.status;
    error.fieldErrors = data.errors || {};
    throw error;
  }
  return data;
}


// ---------------------------------------------------------------
// 2. Starting the page
// ---------------------------------------------------------------

// The server only sends this page to signed-in staff, but we ask again
// to find out the username (and to be sure the session has not ended).
async function startPage() {
  try {
    var me = await askServer('GET', '/api/me');
    byId('admin-username').textContent = me.username;
    refreshAll();
  } catch (error) {
    byId('list-status').textContent = error.message;
  }
}

// Reloads the summary cards and the list.
function refreshAll() {
  loadSummary();
  loadList();
}

byId('logout-button').addEventListener('click', async function () {
  try {
    await askServer('POST', '/api/logout');
    window.location.href = '/login';
  } catch (error) {
    showToast('Could not sign out: ' + error.message, 'error');
  }
});


// ---------------------------------------------------------------
// 3. Summary cards (the counts at the top)
// ---------------------------------------------------------------

// Makes one clickable card. Clicking it shows only that status in the list.
function makeSummaryCard(status, label, count, isActive) {
  var card = makeButton('', 'summary-card', function () {
    byId('f-status').value = status;
    onFilterChange();
  });
  card.setAttribute('aria-pressed', String(isActive));
  card.append(makeElement('span', 'summary-count', String(count)));
  card.append(makeElement('span', 'summary-label', label));
  return card;
}

async function loadSummary() {
  try {
    var data = await askServer('GET', '/api/admin/summary');
    var activeStatus = byId('f-status').value;

    var cards = [makeSummaryCard('', 'All', data.summary.total, activeStatus === '')];
    var statuses = Object.keys(STATUS_LABELS);
    for (var i = 0; i < statuses.length; i++) {
      cards.push(makeSummaryCard(statuses[i], STATUS_LABELS[statuses[i]], data.summary[statuses[i]], activeStatus === statuses[i]));
    }
    byId('summary').replaceChildren(...cards);
  } catch (error) {
    byId('summary').replaceChildren(makeElement('p', 'field-error', 'Could not load the counts.'));
  }
}


// ---------------------------------------------------------------
// 4. The reservation list (the READ part of CRUD)
// ---------------------------------------------------------------

// Builds the filter text for the address, for example: search=ana&status=pending&sort=newest
function buildQuery() {
  var params = new URLSearchParams();
  var filters = {
    search: byId('f-search').value.trim(),
    status: byId('f-status').value,
    branch: byId('f-branch').value,
    dateFrom: byId('f-from').value,
    dateTo: byId('f-to').value
  };
  var names = Object.keys(filters);
  for (var i = 0; i < names.length; i++) {
    if (filters[names[i]] !== '') {   // only send the filters that have a value
      params.set(names[i], filters[names[i]]);
    }
  }
  params.set('sort', byId('f-sort').value);
  return params.toString();
}

// True if at least one filter is being used
function isFiltering() {
  return byId('f-search').value.trim() !== '' || byId('f-status').value !== '' ||
    byId('f-branch').value !== '' || byId('f-from').value !== '' || byId('f-to').value !== '';
}

// Asks the server for the reservations and shows them.
async function loadList() {
  // Every load gets a number. If a newer load starts while this one is waiting,
  // the old answer is ignored. So a slow, old answer can never replace a newer one.
  latestLoadNumber = latestLoadNumber + 1;
  var myNumber = latestLoadNumber;

  byId('list-status').textContent = 'Loading reservations...';
  try {
    var data = await askServer('GET', '/api/admin/reservations?' + buildQuery());
    if (myNumber !== latestLoadNumber) {
      return;   // a newer search already took over
    }
    showRows(data.reservations);

    var total = data.reservations.length;
    if (total === 0) {
      byId('list-status').textContent = '';
    } else if (total === 1) {
      byId('list-status').textContent = '1 reservation found';
    } else {
      byId('list-status').textContent = total + ' reservations found';
    }
  } catch (error) {
    if (myNumber !== latestLoadNumber) {
      return;
    }
    showMessageRow(
      makeElement('p', '', 'We could not load the reservations. ' + error.message),
      makeButton('Try again', 'btn btn-primary btn-small', loadList)
    );
    byId('list-status').textContent = '';
  }
}

// Puts a message in the table instead of rows, for example "No reservations yet".
function showMessageRow(firstContent, secondContent) {
  var cell = makeElement('td', 'table-message');
  cell.setAttribute('colspan', '8');
  cell.append(firstContent);
  if (secondContent) {
    cell.append(secondContent);
  }
  var row = makeElement('tr', 'message-row');
  row.append(cell);
  byId('reservations-body').replaceChildren(row);
}

// Makes one table cell. label is the column name (shown on phones).
function makeCell(label, text) {
  var cell = makeElement('td', '', text);
  cell.setAttribute('data-label', label);
  return cell;
}

// Makes one table row for one reservation.
function makeRow(r) {
  var row = makeElement('tr');
  var who = r.reference + ' for ' + r.customer_name;   // read out by screen readers

  var refCell = makeCell('Ref', r.reference);
  refCell.className = 'ref';
  row.append(refCell);

  var guestCell = makeCell('Guest');
  guestCell.append(makeElement('strong', '', r.customer_name));
  guestCell.append(makeElement('span', 'sub', r.phone));
  row.append(guestCell);

  var dateCell = makeCell('Date and time');
  dateCell.append(formatDateShort(r.reservation_date));
  dateCell.append(makeElement('span', 'sub', formatTime12(r.reservation_time)));
  row.append(dateCell);

  row.append(makeCell('Guests', String(r.guests)));
  row.append(makeCell('Branch', r.branch_name));

  var statusCell = makeCell('Status');
  statusCell.append(makeStatusBadge(r.status));
  row.append(statusCell);

  row.append(makeCell('Requested', r.created_at.slice(0, 16)));   // 'YYYY-MM-DD HH:MM'

  // The three buttons: View, Edit, Delete
  var viewButton = makeButton('View', 'btn btn-outline btn-small', function () {
    openDetail(r.id);
  });
  viewButton.setAttribute('aria-label', 'View ' + who);

  var buttonBox = makeElement('div', 'row-actions');
  buttonBox.append(viewButton);
  var actionsCell = makeCell('Actions');
  actionsCell.append(buttonBox);
  row.append(actionsCell);

  return row;
}

// Fills the table with the reservations.
function showRows(reservations) {
  if (reservations.length === 0) {
    if (isFiltering()) {
      showMessageRow(
        makeElement('p', '', 'No reservations match these filters.'),
        makeButton('Clear filters', 'btn btn-outline btn-small', clearFilters)
      );
    } else {
      showMessageRow(makeElement('p', '', 'No reservations yet. New requests from the website will appear here.'));
    }
    return;
  }

  var rows = [];
  for (var i = 0; i < reservations.length; i++) {
    rows.push(makeRow(reservations[i]));
  }
  byId('reservations-body').replaceChildren(...rows);
}

// A filter changed: reload the list and the cards.
function onFilterChange() {
  loadList();
  loadSummary();
}

// Search while typing, but wait 0.3 seconds after the last key,
// so we do not send a request for every single letter.
byId('f-search').addEventListener('input', function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(onFilterChange, 300);
});

// The other filters reload the list as soon as they change.
var filterIds = ['f-status', 'f-branch', 'f-from', 'f-to', 'f-sort'];
for (var f = 0; f < filterIds.length; f++) {
  byId(filterIds[f]).addEventListener('change', onFilterChange);
}

function clearFilters() {
  byId('f-search').value = '';
  byId('f-status').value = '';
  byId('f-branch').value = '';
  byId('f-from').value = '';
  byId('f-to').value = '';
  byId('f-sort').value = 'newest';
  onFilterChange();
}
byId('f-clear').addEventListener('click', clearFilters);
byId('filters').addEventListener('submit', function (event) {
  event.preventDefault();
});


// ---------------------------------------------------------------
// 5. View details
// ---------------------------------------------------------------

// Opens the detail window and loads one reservation from the server.
async function openDetail(id) {
  var dialog = byId('detail-dialog');
  currentReservation = null;
  byId('detail-title').textContent = 'Reservation';
  byId('detail-body').replaceChildren(makeElement('p', '', 'Loading...'));
  if (dialog.open === false) {
    dialog.showModal();
  }

  try {
    var data = await askServer('GET', '/api/admin/reservations/' + id);
    currentReservation = data.reservation;
    showDetail();
  } catch (error) {
    byId('detail-body').replaceChildren(makeElement('p', 'field-error', error.message));
  }
}

// Fills the detail window with the current reservation.
function showDetail() {
  var r = currentReservation;
  byId('detail-title').textContent = 'Reservation ' + r.reference;

  // The phone number is a link that can start a call. The email is a link only if there is one.
  var phoneLink = makeElement('a', '', r.phone);
  phoneLink.href = 'tel:' + r.phone.replace(/[^\d+]/g, '');
  var emailValue = 'Not given';
  if (r.email) {
    emailValue = makeElement('a', '', r.email);
    emailValue.href = 'mailto:' + r.email;
  }

  // Each row is [label, value]. The value is text or an element.
  var rows = [
    ['Status', makeStatusBadge(r.status)],
    ['Name', r.customer_name],
    ['Contact number', phoneLink],
    ['Email', emailValue],
    ['Branch', r.branch_name],
    ['Date', formatDateShort(r.reservation_date)],
    ['Time', formatTime12(r.reservation_time)],
    ['Guests', String(r.guests)],
    ['Occasion', r.occasion || 'None'],
    ['Allergies or special needs', r.allergies || 'None'],
    ['Other requests', r.special_requests || 'None'],
    ['Staff notes', r.admin_notes || 'None'],
    ['Requested on', r.created_at],
    ['Last updated', r.updated_at]
  ];
  var list = makeElement('dl', 'detail-list');
  for (var i = 0; i < rows.length; i++) {
    var description = makeElement('dd');
    description.append(rows[i][1]);
    list.append(makeElement('dt', '', rows[i][0]), description);
  }
  byId('detail-body').replaceChildren(list);
}

byId('detail-close').addEventListener('click', function () {
  byId('detail-dialog').close();
});
// ---------------------------------------------------------------
// Start the page
// ---------------------------------------------------------------
startPage();
