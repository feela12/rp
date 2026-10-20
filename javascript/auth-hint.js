// Paint the cached account initial before the page's deferred scripts run.
let cachedAccountName = '';
try {
  cachedAccountName = localStorage.getItem('iczz_username') || '';
} catch {
  // Storage can be disabled in private browsing; the server session still works.
}
if (cachedAccountName && /^[A-Za-z]/.test(cachedAccountName)) {
  document.documentElement.classList.add('account-known');
  document.documentElement.style.setProperty('--account-initial', `"${cachedAccountName.charAt(0).toUpperCase()}"`);
}
