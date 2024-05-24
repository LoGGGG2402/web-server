let jwt = require('../helper/jwt.helper')
let User = require('../models/user.model')
let writeLog = require('../helper/log.helper')

let authMiddleware = async (req, res, next) => {
    // Get access token from request
    let accessToken = req.cookies.accessToken || req.headers['x-access-token'] || req.headers['authorization'];
    if (!accessToken) {
        writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - No token provided.`)
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken')
        // res.clearCookie('csrfToken')
        // res.redirect('/login')
        return res.status(401).json({
            success: false,
            message: 'No token provided.'
        });
    }

    try {
        // Verify access token
        let payload = await jwt.verifyAccessToken(accessToken);
        let user = await User.findById(payload, null, null);
        if (!user) {
            // res.clearCookie('accessToken');
            // res.clearCookie('refreshToken')
            // res.clearCookie('csrfToken')
            // res.redirect('/login')
            writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - Unauthorized`)
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        req.user = user;
        next();
    } catch (err) {
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken')
        // res.clearCookie('csrfToken')
        // res.redirect('/login')
        writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - Unauthorized`)
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
}


let adminMiddleware = async (req, res, next) => {
    // Get access token from request
    let accessToken = req.headers['x-access-token'] || req.headers['authorization'] || req.cookies.accessToken;

    if (!accessToken) {
        writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - No token provided.`)
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken')
        // res.clearCookie('csrfToken')
        // res.redirect('/login')
        return res.status(401).json({
            success: false,
            message: 'Forbidden'
        });
    }

    // Verify access token
    try {
        let payload = await jwt.verifyAccessToken(accessToken);
        let user = await User.findById(payload, null, null);
        if (!user) {
            writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - Unauthorized`)
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken')
            res.clearCookie('csrfToken')
            res.redirect('/login')
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }
        req.user = user;
        next();
    } catch (err) {
        writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - Unauthorized`)
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken')
        // res.clearCookie('csrfToken')
        // res.redirect('/login')
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });

    }
}

module.exports = {
    authMiddleware,
    adminMiddleware
}