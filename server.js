require('dotenv').config();

const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { getPool } = require('./database');

const app = express();
const port = process.env.PORT || 3000;
const projectRoot = __dirname;
app.use(express.json());

// Sessions are memory-only for this small local project; they reset when the server restarts.
const sessions = new Map();
const sessionLifetime = 8 * 60 * 60 * 1000;
const sessionCookie = 'iczz_session';
function cookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').map((part) => {
    const i = part.indexOf('=');
    return i < 0 ? ['', ''] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }).filter(([key]) => key));
}
function getUser(request) {
  const token = cookies(request)[sessionCookie];
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session.user;
}
function requireAdmin(request, response, next) {
  if (getUser(request)?.role !== 'admin') return response.status(403).json({ error: 'Tato funkce je pouze pro administrátora.' });
  next();
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) return reject(error);
    resolve(`scrypt$${salt.toString('hex')}$${key.toString('hex')}`);
  }));
}
function checkPassword(password, stored) {
  const [algorithm, salt, digest] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !digest) return Promise.resolve(false);
  const expected = Buffer.from(digest, 'hex');
  return new Promise((resolve, reject) => crypto.scrypt(password, Buffer.from(salt, 'hex'), expected.length, (error, key) => {
    if (error) return reject(error);
    resolve(key.length === expected.length && crypto.timingSafeEqual(key, expected));
  }));
}
function startSession(response, user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { user, expiresAt: Date.now() + sessionLifetime });
  response.setHeader('Set-Cookie', `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetime / 1000}`);
}

async function bootstrapAdmin() {
  const sql = require('mssql');
  const pool = await getPool();
  await pool.request().query(`
    IF COL_LENGTH(N'dbo.Users', N'LoyaltyPoints') IS NULL
    BEGIN
      ALTER TABLE dbo.Users
        ADD LoyaltyPoints INT NOT NULL
          CONSTRAINT DF_Users_LoyaltyPoints DEFAULT (0) WITH VALUES;
      ALTER TABLE dbo.Users
        ADD CONSTRAINT CK_Users_LoyaltyPoints CHECK (LoyaltyPoints >= 0);
    END;
  `);

  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return console.warn('Admin bootstrap skipped: set ADMIN_USERNAME and ADMIN_PASSWORD in .env.');
  const found = await pool.request().input('username', sql.NVarChar(50), username).query('SELECT Id FROM dbo.Users WHERE Username = @username');
  if (found.recordset.length) return;
  const passwordHash = await hashPassword(password);
  await pool.request().input('username', sql.NVarChar(50), username).input('passwordHash', sql.NVarChar(255), passwordHash)
    .query("INSERT INTO dbo.Users (Username, PasswordHash, Role) VALUES (@username, @passwordHash, N'admin')");
  console.log(`Created initial admin account '${username}'.`);
}

app.post('/api/register', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = request.body.password;
  if (!/^[A-Za-z][A-Za-z0-9_.-]{2,49}$/.test(username) || typeof password !== 'string' || password.length < 10 || password.length > 128) {
    return response.status(400).json({ error: 'Uživatelské jméno musí mít 3–50 znaků a heslo 10–128 znaků.' });
  }
  try {
    const sql = require('mssql');
    const pool = await getPool();
    const passwordHash = await hashPassword(password);
    const result = await pool.request().input('username', sql.NVarChar(50), username).input('passwordHash', sql.NVarChar(255), passwordHash)
      .query("INSERT INTO dbo.Users (Username, PasswordHash, Role) OUTPUT INSERTED.Id AS id, INSERTED.Username AS username, INSERTED.Role AS role VALUES (@username, @passwordHash, N'user')");
    startSession(response, result.recordset[0]);
    response.status(201).json({ user: result.recordset[0] });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) return response.status(409).json({ error: 'Toto uživatelské jméno už existuje.' });
    console.error('Registration failed:', error.message);
    response.status(503).json({ error: 'Registrace se nepodařila.' });
  }
});

