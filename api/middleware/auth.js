// Authentication middleware

const User = require('../models/User');

// Simple authentication middleware
const authenticate = (req, res, next) => {
  // For demo purposes, we'll check for a simple token in the header
  // In a real application, this would validate a JWT or session token
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Extract token (format: "Bearer token")
  const token = authHeader.split(' ')[1];
  
  // For demo, we'll use a simple token validation
  // In a real application, this would decode and validate a JWT
  if (token === 'demo-token') {
    // Attach user to request object
    req.user = User.findById(1);
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid token' });
};

// Simple login endpoint
const login = (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = User.validateCredentials(email, password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // In a real application, we would generate a JWT token
  // For demo purposes, we'll use a simple token
  res.json({
    user,
    token: 'demo-token'
  });
};

module.exports = {
  authenticate,
  login
};