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
    }