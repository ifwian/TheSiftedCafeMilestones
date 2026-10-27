// app.js
// The JavaScript of the public website (index.html):
//   1. The mobile menu
//   2. The year in the footer
//   3. The photo viewer (lightbox) in the gallery
//   4. The reservation form: check it, send it to the server, show the result


// ---------------------------------------------------------------
// 1. Mobile menu
// ---------------------------------------------------------------
var menuButton = document.querySelector('.nav-toggle');
var menu = document.getElementById('site-nav');

// Opens or closes the menu. aria-expanded tells screen readers what state it is in.
function setMenuOpen(isOpen) {
  menuButton.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) {
    menu.classList.add('is-open');
  } else {
    menu.classList.remove('is-open');
  }
}

menuButton.addEventListener('click', function () {
  var isOpenNow = menuButton.getAttribute('aria-expanded') === 'true';
  setMenuOpen(!isOpenNow);
});

// Clicking a link in the menu closes it.
menu.addEventListener('click', function (event) {
  if (event.target.closest('a')) {
    setMenuOpen(false);
  }
});

// The Escape key closes it.
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    setMenuOpen(false);
  }
});


// ---------------------------------------------------------------
// 2. Year in the footer
// ---------------------------------------------------------------
document.getElementById('year').textContent = String(new Date().getFullYear());


// ---------------------------------------------------------------
// 3. Gallery photo viewer (lightbox)
// ---------------------------------------------------------------
var galleryItems = document.querySelectorAll('.gallery-item');
var lightbox = document.getElementById('lightbox');
var lightboxImage = document.getElementById('lightbox-img');
var lightboxCaption = document.getElementById('lightbox-caption');
var currentPhoto = 0;   // which photo is showing

// Shows the photo at a position. After the last photo it goes back to the first.
function showPhoto(index) {
  if (index < 0) {
    index = galleryItems.length - 1;
  }
  if (index >= galleryItems.length) {
    index = 0;
  }
  currentPhoto = index;

  var thumbnail = galleryItems[index].querySelector('img');
  lightboxImage.src = galleryItems[index].dataset.full;
  lightboxImage.alt = thumbnail.alt;
  lightboxCaption.textContent = thumbnail.alt;
}

// Clicking a small photo opens the viewer on that photo.
// (A separate function is used so each button remembers its own number.)
function connectThumbnail(button, index) {
  button.addEventListener('click', function () {
    showPhoto(index);
    lightbox.showModal();
  });
}
for (var i = 0; i < galleryItems.length; i++) {
  connectThumbnail(galleryItems[i], i);
}

document.getElementById('lightbox-prev').addEventListener('click', function () {
  showPhoto(currentPhoto - 1);
});
document.getElementById('lightbox-next').addEventListener('click', function () {
  showPhoto(currentPhoto + 1);
});
document.getElementById('lightbox-close').addEventListener('click', function () {
  lightbox.close();
});

// Clicking the dark area around the photo closes the viewer.
lightbox.addEventListener('click', function (event) {
  if (event.target === lightbox) {
    lightbox.close();
  }
});


// ---------------------------------------------------------------
// 4. The reservation form
// ---------------------------------------------------------------
// Step by step:
//   a. The browser checks what the visitor typed (quick, friendly feedback).
//   b. The form is sent to our server, which checks it AGAIN (the server is the one we trust).
//   c. The success message is shown ONLY if the server says it saved the reservation.

var form = document.getElementById('reservation-form');
var submitButton = document.getElementById('reservation-submit');
var statusBox = document.getElementById('form-status');
var successBox = document.getElementById('reservation-success');

// The names of the form fields, and the input of each one.
var FIELD_NAMES = [
  'customer_name', 'phone', 'email', 'branch', 'guests',
  'reservation_date', 'reservation_time', 'occasion', 'allergies', 'special_requests'
];
var inputs = {
  customer_name: document.getElementById('res-name'),
  phone: document.getElementById('res-phone'),
  email: document.getElementById('res-email'),
  branch: document.getElementById('res-branch'),
  guests: document.getElementById('res-guests'),
  reservation_date: document.getElementById('res-date'),
  reservation_time: document.getElementById('res-time'),
  occasion: document.getElementById('res-occasion'),
  allergies: document.getElementById('res-allergies'),
  special_requests: document.getElementById('res-requests')
};

// Turns a date into text like '2026-10-24'. (The date picker uses this format.)
function dateToText(date) {
  var month = String(date.getMonth() + 1);
  var day = String(date.getDate());
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return date.getFullYear() + '-' + month + '-' + day;
}

// The date picker can only choose from TOMORROW (we need at least 1 day notice) up to 60 days ahead.
var firstDay = new Date();
firstDay.setDate(firstDay.getDate() + 1);
var lastDay = new Date();
lastDay.setDate(lastDay.getDate() + 60);
inputs.reservation_date.min = dateToText(firstDay);
inputs.reservation_date.max = dateToText(lastDay);

