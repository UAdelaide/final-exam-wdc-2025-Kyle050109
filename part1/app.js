const express = require ('express');
const app = express();
const mysql = require('mysql2/promise');
const port = 8080;

const dbConfig = {
    host: '127.0'