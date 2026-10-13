require('dotenv').config();

const express = require('express');
const path = require('node:path');
const { getPool } = require('./database');

const app = express();
const port = process.env.PORT || 3000;
const projectRoot = __dirname;
app.use(express.json());

app.get('/api/products/graduation-cd', async (_request, response) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('pagePath', require('mssql').NVarChar(150), 'product8.html')
      .query(`SELECT Id AS id, Name AS name, Description AS description,
                     Price AS price, ImagePath AS imagePath, PagePath AS pagePath
              FROM dbo.Products WHERE PagePath = @pagePath`);

    if (!result.recordset[0]) {
      return response.status(404).json({ error: 'Graduation CD was not found. Run database/setup.sql first.' });
    }
    response.json(result.recordset[0]);
  } catch (error) {
    console.error('Could not load Graduation CD:', error.message);
    response.status(503).json({ error: 'Could not load product. Check the SQL Server setup.' });
  }
});

app.put('/api/products/graduation-cd', async (request, response) => {
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
      .input('pagePath', sql.NVarChar(150), 'product8.html')
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
      return response.status(404).json({ error: 'Graduation CD was not found. Run database/setup.sql first.' });
    }
    response.json(result.recordset[0]);
  } catch (error) {
    console.error('Could not save Graduation CD:', error.message);
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

app.listen(port, () => {
  console.log(`ICZZ site is available at http://localhost:${port}`);
});
