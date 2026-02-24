import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Prevent password login for Google accounts
    if (user.auth_provider === "GOOGLE") {
      return res.status(400).json({
        message: "Please login using Google"
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

// Google Sign-In / Sign-Up
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required"
      });
    }

    // Verify ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({
        message: "Invalid Google token"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    // Clean Google name into base username (for the default username of Google users)
    let baseUsername = name
      .toLowerCase()
      .replace(/\s+/g, "")           // remove spaces
      .replace(/[^a-z0-9_]/g, "")    // remove invalid chars
      .slice(0, 20);                 // enforce max length

    if (!baseUsername) {
      baseUsername = "user";
    }

    // Ensure uniqueness
    let generatedUsername = baseUsername;
    let counter = 0;

    while (await User.findOne({ username: generatedUsername })) {
      counter++;

      const suffix = counter.toString();

      // ensure total length <= 20
      generatedUsername =
        (baseUsername.slice(0, 20 - suffix.length) + suffix);
    }

    // If no user exists yet, create new user
    if (!user) {
      user = await User.create({
        username: generatedUsername, // Auto generate a unique username for the Google user
        full_name: name,
        email,
        password_hash: null,
        auth_provider: "GOOGLE",
        role: "USER"
      });
    }

    // Generate system JWT
    const token = generateToken({
      id: user._id,
      role: user.role
    });

    return res.status(200).json({
      message: "Google authentication successful",
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
    console.error("Google auth error:", error);

    return res.status(401).json({
      message: "Google authentication failed"
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
  googleAuth,
  logoutUser,
  getMe,
  resetPassword
};