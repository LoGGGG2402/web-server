// package
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cors = require('cors');

require('dotenv').config();

// personal package
let connect = require('./src/config/mongo');
connect().then(() => {
    console.log('MongoDB connected');
});
let configPw = require('./src/config/configPw');
configPw();

// routes
let apiRouter = require('./src/api/versionRouter');

// app
let app = express();


// middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// routes
app.use('/api', apiRouter);
app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