app.post('/api/login', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = request.body.password;
  if (typeof password !== 'string') return response.status(400).json({ error: 'Zadej jméno a heslo.' });
  try {
    const sql = require('mssql');
    const pool = await getPool();
    const result = await pool.request().input('username', sql.NVarChar(50), username)
      .query('SELECT Id AS id, Username AS username, PasswordHash AS passwordHash, Role AS role FROM dbo.Users WHERE Username = @username');
    const row = result.recordset[0];
    if (!row || !(await checkPassword(password, row.passwordHash))) return response.status(401).json({ error: 'Nesprávné uživatelské jméno nebo heslo.' });
    const user = { id: row.id, username: row.username, role: row.role };
    startSession(response, user);
    response.json({ user });
  } catch (error) {
    console.error('Login failed:', error.message);
    response.status(503).json({ error: 'Přihlášení se nepodařilo.' });
  }
});

app.post('/api/logout', (request, response) => {
  const token = cookies(request)[sessionCookie];
  if (token) sessions.delete(token);
  response.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  response.json({ ok: true });
});
app.get('/api/me', (request, response) => response.json({ user: getUser(request) }));

app.put('/api/account', async (request, response) => {
  const user = getUser(request);
  if (!user) return response.status(401).json({ error: 'Přihlas se znovu.' });
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const currentPassword = request.body.currentPassword;
  const newPassword = request.body.newPassword;
  if (!/^[A-Za-z][A-Za-z0-9_.-]{2,49}$/.test(username)) {
    return response.status(400).json({ error: 'Jméno musí začínat písmenem a mít 3–50 znaků (písmena, čísla, . _ -).' });
  }
  if (newPassword && (typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 128)) {
    return response.status(400).json({ error: 'Nové heslo musí mít 10–128 znaků.' });
  }
  if (newPassword && typeof currentPassword !== 'string') {
    return response.status(400).json({ error: 'Pro změnu hesla zadej současné heslo.' });
  }
  try {
    const sql = require('mssql');
    const pool = await getPool();
    const existing = await pool.request().input('id', sql.Int, user.id)
      .query('SELECT PasswordHash FROM dbo.Users WHERE Id = @id');
    if (!existing.recordset[0]) return response.status(401).json({ error: 'Účet už neexistuje. Přihlas se znovu.' });
    if (newPassword && !(await checkPassword(currentPassword, existing.recordset[0].PasswordHash))) {
      return response.status(400).json({ error: 'Současné heslo nesouhlasí.' });
    }
    const requestSql = pool.request().input('id', sql.Int, user.id).input('username', sql.NVarChar(50), username);
    let result;
    if (newPassword) {
      const passwordHash = await hashPassword(newPassword);
      result = await requestSql.input('passwordHash', sql.NVarChar(255), passwordHash)
        .query('UPDATE dbo.Users SET Username = @username, PasswordHash = @passwordHash OUTPUT INSERTED.Id AS id, INSERTED.Username AS username, INSERTED.Role AS role WHERE Id = @id');
    } else {
      result = await requestSql
        .query('UPDATE dbo.Users SET Username = @username OUTPUT INSERTED.Id AS id, INSERTED.Username AS username, INSERTED.Role AS role WHERE Id = @id');
    }
    const updatedUser = result.recordset[0];
    const token = cookies(request)[sessionCookie];
    const session = token && sessions.get(token);
    if (session) session.user = updatedUser;
    response.json({ user: updatedUser });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) return response.status(409).json({ error: 'Toto uživatelské jméno už někdo používá.' });
    console.error('Account update failed:', error.message);
    response.status(503).json({ error: 'Údaje se nepodařilo uložit.' });
  }
});

app.get('/api/admin/users', requireAdmin, async (_request, response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT Id AS id, Username AS username, Role AS role, CreatedAt AS createdAt FROM dbo.Users ORDER BY CreatedAt');
    response.json({ users: result.recordset });
  } catch (error) {
    console.error('Could not list users:', error.message);
    response.status(503).json({ error: 'Uživatele se nepodařilo načíst.' });
  }
});
app.delete('/api/admin/users/:id', requireAdmin, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1 || id === getUser(request).id) return response.status(400).json({ error: 'Tento účet nelze odstranit.' });
  try {
    const sql = require('mssql');
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, id).query("DELETE FROM dbo.Users OUTPUT DELETED.Id WHERE Id = @id AND Role = N'user'");
    if (!result.recordset.length) return response.status(404).json({ error: 'Uživatele nelze najít nebo jde o admin účet.' });
    response.json({ ok: true });
  } catch (error) {
    console.error('Could not delete user:', error.message);
    response.status(503).json({ error: 'Uživatele se nepodařilo odstranit.' });
  }
});

