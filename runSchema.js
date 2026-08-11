require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const env = process.env;
    const DB_HOST = env.DB_HOST || 'localhost';
    const DB_USER = env.DB_USER || 'root';
    const DB_PASSWORD = env.DB_PASSWORD || '';
    const DB_NAME = env.DB_NAME || 'CRUD';

    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });

    // Ensure database exists and then run the script inside it
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);

    await connection.query(sql);
    console.log('Schema aplicado com sucesso em', DB_NAME);
    await connection.end();
  } catch (err) {
    console.error('Erro aplicando schema:', err.message || err);
    process.exit(1);
  }
})();
