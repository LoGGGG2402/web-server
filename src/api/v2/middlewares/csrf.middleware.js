let csrf = require('../helper/csrf.helper')
let writeLog = require('../helper/log.helper')


let csrfMiddleware = async (req, res, next) => {
    // Get CSRF token from request
    let csrfToken = req.headers['csrf-token']
    if (!csrfToken) {
        writeLog.error(`[${req.clientIp}] - [${req.originalUrl}] - [${req.method}] - [${req.protocol}] - No CSRF token provided.`)
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken')
        // res.clearCookie('csrfToken')
        // res.redirect('/login')
        return res.status(401).json({
            success: false,
            message: 'No CSRF token provided.'
        });
    }

    try {
        // Verify CSRF token
        let check = await csrf.verifyCSRFToken(csrfToken);
        if (!check) {
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
        //req.user = user;

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


module.exports = csrfMiddleware
