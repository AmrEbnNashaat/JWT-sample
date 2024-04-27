const express = require('express');
const jwt = require('jsonwebtoken');
const { accessTokenSecret, refreshTokenSecret } = require('../config/config');
const { users, refreshTokens } = require('../database/dataStore');

const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    try {
        if (user) {
            const accessToken = jwt.sign(
                { username: user.username, role: user.role }, 
                accessTokenSecret, 
                { expiresIn: '30m' } // Adjusted expiry time
            );
            const refreshToken = jwt.sign(
                { username: user.username, role: user.role }, 
                refreshTokenSecret
            );
            refreshTokens.push(refreshToken);
            res.json({ accessToken, refreshToken });
        } else {
            res.status(401).send('Username or password incorrect');
        }
    } catch (err) {
        return res.status(500).send({Error: err})
    }
    
});

// Token refresh endpoint
router.post('/token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.sendStatus(401);
    }
    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }
    try {
        const user = jwt.verify(token, refreshTokenSecret);
        const newAccessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret, { expiresIn: '30m' });
        const newRefreshToken = jwt.sign({ username: user.username, role: user.role }, refreshTokenSecret);

        // Replace the old refresh token with a new one
        const tokenIndex = refreshTokens.indexOf(token);
        if (tokenIndex > -1) refreshTokens[tokenIndex] = newRefreshToken;

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        res.sendStatus(403);
    }
});


// Logout endpoint
// Logout endpoint
router.post('/logout', (req, res) => {
    const { token } = req.body;
    const index = refreshTokens.indexOf(token);
    if (index !== -1) {
        refreshTokens.splice(index, 1); // This mutates the array in place
    }
    res.send('Logout successful');
});

module.exports = router;
