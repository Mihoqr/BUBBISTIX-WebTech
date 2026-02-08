import jwt from "jsonwebtoken";

// Generate a signed JWT with an expiration
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

// Verify and decode a JWT using the app secret
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};