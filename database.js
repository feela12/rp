const sql = require('mssql');

let poolPromise;

function getPool() {
  if (!process.env.SQL_SERVER || !process.env.SQL_DATABASE) {
    throw new Error('Missing SQL_SERVER or SQL_DATABASE in .env');
  }

  if (!poolPromise) {
    const config = {
      server: process.env.SQL_SERVER,
      port: Number(process.env.SQL_PORT || 1433),
      database: process.env.SQL_DATABASE,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      options: {
        encrypt: process.env.SQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true',
      },
    };

    poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
}

module.exports = { getPool };
