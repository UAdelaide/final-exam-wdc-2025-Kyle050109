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

// obtain all the info of the dogs with their owners
app.get('/api/dogs', async (req, res) => {
    try {// query the database to get all dogs and their owners
        const[rows] = await pool.query(
            `SELECT d.name AS dog_name, d.size, u.username AS owner_username
            FROM Dogs d
            JOIN Users u ON d.owner_id = u.user_id;`
        );// send the result as JSON
        res.json(rows);
    }catch (error) {
        console.error('Error in /api/dogs:', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

// get the list of dogs with open status
app.get('/api/walkrequests/open', async (req, res) => {
    try{// query the database to get all open walk requests
        const[rows] = await pool.query(`
            SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
            wr.duration_minutes, wr.location, u.username AS owner_username
            FROM WalkRequests wr
            JOIN Dogs d ON wr.dog_id = d.dog_id
            JOIN Users u ON d.owner_id = u.user_id
            WHERE wr.status = 'open';
        `);// send the result as JSON
        res.json(rows);
    } catch (error) {
        console.error('Error in /api/walkrequests/open:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// get the list of walkers with their summary
app.get('/api/walkers/summary', async (req, res) => {
    try{// query the database to get the summary of walkers
        const [rows] = await pool.query(`
            SELECT u.username AS walker_username,
            COUNT(r.rating_id) AS total_ratings,
            ROUND(AVG(r.rating), 1) AS average_rating,
            (SELECT COUNT (*) FROM WalkRequests wr
            JOIN WalkApplications wa ON wr.request_id = wa.request_id
            WHERE wa.walker_id = u.user_id AND wr.status = 'completed') AS completed_walks
            FROM Users u
            LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
            WHERE u.role = 'walker'
            GROUP BY u.user_id
        `);// send the result as JSON
        res.json(rows);
    } catch (error) {
        console.error('Error in /api/walkers/summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});