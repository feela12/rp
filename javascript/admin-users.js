const tableBody = document.querySelector('#users');
const statusText = document.querySelector('#status');

async function loadUsers() {
  const response = await fetch('/api/admin/users');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Uživatele se nepodařilo načíst.');
  tableBody.replaceChildren(...result.users.map((user) => {
    const row = document.createElement('tr');
    for (const value of [user.username, user.role, new Date(user.createdAt).toLocaleString('cs-CZ')]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    const actionCell = document.createElement('td');
    if (user.role !== 'admin') {
      const button = document.createElement('button');
      button.textContent = 'Odstranit';
      button.addEventListener('click', async () => {
        const deletion = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
        const result = await deletion.json();
        if (!deletion.ok) statusText.textContent = result.error || 'Odstranění se nepodařilo.';
        else await loadUsers();
      });
      actionCell.append(button);
    }
    row.append(actionCell);
    return row;
  }));
}

loadUsers().catch((error) => { statusText.textContent = error.message; });
