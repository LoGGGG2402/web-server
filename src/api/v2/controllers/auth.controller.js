let jwt = require('../helper/jwt.helper');
let bcrypt = require('bcrypt');
let {isEmail, isStrongPassword} = require('validator');
let sendEmail = require('../helper/email.helper');

let User = require('../models/user.model');


// Support functions
// Generate access token and refresh token
const generateToken = async (user) => {
    let accessToken = await jwt.signAccessToken(user._id);
    let refreshToken = await jwt.signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.last_login = Date.now();
    user.save()

    return {accessToken, refreshToken};
}


// Login controller
// POST /api/v2/auth/login
// Request body: { email, password, remember }
// Response body: { message, username, _id, accessToken, refreshToken }
exports.login = async (req, res) => {
    let {email, password, remember} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Missing required fields'});
    }
    User.findOne({email: email}, null, null)
        .then(async (user) => {
            if (!user) {
                return res.status(404).json({message: 'User not found'});
            }
            if (user.waits_until > Date.now()) {
                return res.status(429).json({message: 'Too many login attempts. Try again later'});
            }
            let isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                user.login_attempts += 1;
                if (user.login_attempts >= 5) {
                    user.waits_until = Date.now() + Math.pow(2, user.login_attempts - 5) * 1000 * 60; // 2^(attempts-5) minutes
                }
                await user.save();
                return res.status(401).json({message: 'Invalid credentials'});
            }
            if (user.status.toString() !== 'active') {
                return res.status(403).json({message: `User is ${user.status}`});
            }
            user.login_attempts = 0;

            await user.save();

            let tokens = await generateToken(user);
            let options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            };
            if (remember) {
                options.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            }
            res.cookie('accessToken', tokens.accessToken, options);
            res.cookie('refreshToken', tokens.refreshToken, options);
            return res.status(200).json({
                message: 'Login successful',
                username: user.username,
                _id: user._id,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        })
        .catch((error) => {
            if (process.env.NODE_ENV === 'development')
                console.log(error);
            return res.status(500).json({message: 'Internal server error'});
        });
}


// Register controller
// POST /api/v2/auth/register
// Request body: { username, password, email, full_name }
exports.register = async (req, res) => {
    let {username, password, email, full_name} = req.body;
    if (!username || !password || !email || !full_name) {
        return res.status(400).json({message: 'Missing required fields'});
    }
    if (!isEmail(email)) {
        return res.status(400).json({message: 'Invalid email address'});
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({message: 'Password is too weak'});
    }
    try {
        let user = await User.findOne({
            email: email
        }, null, null);
        if (user) {
            return res.status(400).json({message: 'Email already exists'});
        }
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.status(500).json({message: err.message});
                }
                let newUser = new User({
                    username: username,
                    password: hash,
                    email: email,
                    full_name: full_name
                });
                await newUser.save();
                // send email with verification link to activate account
                let verificationToken = await jwt.signEmailVerificationToken(newUser._id)
                let verificationLink = `${process.env.CLIENT_URL}/verify/${verificationToken}`;
                let subject = 'Account Verification';
                let text = `Click on the link to verify your account: ${verificationLink}`;
                let html = `<p>Click <a href="${verificationLink}">here</a> to verify your account</p>`;
                sendEmail(email, subject, text, html).then()
                return res.status(201).json({message: 'User created successfully'});
            });



        });
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
}


// Logout controller
// POST /api/v2/auth/logout
exports.logout = async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        null
    )
        .then(() => {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json({message: 'Logout successful'});
        })
        .catch((error) => {
            if (process.env.NODE_ENV === 'development')
                console.log(error);
            return res.status(500).json({message: 'Internal server error'});
        });
}

// Refresh token controller
// POST /api/v2/auth/refresh-token
exports.refreshToken = async (req, res) => {
    let refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
    if (!refreshToken) {
        return res.status(400).json({message: 'Refresh token is required'});
    }
    try {
        let payload = await jwt.verifyRefreshToken(refreshToken);
        let user = await User.findById(payload, null, null);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        if (user.refreshToken !== refreshToken) {
            return res.status(403).json({message: 'Invalid refresh token'});
        }
        let tokens = await generateToken(user);
        let options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        };
        res.cookie('accessToken', tokens.accessToken, options);
        res.cookie('refreshToken', tokens.refreshToken, options);
        return res.status(200).json({message: 'Token refreshed'});
    } catch (error) {
        if (process.env.NODE_ENV === 'development')
            console.log(error);
        return res.status(403).json({message: 'Forbidden'});
    }
}


// Reset password controller
// POST /api/v2/auth/forgot-password
// Request body: { email }
exports.forgotPassword = async (req, res) => {
    let {email} = req.body;
    if (!email) {
        return res.status(400).json({message: 'Email is required'});
    }
    if (!isEmail(email)) {
        return res.status(400).json({message: 'Invalid email address'});
    }
    try {
        let user = await User.findOne({
            email: email
        }, null, null);
        if (!user) {
            return res.status(200).json({message: 'Reset link sent to your email'});
        }
        // send email with reset link
        let resetToken = await jwt.signResetToken(user._id);
        let resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        let subject = 'Reset Password';
        let text = `Click on the link to reset your password: ${resetLink}`;
        let html = `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`;
        sendEmail(email, subject, text, html).then()
        return res.status(200).json({message: 'Reset link sent to your email'});
    } catch (error) {
        if (process.env.NODE_ENV === 'development')
            console.log(error);
        return res.status(500).json({message: 'Internal server error'});
    }
}


// Reset password controller
// PATCH /api/v2/auth/reset-password/:token
// Request body: { password }
exports.resetPassword = async (req, res) => {
    let {password} = req.body;
    if (!password) {
        return res.status(400).json({message: 'Password is required'});
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({message: 'Password is too weak'});
    }
    try {
        let payload = await jwt.verifyResetToken(req.params.token);
        let user = await User.findById(payload, null, null);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        for (let old_password of user.old_passwords) {
            let isMatch = await bcrypt.compare(password, old_password);
            if (isMatch) {
                return res.status(400).json({message: 'Password already used'});
            }
        }
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    return res.status(500).json({message: err.message});
                }
                await User.findByIdAndUpdate(
                    user._id,
                    {
                        password: hash,
                        $unset: {
                            resetToken: 1 // this removes the field from document
                        },
                        old_passwords: [...user.old_passwords, user.password]
                    },
                    null
                );
                return res.status(200).json({message: 'Password reset successful'});
            });
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development')
            console.log(error);
        return res.status(403).json({message: 'Forbidden'});
    }
}


// Verify email controller
// PATCH /api/v2/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
    try {
        let payload = await jwt.verifyEmailVerificationToken(req.params.token);
        let user = await User.findByIdAndUpdate(
            payload,
            {status: 'active'},
            {new: true}
        );
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        return res.status(200).json({message: 'Email verified'});
    }
    catch (error) {
        if (process.env.NODE_ENV === 'development')
            console.log(error);
        return res.status(403).json({message: 'Forbidden'});
    }
}
