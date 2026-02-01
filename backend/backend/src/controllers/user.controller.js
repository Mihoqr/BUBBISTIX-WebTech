import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Register a User
const registerUser = async (req, res) => {
  try {
    const { username, full_name, email, password } = req.body;

    // Basic required-field validation
    if (!username || !full_name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // Password strength validation
    if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character"
    });
  }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username already in use"
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      full_name,
      email,
      password_hash
    });

    // Respond (password is never returned)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        full_name: newUser.full_name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0].message;

      return res.status(400).json({
        message: firstError
      });
    }

    // Duplicate key error (email / username)
    if (error.code === 11000) {
        return res.status(409).json({
        message: "Email or username already exists"
        });
    }

    return res.status(500).json({
        message: "Server error"
    });
    }
};

// Login a User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Generate JWT for authenticated session
    const token = generateToken({
      id: user._id,
      role: user.role
    });

    // Successful login response with token
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// Logout a User
const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// Get currently authenticated user with JWT
const getMe = async (req, res) => {
  try {
    // User ID injected by auth middleware
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "_id username full_name email role created_at"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user
    });

  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// Request password reset (mock)
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Email is required to request reset
    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    // Check if user exists and never reveal whether the user exists)
    const user = await User.findOne({ email });

    // soon: generate token + send email
    // now: simulate success response

    // Simulated success response
    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  resetPassword
};