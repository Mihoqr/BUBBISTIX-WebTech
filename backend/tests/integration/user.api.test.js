import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../../backend/src/app.js";
import { User } from "../../backend/src/models/user.model.js";
import { createTestUser, authHeader, validRegisterPayload } from "../setup/testHelpers.js";

//  Integration Tests — User API
//  Hits the real Express routes + MongoDB (in-memory)
//  to verify the full request-response pipeline.
//
//  Routes tested:
//    POST  /api/v1/users/register
//    POST  /api/v1/users/login
//    POST  /api/v1/users/googleAuth
//    POST  /api/v1/users/logout
//    GET   /api/v1/users/getMe
//    POST  /api/v1/users/resetPassword
//    POST  /api/v1/users/setNewPassword
//    PATCH /api/v1/users/updateAvatar

const BASE = "/api/v1/users";

//  REGISTER
describe("POST /register", () => {

  it("registers a new user and returns 201 with user data", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload());

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
    expect(res.body.user).toMatchObject({
      username: "newuser",
      email: "new@example.com"
    });
    // Password must never be exposed
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns 409 when the same email is registered twice", async () => {
    await request(app).post(`${BASE}/register`).send(validRegisterPayload());
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload());

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
  });

  it("returns 409 when the same username is registered twice", async () => {
    await request(app).post(`${BASE}/register`).send(validRegisterPayload());
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ email: "other@example.com" }));

    expect(res.status).toBe(409);
  });

  it("returns 400 when a required field is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ username: "onlyusername" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for a weak password (no uppercase)", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ password: "weakpassword1!" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });

  it("returns 400 for a weak password (no special character)", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ password: "WeakPassword1" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ password: "Sh0rt!" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email format", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ email: "not-an-email" }));

    expect(res.status).toBe(400);
  });

  it("accepts a strong password and responds 201", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validRegisterPayload({ password: "StrongPass1@" }));

    expect(res.status).toBe(201);
  });
});

//  LOGIN
describe("POST /login", () => {

  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(validRegisterPayload());
  });

  it("returns 200 with a JWT token on valid credentials", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "new@example.com", password: "NewPass1!" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("new@example.com");
  });

  it("returns 401 for a wrong password", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "new@example.com", password: "WrongPass1!" });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it("returns 401 for a non-existent email", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "nobody@example.com", password: "SomePass1!" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when email is not provided", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ password: "NewPass1!" });

    expect(res.status).toBe(400);
  });

  it("does NOT expose the password_hash in the login response", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "new@example.com", password: "NewPass1!" });

    expect(res.body.user?.password_hash).toBeUndefined();
  });

  it("returns 400 when a Google-registered account tries to log in with a password", async () => {
    await User.create({
      username: "googleuser",
      full_name: "Google User",
      email: "google@example.com",
      password_hash: null,
      auth_provider: "GOOGLE",
      role: "USER"
    });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "google@example.com", password: "SomePass1!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/google/i);
  });
});

//  GOOGLE AUTH
describe("POST /googleAuth", () => {

  it("returns 400 when the credential field is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/googleAuth`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/credential is required/i);
  });

  it("returns 401 when a fake/invalid Google credential string is sent", async () => {
    const res = await request(app)
      .post(`${BASE}/googleAuth`)
      .send({ credential: "this.is.a.completely.fake.google.token" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/authentication failed/i);
  });
});

//  LOGOUT
describe("POST /logout", () => {

  it("returns 200 with a success message for an authenticated user", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .post(`${BASE}/logout`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logout successful/i);
  });

  it("returns 401 when logging out without a token", async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(401);
  });
});

