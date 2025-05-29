const { Pool } = require('pg');
const fs = require('fs');
const cars = JSON.parse(fs.readFileSync('./cars.json', 'utf8'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create cars table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        chance INTEGER NOT NULL,
        value INTEGER NOT NULL,
        total_owners INTEGER DEFAULT 0
      );
    `);

    // Create inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(user_id),
        car_id INTEGER REFERENCES cars(id),
        obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Populate cars table from cars.json
    for (const car of cars.cars) {
      await pool.query(`
        INSERT INTO cars (id, name, emoji, chance, value)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [car.id, car.name, car.emoji, car.chance, car.value]);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  pool,
  initializeDatabase
}; 