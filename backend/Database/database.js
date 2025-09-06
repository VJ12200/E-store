import 'colors';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!'.green.bold);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:'.red.bold, error.message.red);
    return false;
  }
};

export default pool;