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

// add a logout route to clear session and redirect to homepage
app.get ('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('logout error:', err);// if destoty session fails still can redirect to homepage
            return res.status(500).send('logout failed');
        }
        res.clearCookie ('connect.sid'); // clear session cookie
        res.redirect('/'); // redirect to homepage
    });
});

// define a GET route to get the list of dogs for the logged-in user
app.get('/api/users/my-dogs', async (req, res) => {
    // get user info from session
    const user = req.session.user;
    // if user not logging in or not an owner then return unauthorized
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    try {
        // query the database to get the name and id of the dog of the current user
        const [rows] = await pool.query(
            'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
            [user.user_id]// use the userid as the query parameter
        );// return the results in json to the frontend
        res.json(rows);
    } catch (error) {// if fails to quert then return a 500 error
        console.error(err);
        res.status(500).send('failed to fetch dogs');
    }
}
);

// define a GETroute/api/users/me to obatin the userid of the currently logged-in user (return JSON)
app.get('/api/users/me', (req, res) => {
    // if there is logged in user in the session return the user_id and encapsulate as a JSON object
    if (!req.session.user) {
       res.json({user_id: req.session.user.user_id});
    }else{
        // otherwise return a 401 Unauthorized error to show the user is not logginn
        // or the session is not valid
        res.status(401).json({error: 'Unauthorized'});
    }
});

// new /api/dogs route from part1/app.js (did any modification)
app.get('/api/dogs', async (req, res) => {
    try {
        // user await async to query the dogs table in the database and obtain the info
        const[rows] = await pool.query(
            `SELECT d.dog_id,d.name, d.size, d.owner_id
            FROM Dogs d`
        );
    // return the results in json format
        res.json(rows);
    }catch (error) {
        // error handling
        console.error('Error in /api/dogs:', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
});
// Export the app instead of listening here
module.exports = app;
