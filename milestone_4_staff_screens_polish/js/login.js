// login.js
// The staff sign-in page (login.html).
// The username and password are sent to the server, which compares them with the
// values in the .env file. The browser code never knows the real password.

var loginForm = document.getElementById('login-form');
var loginStatus = document.getElementById('login-status');
var loginButton = document.getElementById('login-submit');

// Shows a red message above the button. An empty message clears it.
function showLoginMessage(message) {
  loginStatus.replaceChildren();
  if (message !== '') {
    var box = document.createElement('div');
    box.className = 'alert alert-error';
    box.textContent = message;
    loginStatus.append(box);
  }
}

// If the staff member is already signed in, go straight to the dashboard.
async function checkIfSignedIn() {
  try {
    var response = await fetch('/api/me');
    if (response.ok) {
      window.location.href = 'admin.html';
    }
  } catch (error) {
    // The server cannot be reached. Stay on this page.
  }
}
checkIfSignedIn();

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  showLoginMessage('');

  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value;
  if (username === '' || password === '') {
    showLoginMessage('Please enter your username and password.');
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';

  try {
    var response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      body: JSON.stringify({ username: username, password: password })
    });
    var data = await response.json();

    if (response.ok) {
      window.location.href = 'admin.html';   // success: open the dashboard
      return;
    }
    showLoginMessage(data.error || 'Could not sign in.');
  } catch (error) {
    showLoginMessage('Could not reach the server. Please check that it is running.');
  }

  document.getElementById('login-password').value = '';
  loginButton.disabled = false;
  loginButton.textContent = 'Sign in';
});
