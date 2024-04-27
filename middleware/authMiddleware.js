const jwt = require('jsonwebtoken');
// In authMiddleware.js
const { accessTokenSecret } = require('../config/config');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) return res.sendStatus(403);
  
      const currentTime = Math.floor(Date.now() / 1000); // Get current time in Unix timestamp
    //   console.log("Curernt Time: ", currentTime)
      if (currentTime > user.exp) {
        // console.log("IN CONDITION")
        // console.log('Token has expired');
        return res.sendStatus(401);
      }
  
      console.log(user); // Log the decoded user
      req.user = user;
      next();
    });
}

// Middleware to check for admin role
function isAdmin(req, res, next) {
    if (req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only admin can perform this action.' });
    }
}

function validateLeadUpdate(req, res, next) {
    const { companyName, contactInfo, productInterest } = req.body;
    if (!companyName || !contactInfo || !productInterest) {
        return res.status(400).send('All fields are required');
    }
    next();
}

  

module.exports = {authenticateToken, isAdmin, validateLeadUpdate};
