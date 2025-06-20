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

const pool= mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'DogWalkService'});

app.locals.pool = pool;
// setup
app.use(session({
    secret:'secretkey',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// homepage
app.get('/', (req, res) => {
    res.render('index', { error: null });
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
// Export the app instead of listening here
module.exports = app;
