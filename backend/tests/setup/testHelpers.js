import bcrypt from "bcrypt";
import { User } from "../../backend/src/models/user.model.js";
import { generateToken } from "../../backend/src/utils/jwt.js";

// Creates a regular user in the test DB and returns the user + a valid JWT.
// Use this in integration / security tests wherever an authenticated user is needed.
export async function createTestUser(overrides = {}) {
  const password_hash = await bcrypt.hash("TestPass1!", 10);

  const user = await User.create({
    username: overrides.username ?? "testuser",
    full_name: overrides.full_name ?? "Test User",
    email: overrides.email ?? "test@example.com",
    password_hash,
    role: overrides.role ?? "USER",
    ...overrides
  });

  const token = generateToken({ id: user._id, role: user.role });
  return { user, token };
}

// Creates an ADMIN user in the test DB and returns the user + a valid JWT.
export async function createAdminUser(overrides = {}) {
  return createTestUser({ ...overrides, role: "ADMIN", username: overrides.username ?? "adminuser", email: overrides.email ?? "admin@example.com" });
}

// Returns an Authorization header object for use with supertest.
// Example: request(app).get("/route").set(authHeader(token))
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Default valid registration payload. Override any field as needed.
export function validRegisterPayload(overrides = {}) {
  return {
    username: "newuser",
    full_name: "New User",
    email: "new@example.com",
    password: "NewPass1!",
    ...overrides
  };
}
