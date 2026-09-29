const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'careerforge_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  connectTimeout: 3000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Helper for executing queries with automatic connection handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper for transaction execution
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Test connection function with timeout
const testConnection = async () => {
  try {
    const connectPromise = pool.getConnection();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout (MySQL service offline or unreachable)')), 3000)
    );

    const connection = await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.warn(`⚠️ MySQL Connection Warning: ${error.message}`);
    console.warn('Please ensure MySQL server is running and database configuration in .env is correct.');
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
