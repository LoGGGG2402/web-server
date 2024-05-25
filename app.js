// package
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
// let cors = require('cors');
let requestIp = require('request-ip');
let rateLimit = require('express-rate-limit');

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
// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     optionsSuccessStatus: 200
// }));

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//     headers: true,
//     handler: (req, res) => {
//       const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
//       res.set('Retry-After', retryAfter);
//       res.status(429).json({
//         success: false,
//         message: `You have sent too many requests. Please try again after ${retryAfter} seconds.`,
//       });
//     },
//   }));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());


// routes
app.use('/api', apiRouter);
app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
