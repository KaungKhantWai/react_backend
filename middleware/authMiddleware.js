const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return process.env.JWT_SECRET;
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
    if (!decoded?.id) {
      return res.status(403).json({ message: 'Invalid token payload.' });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }

    if (error.message === 'JWT_SECRET is not defined in environment variables') {
      return res.status(500).json({ message: error.message });
    }

    return res.status(403).json({ message: 'Invalid token.' });
  }

  try {
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    return next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
