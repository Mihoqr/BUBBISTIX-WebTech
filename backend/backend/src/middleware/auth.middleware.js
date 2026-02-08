import jwt from "jsonwebtoken";

// Middleware to authenticate requests using JWT
const authMiddleware = (req, res, next) => {
  try {
    // Read Authorization header
    const authHeader = req.headers.authorization;

    // Block request if token is missing or malformed
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: Missing token"
      });
    }

    // Extract JWT from header
    const token = authHeader.split(" ")[1];

    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach authenticated user data to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    // Continue to protected route
    next();

  } catch (error) {
    // Handle invalid or expired tokens
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token"
    });
  }
};

export default authMiddleware;