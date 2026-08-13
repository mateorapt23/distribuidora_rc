require('dotenv').config({ path: '.env.test' });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hash = await bcrypt.hash('admin123', 10);

  const res = await pool.query(
    "UPDATE usuarios SET password = $1 WHERE username = 'admin' RETURNING username, password",
    [hash]
  );

  console.log('Actualizado:', res.rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});