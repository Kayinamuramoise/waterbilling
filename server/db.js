const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        // Create database if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.end();

        // Connect to the specific database
        const db = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Create tables
        await db.query(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS Customers (
                cust_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS Meters (
                meter_id INT AUTO_INCREMENT PRIMARY KEY,
                cust_id INT NOT NULL,
                reading DECIMAL(10, 2) NOT NULL,
                date_recorded DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cust_id) REFERENCES Customers(cust_id) ON DELETE CASCADE
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS Bills (
                bill_id INT AUTO_INCREMENT PRIMARY KEY,
                cust_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'paid') DEFAULT 'pending',
                FOREIGN KEY (cust_id) REFERENCES Customers(cust_id) ON DELETE CASCADE
            );
        `);

        console.log("Database initialized successfully!");
        return db;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
}

let dbInstance;

module.exports = {
    getDb: async () => {
        if (!dbInstance) {
            dbInstance = await initDB();
        }
        return dbInstance;
    }
};
