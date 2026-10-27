const accountForm = document.querySelector('#account-form');
const accountStatus = document.querySelector('#account-status');
const logoutButton = document.querySelector('#logout-button');

async function initializeAccount() {
  const response = await fetch('/api/me');
  const result = await response.json();
  if (!result.user) {
    window.location.replace('/#popup');
    return;
  }
  document.querySelector('#username').value = result.user.username;
  document.querySelector('#profile-username').textContent = result.user.username;
  document.querySelector('#profile-initial').textContent = result.user.username.charAt(0).toUpperCase();
  localStorage.setItem('iczz_username', result.user.username);
  document.querySelector('#profile-role').textContent = result.user.role === 'admin' ? 'ADMIN' : 'MEMBER';
  document.querySelector('#admin-links').hidden = result.user.role !== 'admin';
}

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(accountForm));
  const confirmation = document.querySelector('#confirm-password').value;
  if (payload.newPassword && payload.newPassword !== confirmation) {
    accountStatus.textContent = 'Nová hesla se neshodují.';
    return;
  }
  if (!payload.newPassword && (payload.currentPassword || confirmation)) {
    accountStatus.textContent = 'Pro změnu hesla vyplň současné i nové heslo.';
    return;
  }
  delete payload.confirmPassword;
  accountStatus.textContent = 'Ukládám změny…';
  try {
    const response = await fetch('/api/account', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Údaje se nepodařilo uložit.');
    document.querySelector('#profile-username').textContent = result.user.username;
    document.querySelector('#profile-initial').textContent = result.user.username.charAt(0).toUpperCase();
    localStorage.setItem('iczz_username', result.user.username);
    document.querySelector('#current-password').value = '';
    document.querySelector('#new-password').value = '';
    document.querySelector('#confirm-password').value = '';
    accountStatus.textContent = 'Profil byl aktualizován.';
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  localStorage.removeItem('iczz_username');
  await fetch('/api/logout', { method: 'POST' });
  window.location.assign('/');
});

initializeAccount().catch(() => { window.location.replace('/#popup'); });

const themeToggle = document.querySelector('#theme-toggle');
const themeLabel = document.querySelector('#theme-label');

function applyAccountTheme(mode) {
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeLabel.textContent = isDark ? 'SVĚTLÝ REŽIM' : 'TMAVÝ REŽIM';
  themeToggle.setAttribute('aria-label', isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim');
}

applyAccountTheme(localStorage.getItem('mode') || 'light');
themeToggle.addEventListener('click', () => {
  const mode = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('mode', mode);
  applyAccountTheme(mode);
});

const memberCard = document.querySelector('.member-card');
memberCard.addEventListener('pointermove', (event) => {
  const bounds = memberCard.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  memberCard.style.setProperty('--tilt-x', `${(0.5 - y) * 10}deg`);
  memberCard.style.setProperty('--tilt-y', `${(x - 0.5) * 12}deg`);
  memberCard.style.setProperty('--shine-x', `${x * 100}%`);
  memberCard.style.setProperty('--shine-y', `${y * 100}%`);
});
memberCard.addEventListener('pointerleave', () => {
  memberCard.style.setProperty('--tilt-x', '0deg');
  memberCard.style.setProperty('--tilt-y', '0deg');
  memberCard.style.setProperty('--shine-x', '50%');
  memberCard.style.setProperty('--shine-y', '50%');
});
memberCard.addEventListener('keydown', (event) => {
  const step = 5;
  const currentX = Number.parseFloat(memberCard.style.getPropertyValue('--tilt-x')) || 0;
  const currentY = Number.parseFloat(memberCard.style.getPropertyValue('--tilt-y')) || 0;
  if (event.key === 'ArrowUp') memberCard.style.setProperty('--tilt-x', `${Math.min(12, currentX + step)}deg`);
  else if (event.key === 'ArrowDown') memberCard.style.setProperty('--tilt-x', `${Math.max(-12, currentX - step)}deg`);
  else if (event.key === 'ArrowLeft') memberCard.style.setProperty('--tilt-y', `${Math.max(-14, currentY - step)}deg`);
  else if (event.key === 'ArrowRight') memberCard.style.setProperty('--tilt-y', `${Math.min(14, currentY + step)}deg`);
  else return;
  event.preventDefault();
});
memberCard.addEventListener('blur', () => {
  memberCard.style.setProperty('--tilt-x', '0deg');
  memberCard.style.setProperty('--tilt-y', '0deg');
});
