// package
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cors = require('cors');
let requestIp = require('request-ip');

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

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

// middleware
// app.use(cors({
//     origin: "*",
//     credentials: true,
//     optionsSuccessStatus: 200
// }));
// app.use(cors());

// location /api {
//     proxy_pass http://localhost:3000;
//     proxy_http_version 1.1;
//     proxy_set_header Upgrade $http_upgrade;
//     proxy_set_header Connection 'upgrade';
//     proxy_set_header Host $host;
//     proxy_cache_bypass $http_upgrade;
//     add_header 'Access-Control-Allow-Origin' '*';
//     add_header 'Access-Control-Allow-Credentials' 'true';
//     add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
//     add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
// }

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range');
    next();
})

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