// The opening hours of each branch (24-hour numbers). Requests are every hour,
// from opening until 1 hour before closing. The server has the same rule.
var BRANCH_HOURS = {
  calamba: { open: 10, close: 22 },
  cabuyao: { open: 9, close: 21 }
};
var timeHint = document.getElementById('time-hint');
var defaultHint = timeHint.textContent;

// Shows only the times that fit the chosen branch.
function updateTimeOptions() {
  var branch = inputs.branch.value;
  var options = inputs.reservation_time.options;
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === '') {
      continue;   // "Select a time"
    }
    var hour = Number(options[i].value.slice(0, 2));
    var fits = true;
    if (BRANCH_HOURS[branch]) {
      fits = hour >= BRANCH_HOURS[branch].open && hour <= BRANCH_HOURS[branch].close - 1;
    }
    options[i].hidden = !fits;
    options[i].disabled = !fits;
  }
  // If the chosen time does not exist at this branch, clear it
  var chosen = inputs.reservation_time.selectedOptions[0];
  if (chosen && chosen.disabled) {
    inputs.reservation_time.value = '';
  }
  if (BRANCH_HOURS[branch]) {
    var h = BRANCH_HOURS[branch];
    timeHint.textContent = 'Times are every hour, from ' + formatTime12(pad2(h.open) + ':00') + ' to ' +
      formatTime12(pad2(h.close - 1) + ':00') + ' (we close at ' + formatTime12(pad2(h.close) + ':00') +
      '). Reserve at least 1 day ahead. Our team confirms every request.';
  } else {
    timeHint.textContent = defaultHint;
  }
}
function pad2(number) {
  return (number < 10 ? '0' : '') + number;
}
inputs.branch.addEventListener('change', updateTimeOptions);
updateTimeOptions();

// Reads every field and removes spaces at the start and end.
function readValues() {
  var values = {};
  for (var i = 0; i < FIELD_NAMES.length; i++) {
    values[FIELD_NAMES[i]] = inputs[FIELD_NAMES[i]].value.trim();
  }
  return values;
}

// Checks the values. Gives back an object of error messages, for example
//   { phone: 'Please enter a contact number.' }
// An empty object means everything is fine. (The server uses the same rules.)
function checkValues(values) {
  var errors = {};

  // Name
  if (values.customer_name === '') {
    errors.customer_name = 'Please enter your name.';
  } else if (values.customer_name.length < 2) {
    errors.customer_name = 'Name must be at least 2 characters.';
  } else if (/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(values.customer_name) === false) {
    errors.customer_name = 'Name can only contain letters, spaces, apostrophes, periods and hyphens.';
  }

  // Phone
  var digits = values.phone.replace(/\D/g, '');
  if (values.phone === '') {
    errors.phone = 'Please enter a contact number.';
  } else if (/^\+?[0-9\s\-()]+$/.test(values.phone) === false) {
    errors.phone = 'Contact number can only contain digits, spaces, + - ( ).';
  } else if (digits.length < 7 || digits.length > 15) {
    errors.phone = 'Contact number must have between 7 and 15 digits.';
  }

  // Email (required: we confirm by email)
  if (values.email === '') {
    errors.email = 'Please enter your email address. We use it to confirm your reservation.';
  } else if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email) === false) {
    errors.email = 'Please enter a valid email address.';
  }

  // Branch
  if (values.branch === '') {
    errors.branch = 'Please choose a branch.';
  }

  // Guests
  var guests = Number(values.guests);
  if (values.guests === '') {
    errors.guests = 'Please enter the number of guests.';
  } else if (Number.isInteger(guests) === false) {
    errors.guests = 'Number of guests must be a whole number.';
  } else if (guests < 2 || guests > 10) {
    errors.guests = 'Online reservations are for 2 to 10 guests. For larger groups, please call or message the cafe.';
  }

  // Date (text like 2026-10-24 can be compared with < and >)
  if (values.reservation_date === '') {
    errors.reservation_date = 'Please choose a date.';
  } else if (values.reservation_date < dateToText(firstDay)) {
    errors.reservation_date = 'We need at least 1 day notice. Please choose tomorrow or a later date.';
  } else if (values.reservation_date > dateToText(lastDay)) {
    errors.reservation_date = 'Reservations can be requested up to 60 days ahead.';
  }

  // Time
  if (values.reservation_time === '') {
    errors.reservation_time = 'Please choose a time.';
  }

  // Occasion, allergies and other requests (all optional)
  if (values.occasion.length > 100) {
    errors.occasion = 'Occasion must be 100 characters or fewer.';
  }
  if (values.allergies.length > 300) {
    errors.allergies = 'Allergies or special needs must be 300 characters or fewer.';
  }
  if (values.special_requests.length > 500) {
    errors.special_requests = 'Other requests must be 500 characters or fewer.';
  }

  return errors;
}