app.get('/admin-product.html', requireAdmin, (_request, response) => response.sendFile(path.join(projectRoot, 'html', 'admin-product.html')));
app.get('/admin-users.html', requireAdmin, (_request, response) => response.sendFile(path.join(projectRoot, 'html', 'admin-users.html')));
app.get('/account.html', (request, response) => {
  if (!getUser(request)) return response.redirect('/#popup');
  response.sendFile(path.join(projectRoot, 'html', 'account.html'));
});

app.get('/api/products/:slug', async (request, response) => {
  response.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const pagePath = request.params.slug === 'graduation-cd' ? 'product8.html' : `${request.params.slug}.html`;
  if (!/^product(?:[1-9]|10)\.html$/.test(pagePath)) return response.status(404).json({ error: 'Produkt nebyl nalezen.' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('pagePath', require('mssql').NVarChar(150), pagePath)
      .query(`SELECT Id AS id, Name AS name, Description AS description,
                     Price AS price, ImagePath AS imagePath, PagePath AS pagePath
              FROM dbo.Products WHERE PagePath = @pagePath`);

    if (!result.recordset[0]) {
      return response.status(404).json({ error: 'Produkt nebyl nalezen. Spusť database/setup.sql.' });
    }
    response.json(result.recordset[0]);
  } catch (error) {
    console.error('Could not load product:', error.message);
    response.status(503).json({ error: 'Could not load product. Check the SQL Server setup.' });
  }
});

app.put('/api/products/:slug', requireAdmin, async (request, response) => {
  const pagePath = request.params.slug === 'graduation-cd' ? 'product8.html' : `${request.params.slug}.html`;
  if (!/^product(?:[1-9]|10)\.html$/.test(pagePath)) return response.status(404).json({ error: 'Produkt nebyl nalezen.' });
  const { name, description, price, imagePath } = request.body;
  const parsedPrice = Number(price);
  if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' ||
      !description.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0 ||
      typeof imagePath !== 'string' || !imagePath.trim()) {
    return response.status(400).json({ error: 'Enter a name, description, non-negative price, and image path.' });
  }

  try {
    const sql = require('mssql');
    const pool = await getPool();
    const result = await pool.request()
      .input('pagePath', sql.NVarChar(150), pagePath)
      .input('name', sql.NVarChar(150), name.trim())
      .input('description', sql.NVarChar(sql.MAX), description.trim())
      .input('price', sql.Decimal(10, 2), parsedPrice)
      .input('imagePath', sql.NVarChar(300), imagePath.trim())
      .query(`UPDATE dbo.Products
              SET Name = @name, Description = @description, Price = @price,
                  ImagePath = @imagePath, UpdatedAt = SYSUTCDATETIME()
              OUTPUT INSERTED.Id AS id, INSERTED.Name AS name,
                     INSERTED.Description AS description, INSERTED.Price AS price,
                     INSERTED.ImagePath AS imagePath, INSERTED.PagePath AS pagePath
              WHERE PagePath = @pagePath`);

    if (!result.recordset[0]) {
      return response.status(404).json({ error: 'Produkt nebyl nalezen. Spusť database/setup.sql.' });
    }
    response.json(result.recordset[0]);
  } catch (error) {
    console.error('Could not save product:', error.message);
    response.status(503).json({ error: 'Could not save product. Check the SQL Server setup.' });
  }
});

app.get('/api/db-check', async (_request, response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 AS connected');
    response.json({ connected: result.recordset[0].connected === 1 });
  } catch (error) {
    console.error('SQL Server connection failed:', error.message);
    response.status(503).json({ connected: false, error: 'Database connection failed. Check the server settings.' });
  }
});

// Serve pages at the site root so links between the HTML files keep working.
app.use(express.static(path.join(projectRoot, 'html')));
// Serve shared assets such as /css, /images, /javascript, and /videos.
app.use(express.static(projectRoot));

app.get('/', (_request, response) => {
  response.sendFile(path.join(projectRoot, 'html', 'index.html'));
});

bootstrapAdmin().catch((error) => console.error('Admin bootstrap failed. Run database/setup.sql and check .env:', error.message));
app.listen(port, () => {
  console.log(`ICZZ site is available at http://localhost:${port}`);
});
