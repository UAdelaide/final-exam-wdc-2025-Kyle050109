const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const mysql = require('mysql2/promise');
const session = require('express-session');
const PORT = process.env.PORT || 8080;
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
//mySQL conncetion pool
const pool= mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'DogWalkService'});
// expose db pool
app.locals.pool = pool;
// database test to check if the conneciton is working
(async () => {
    try {
        const[rows] = await pool.query('SELECT 1');
        console.log('susscess', rows);
    } catch (error) {
        console.error('Database connection error:', error.message);
    }
}
)();
// setup session
app.use(session({
    secret:'secretkey', // session key encryption
    resave: false,     // do not save session if unmodified
    saveUninitialized: true // initialize session even if not modified
}));
// Routes loaded
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
// make the routes available to the app
app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// homepage login setting

// GET to show login page and serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// to handle login post logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // query the database to check if the user exists and password matches
        const [users] = await pool.query(
            'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
            [username, password]
        );
        if (users.length === 1){
            req.session.user = users[0]; // store user info in session
            if(users[0].role === 'owner'){
              return res.redirect('/owner');// redirect to owner dashboard if user is owner
            } else if (users[0].role === 'walker') {
              return res.redirect('/walker');// redirect to walker dashboard if user is walker
            }// login error
        }else{ return res.status(401).send("invalid username or password");
    }
        } catch (err){
            console.error(err);// catch an error
           return res.status(500).send ("server error");
    }
});
// GET/owner and to owner page (only if login and user is owner)
app.get ('/owner', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'owner-dashboard.html'));
});
// GET/walker and to walker page (only if login and user is walker)
app.get ('/walker', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'walker'){
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'walker-dashboard.html'));
});



// Export the app instead of listening here
module.exports = app;