// Shows an error under one field. An empty message clears the error.
function setFieldError(name, message) {
  var fieldBox = inputs[name].closest('.field');
  document.getElementById('err-' + name).textContent = message;

  if (message !== '') {
    fieldBox.classList.add('has-error');
    inputs[name].setAttribute('aria-invalid', 'true');
  } else {
    fieldBox.classList.remove('has-error');
    inputs[name].removeAttribute('aria-invalid');
  }
}

// Shows the errors of all fields, and puts the cursor in the first bad field.
function showFieldErrors(errors) {
  var firstBadField = null;
  for (var i = 0; i < FIELD_NAMES.length; i++) {
    var name = FIELD_NAMES[i];
    if (errors[name]) {
      setFieldError(name, errors[name]);
      if (firstBadField === null) {
        firstBadField = name;
      }
    } else {
      setFieldError(name, '');
    }
  }
  if (firstBadField !== null) {
    inputs[firstBadField].focus();
  }
}

// Shows a message box above the button. kind is 'error' or 'success'.
function showStatus(kind, message) {
  statusBox.replaceChildren();
  var box = document.createElement('div');
  box.className = 'alert alert-' + kind;
  box.textContent = message;   // textContent shows text only. It never runs HTML.
  statusBox.append(box);
}

// Checks one field when the visitor leaves it, and again while typing
// if the field is already showing an error.
function connectFieldEvents(name) {
  inputs[name].addEventListener('blur', function (event) {
    // If the visitor clicked the Send button, do not show a message here: the page would shift
    // down and the click would miss the button. The submit step checks every field anyway.
    if (event.relatedTarget === submitButton) {
      return;
    }
    var errors = checkValues(readValues());
    setFieldError(name, errors[name] || '');
  });
  inputs[name].addEventListener('input', function () {
    if (inputs[name].closest('.field').classList.contains('has-error')) {
      var errors = checkValues(readValues());
      setFieldError(name, errors[name] || '');
    }
  });
}
for (var j = 0; j < FIELD_NAMES.length; j++) {
  connectFieldEvents(FIELD_NAMES[j]);
}

// Sends the form to the server.
form.addEventListener('submit', async function (event) {
  event.preventDefault();   // stop the browser from reloading the page
  statusBox.replaceChildren();

  // a. Check in the browser first. If something is wrong, stop here.
  var values = readValues();
  var errors = checkValues(values);
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    showStatus('error', 'Please fix the highlighted fields and try again.');
    return;
  }

  // b. Send to the server
  values.website = document.getElementById('res-website').value;   // the hidden bot trap. It must stay empty.
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    var response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify(values)
    });
    var data = await response.json();

    if (response.ok) {
      showSuccess(data);   // c. the server says it saved the reservation
    } else if ((response.status === 400 || response.status === 409) && data.errors) {   // 409 = that time is full
      showFieldErrors(data.errors);   // the server found a problem the browser did not
      showStatus('error', 'Please fix the highlighted fields and try again.');
    } else {
      showStatus('error', (data.error || 'Something went wrong.') + ' Your request was NOT sent.');
    }
  } catch (error) {
    // fetch fails when the server cannot be reached at all
    showStatus('error', 'We could not reach the server, so your request was NOT sent. Please check your connection and try again.');
  }

  submitButton.disabled = false;
  submitButton.textContent = 'Send reservation request';
});

// '2026-10-24' becomes 'Saturday, October 24, 2026'
function formatDateLong(dateText) {
  var parts = dateText.split('-');
  var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
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

// Replaces the form with the "Request received" box.
function showSuccess(data) {
  var r = data.reservation;
  document.getElementById('success-message').textContent = data.message;

  // The details are shown as pairs: a label and its value
  var rows = [
    ['Reference', r.reference],
    ['Name', r.customer_name],
    ['Branch', r.branch_name],
    ['Date', formatDateLong(r.reservation_date)],
    ['Time', formatTime12(r.reservation_time)],
    ['Guests', String(r.guests)],
    ['Status', 'Pending (waiting for staff confirmation)']
  ];
  var details = document.getElementById('success-details');
  details.replaceChildren();
  for (var i = 0; i < rows.length; i++) {
    var label = document.createElement('dt');
    var value = document.createElement('dd');
    label.textContent = rows[i][0];
    value.textContent = rows[i][1];
    details.append(label, value);
  }

  form.hidden = true;
  document.querySelector('.reserve-note').hidden = true;
  successBox.hidden = false;
  successBox.focus();
}

// The "Make another request" button brings the empty form back.
document.getElementById('new-request').addEventListener('click', function () {
  form.reset();
  updateTimeOptions();
  for (var i = 0; i < FIELD_NAMES.length; i++) {
    setFieldError(FIELD_NAMES[i], '');
  }
  statusBox.replaceChildren();
  successBox.hidden = true;
  form.hidden = false;
  document.querySelector('.reserve-note').hidden = false;
  inputs.customer_name.focus();
});
