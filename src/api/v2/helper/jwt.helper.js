const crypto = require('crypto');
const jwtHelper = require('jsonwebtoken');

let encrypt = (payload) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, process.env.SALT, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedPayload = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encryptedPayload += cipher.final('hex');
    encryptedPayload = `${iv.toString('hex')}:${encryptedPayload}`;
    return encryptedPayload;

}

let decrypt = (encryptedPayload) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, process.env.SALT, 32);
    const [iv, encrypted] = encryptedPayload.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decryptedPayload = decipher.update(encrypted, 'hex', 'utf8');
    decryptedPayload += decipher.final('utf8');
    return JSON.parse(decryptedPayload);

}

let signAccessToken = (payload) => {
    return new Promise((resolve, reject) => {
        // Encrypt payload
        const encryptedPayload = encrypt(payload);

        // Encode encrypted payload with secret key
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No access token secret provided'));
        }
        const options = {
            // expires in 15 minutes
            expiresIn: '15m',
            issuer: 'localhost'
        };
        jwtHelper.sign({data: encryptedPayload}, secret, options, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);
        });
    });
}

// Verify access token and return decrypted payload
let verifyAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No access token secret provided'));
        }
        jwtHelper.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            }
            resolve(decrypt(decoded.data));
        });
    });
}

let signRefreshToken = (payload) => {
    return new Promise((resolve, reject) => {
        // Encrypt payload
        const encryptedPayload = encrypt(payload);

        // Encode encrypted payload with secret key
        const secret = process.env.REFRESH_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No refresh token secret provided'));
        }
        const options = {
            // expires in 7 days
            expiresIn: '7d',
            issuer: 'localhost'
        };
        jwtHelper.sign({data: encryptedPayload}, secret, options, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);
        });
    });
}

// Verify refresh token and return decrypted payload
let verifyRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        const secret = process.env.REFRESH_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No refresh token secret provided'));
        }
        jwtHelper.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            }
            resolve(decrypt(decoded.data));
        });
    });
}

let signResetToken = (payload) => {
    return new Promise((resolve, reject) => {
        // Encrypt payload
        const encryptedPayload = encrypt(payload);

        // Encode encrypted payload with secret key
        const secret = process.env.RESET_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No reset token secret provided'));
        }
        const options = {
            // expires in 15 minutes
            expiresIn: '15m',
            issuer: 'localhost'
        };
        jwtHelper.sign({data: encryptedPayload}, secret, options, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);
        });
    });
}

let verifyResetToken = (token) => {
    return new Promise((resolve, reject) => {
        const secret = process.env.RESET_TOKEN_SECRET;
        if (!secret) {
            reject(new Error('No reset token secret provided'));
        }
        jwtHelper.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            }
            resolve(decrypt(decoded.data));
        });
    });
}


module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    signResetToken,
    verifyResetToken
}

