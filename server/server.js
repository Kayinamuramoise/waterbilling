const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RATE_PER_UNIT = 500; // 500 RWF per unit

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
};

// Initialize DB and start server
let db;
getDb().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});


app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO Users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);

        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- Customer Routes ---
app.get('/api/customers', authenticateToken, async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM Customers ORDER BY cust_id DESC');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
    try {
        const { name, address } = req.body;
        if (!name || !address) return res.status(400).json({ error: "Name and address required" });

        const [result] = await db.query('INSERT INTO Customers (name, address) VALUES (?, ?)', [name, address]);
        res.status(201).json({ id: result.insertId, name, address });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM Customers WHERE cust_id = ?', [req.params.id]);
        res.json({ message: "Customer deleted" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
    try {
        const { name, address } = req.body;
        if (!name || !address) return res.status(400).json({ error: "Name and address required" });

        await db.query('UPDATE Customers SET name = ?, address = ? WHERE cust_id = ?', [name, address, req.params.id]);
        res.json({ message: "Customer updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- Meter & Billing Routes ---
app.get('/api/meters', authenticateToken, async (req, res) => {
    try {
        const [meters] = await db.query(`
            SELECT m.*, c.name as customer_name 
            FROM Meters m 
            JOIN Customers c ON m.cust_id = c.cust_id 
            ORDER BY m.date_recorded DESC
        `);
        res.json(meters);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/meters', authenticateToken, async (req, res) => {
    try {
        const { cust_id, reading } = req.body;
        if (!cust_id || reading === undefined) return res.status(400).json({ error: "cust_id and reading are required" });

        // Get previous reading to calculate usage
        const [previousReadings] = await db.query(
            'SELECT reading FROM Meters WHERE cust_id = ? ORDER BY date_recorded DESC LIMIT 1',
            [cust_id]
        );

        let previousReading = 0;
        if (previousReadings.length > 0) {
            previousReading = parseFloat(previousReadings[0].reading);
        }

        const currentReading = parseFloat(reading);
        if (currentReading < previousReading) {
            return res.status(400).json({ error: "New reading cannot be lower than the previous reading" });
        }

        const usage = currentReading - previousReading;
        const billAmount = usage * RATE_PER_UNIT;

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert Meter Reading
            await connection.query('INSERT INTO Meters (cust_id, reading) VALUES (?, ?)', [cust_id, currentReading]);

            // Insert Bill
            if (billAmount > 0) {
                await connection.query('INSERT INTO Bills (cust_id, amount) VALUES (?, ?)', [cust_id, billAmount]);
            }

            await connection.commit();
            res.status(201).json({ message: "Reading added and bill generated", usage, billAmount });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete('/api/meters/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM Meters WHERE meter_id = ?', [req.params.id]);
        res.json({ message: "Meter reading deleted" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- Bills & Reports Routes ---
app.get('/api/bills', authenticateToken, async (req, res) => {
    try {
        const [bills] = await db.query(`
            SELECT b.*, c.name as customer_name 
            FROM Bills b 
            JOIN Customers c ON b.cust_id = c.cust_id 
            ORDER BY b.date DESC
        `);
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put('/api/bills/:id/pay', authenticateToken, async (req, res) => {
    try {
        await db.query("UPDATE Bills SET status = 'paid' WHERE bill_id = ?", [req.params.id]);
        res.json({ message: "Bill marked as paid" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete('/api/bills/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM Bills WHERE bill_id = ?', [req.params.id]);
        res.json({ message: "Bill deleted" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/reports/dashboard', authenticateToken, async (req, res) => {
    try {
        const [customers] = await db.query('SELECT COUNT(*) as count FROM Customers');
        const [pendingBills] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM Bills WHERE status = 'pending'");
        const [paidBills] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM Bills WHERE status = 'paid'");

        res.json({
            totalCustomers: customers[0].count,
            pendingBillsCount: pendingBills[0].count,
            pendingBillsTotal: pendingBills[0].total,
            paidBillsCount: paidBills[0].count,
            paidBillsTotal: paidBills[0].total
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
