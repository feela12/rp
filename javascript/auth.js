const accountLink = document.querySelector('.acc');
const userIcon = accountLink?.querySelector('img');
let initialIcon = accountLink?.querySelector('.account-initial');
let accountLabel = accountLink?.querySelector('.account-link-label');
if (accountLink && !accountLabel) {
  accountLabel = document.createElement('span');
  accountLabel.className = 'account-link-label';
  accountLabel.textContent = 'PROFILE';
  accountLabel.hidden = true;
  accountLink.append(accountLabel);
}
if (accountLink && userIcon && !initialIcon) {
  initialIcon = document.createElement('span');
  initialIcon.className = 'account-initial';
  initialIcon.setAttribute('aria-hidden', 'true');
  initialIcon.hidden = true;
  accountLink.append(initialIcon);
}

function updateAccountIcon(user) {
  if (!accountLink || !userIcon || !initialIcon) return;
  if (user) {
    try { localStorage.setItem('iczz_username', user.username); } catch {}
    initialIcon.textContent = user.username.charAt(0).toUpperCase();
    initialIcon.hidden = false;
    userIcon.hidden = true;
    accountLink.setAttribute('aria-label', `Otevřít účet ${user.username}`);
    accountLink.href = '/account.html';
    accountLink.classList.add('is-authenticated');
    accountLabel.hidden = false;
  } else {
    try { localStorage.removeItem('iczz_username'); } catch {}
    initialIcon.hidden = true;
    userIcon.hidden = false;
    accountLink.setAttribute('aria-label', 'Otevřít přihlášení');
    const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    accountLink.href = isHomePage ? '#popup' : '/#popup';
    accountLink.classList.remove('is-authenticated');
    accountLabel.hidden = true;
  }
  document.documentElement.classList.remove('account-known');
  document.documentElement.style.removeProperty('--account-initial');
}

accountLink?.addEventListener('click', (event) => {
  if (!accountLink.classList.contains('is-authenticated')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.assign('/account.html');
}, true);

async function fetchCurrentUser() {
  const response = await fetch('/api/me');
  const result = await response.json();
  updateAccountIcon(result.user);
  return result.user;
}

const form = document.querySelector('#auth-form');
if (form) {
  const statusText = document.querySelector('#auth-status');
  const switchCopy = document.querySelector('#auth-switch-copy');
  const switchLink = document.querySelector('#auth-switch');
  const submitButton = document.querySelector('#auth-submit');
  const adminLinks = document.querySelector('#auth-admin-links');
  const logoutButton = document.querySelector('#auth-logout');
  const popupTitle = document.querySelector('.login-heading-group h3');
  const popupSubtitle = document.querySelector('.login-subtitle');
  const divider = document.querySelector('.login-divider');
  const secondaryActions = document.querySelector('.login-secondary-actions');
  let registering = false;

  function setMode(isRegistering) {
    registering = isRegistering;
    popupTitle.textContent = registering ? 'CREATE ACCOUNT' : 'WELCOME BACK';
    popupSubtitle.textContent = registering ? 'REGISTER A NEW ACCOUNT' : 'LOGIN TO YOUR ACCOUNT';
    submitButton.textContent = registering ? 'SIGN UP' : 'LOG IN';
    switchCopy.firstChild.textContent = registering ? 'ALREADY HAVE AN ACCOUNT? ' : "DON'T HAVE AN ACCOUNT? ";
    switchLink.textContent = registering ? 'LOG IN' : 'SIGN UP';
    divider.hidden = registering;
    secondaryActions.hidden = registering;
    form.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
    statusText.textContent = '';
  }

  async function showUser() {
    const user = await fetchCurrentUser();
    if (!user) return;
    form.hidden = true;
    switchCopy.hidden = true;
    statusText.textContent = `Přihlášen jako ${user.username}.`;
    adminLinks.hidden = user.role !== 'admin';
    logoutButton.hidden = false;
  }

  switchLink.addEventListener('click', (event) => {
    event.preventDefault();
    setMode(!registering);
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusText.textContent = 'Pracuji…';
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(registering ? '/api/register' : '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Požadavek se nepodařilo dokončit.');
      form.reset();
      await showUser();
    } catch (error) {
      statusText.textContent = error.message;
    }
  });
  logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    form.hidden = false;
    switchCopy.hidden = false;
    adminLinks.hidden = true;
    logoutButton.hidden = true;
    updateAccountIcon(null);
    setMode(false);
    statusText.textContent = 'Byl/a jsi odhlášen/a.';
  });
  showUser().catch(() => {});
} else {
  fetchCurrentUser().catch(() => updateAccountIcon(null));
}