//  GET ME
describe("GET /getMe", () => {

  it("returns the authenticated user's profile", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .get(`${BASE}/getMe`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "testuser",
      email: "test@example.com"
    });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(app).get(`${BASE}/getMe`);
    expect(res.status).toBe(401);
  });

  it("returns 401 when an invalid token is sent", async () => {
    const res = await request(app)
      .get(`${BASE}/getMe`)
      .set({ Authorization: "Bearer invalidtoken" });

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user is deleted after their token was issued", async () => {
    const { user, token } = await createTestUser();
    await User.findByIdAndDelete(user._id);

    const res = await request(app)
      .get(`${BASE}/getMe`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

//  RESET PASSWORD
describe("POST /resetPassword", () => {

  it("returns 200 for a registered email", async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post(`${BASE}/resetPassword`)
      .send({ email: user.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it("returns 200 even for a NON-existent email (prevents enumeration)", async () => {
    const res = await request(app)
      .post(`${BASE}/resetPassword`)
      .send({ email: "doesnotexist@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it("returns 400 when email field is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/resetPassword`)
      .send({});

    expect(res.status).toBe(400);
  });
});

//  SET NEW PASSWORD
describe("POST /setNewPassword", () => {

  // Plants a real reset token into a fresh user's DB record
  async function createUserWithResetToken() {
    const { user } = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.password_reset_token = hashedToken;
    user.password_reset_expires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    return { user, rawToken };
  }

  it("returns 200 and resets the password when a valid token is provided", async () => {
    const { rawToken } = await createUserWithResetToken();

    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "BrandNew1!" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/successfully reset/i);
  });

  it("clears the reset token from the database after a successful reset", async () => {
    const { user, rawToken } = await createUserWithResetToken();

    await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "Cleared1!" });

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.password_reset_token).toBeUndefined();
    expect(updatedUser.password_reset_expires).toBeUndefined();
  });

  it("allows login with the new password after a successful reset", async () => {
    const { user, rawToken } = await createUserWithResetToken();

    await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "Updated1!" });

    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: user.email, password: "Updated1!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it("returns 400 when token is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ newPassword: "ValidPass1!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid request/i);
  });

  it("returns 400 when newPassword is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: "sometoken" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid request/i);
  });

  it("returns 400 when newPassword does not meet strength requirements", async () => {
    const { rawToken } = await createUserWithResetToken();

    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "weakpassword" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });

  it("returns 400 when the token does not match any user in the DB", async () => {
    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: "completelyinvalidtoken", newPassword: "ValidPass1!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it("returns 400 when the token has expired", async () => {
    const { user } = await createTestUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.password_reset_token = hashedToken;
    user.password_reset_expires = Date.now() - 1000; // 1 second in the past
    await user.save();

    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "ValidPass1!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it("returns 400 on a second attempt with the same token (single-use)", async () => {
    const { rawToken } = await createUserWithResetToken();

    await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "FirstReset1!" });

    const res = await request(app)
      .post(`${BASE}/setNewPassword`)
      .send({ token: rawToken, newPassword: "SecondReset1!" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });
});

//  UPDATE AVATAR
describe("PATCH /updateAvatar", () => {

  it("successfully updates avatar to a valid option and returns 200", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .patch(`${BASE}/updateAvatar`)
      .set(authHeader(token))
      .send({ avatar: "avatars/pink.png" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/avatar updated/i);
    expect(res.body.user.avatar).toBe("avatars/pink.png");
  });

  it("can switch between valid avatar options", async () => {
    const { token } = await createTestUser();

    await request(app)
      .patch(`${BASE}/updateAvatar`)
      .set(authHeader(token))
      .send({ avatar: "avatars/gray.png" });

    const res = await request(app)
      .patch(`${BASE}/updateAvatar`)
      .set(authHeader(token))
      .send({ avatar: "avatars/blue.png" });

    expect(res.status).toBe(200);
    expect(res.body.user.avatar).toBe("avatars/blue.png");
  });

  it("does not expose password_hash in the updateAvatar response", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .patch(`${BASE}/updateAvatar`)
      .set(authHeader(token))
      .send({ avatar: "avatars/green.png" });

    expect(res.body.user?.password_hash).toBeUndefined();
  });

  it("all four avatar options are accepted", async () => {
    const avatars = [
      "avatars/pink.png",
      "avatars/gray.png",
      "avatars/green.png",
      "avatars/blue.png"
    ];

    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      const uniqueUser = await User.create({
        username: `avtest${i}`,
        full_name: "Avatar Test User",
        email: `avtest${i}@test.com`,
        password_hash: "irrelevant_hash"
      });

      const { generateToken } = await import("../../backend/src/utils/jwt.js");
      const token = generateToken({ id: uniqueUser._id, role: uniqueUser.role });

      const res = await request(app)
        .patch(`${BASE}/updateAvatar`)
        .set(authHeader(token))
        .send({ avatar });

      expect(res.status).toBe(200);
      expect(res.body.user.avatar).toBe(avatar);
    }
  });

  it("returns 400 for an invalid avatar value", async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .patch(`${BASE}/updateAvatar`)
      .set(authHeader(token))
      .send({ avatar: "nonexistent_avatar_xyz" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid avatar/i);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .patch(`${BASE}/updateAvatar`)
      .send({ avatar: "avatars/pink.png" });

    expect(res.status).toBe(401);
  });
});
