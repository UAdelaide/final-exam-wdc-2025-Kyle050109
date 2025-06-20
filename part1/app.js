const express = require ('express');
const app = express();
const mysql = require('mysql2/promise');
const port = 8080;

const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'DogWalkService'
};

let pool;
(async () => {
    try{
        pool = await mysql.createPool(dbConfig);
        console.log('MySQL pool created');

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to initialze server:', err.message);
    }
})();


app.get('/api/dogs', async (req, res) => {
    try {
        const[rows] = await pool.query(
            `SELECT d.name AS dog_name, d.size, u.username AS owner_username
            FROM Dogs d
            JOIN Users u ON d.owner_id = u.user_id;`
        );
        res.json(rows);
    }catch (error) {
        console.error('Error in /api/dogs:', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try{
        const[rows]
    }