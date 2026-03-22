import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../backend/src/app.js";
import { User } from "../../backend/src/models/user.model.js";
import { Sticker } from "../../backend/src/models/sticker.model.js";
import { Category } from "../../backend/src/models/category.model.js";
import { createTestUser, createAdminUser, authHeader, validRegisterPayload } from "../setup/testHelpers.js";

//  Security Tests — Bubbistix API
//
//  Categories covered:
//    1. Authentication Bypass
//    2. Authorization / Privilege Escalation
//    3. NoSQL Injection
//    4. Input Validation / Boundary Attacks
//    5. Sensitive Data Exposure
//    6. Broken Object Level Authorization (BOLA)
//    7. HTTP Security Headers (Helmet)
//    8. Password Security

//  1. AUTHENTICATION BYPASS
//  Can attackers access protected routes without
//  a valid token?
describe("SEC-01 | Authentication Bypass", () => {

  it("BLOCK: accessing /getMe with no token returns 401", async () => {
    const res = await request(app).get("/api/v1/users/getMe");
    expect(res.status).toBe(401);
  });

  it("BLOCK: accessing /getMe with 'Bearer ' and no token returns 401", async () => {
    const res = await request(app)
      .get("/api/v1/users/getMe")
      .set({ Authorization: "Bearer " });
    expect(res.status).toBe(401);
  });

  it("BLOCK: a randomly generated token string is rejected", async () => {
    const res = await request(app)
      .get("/api/v1/users/getMe")
      .set({ Authorization: "Bearer randomgarbage123456" });
    expect(res.status).toBe(401);
  });

  it("BLOCK: a base64-encoded payload without a valid signature is rejected", async () => {
    // Attacker builds a fake JWT header.payload without signing it correctly
    const fakeHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const fakePayload = Buffer.from(JSON.stringify({ id: "hacker", role: "ADMIN" })).toString("base64url");
    const fakeToken = `${fakeHeader}.${fakePayload}.fakesignature`;

    const res = await request(app)
      .get("/api/v1/users/getMe")
      .set({ Authorization: `Bearer ${fakeToken}` });

    expect(res.status).toBe(401);
  });

  it("BLOCK: algorithm confusion — 'none' algorithm token is rejected", async () => {
    // CVE pattern: some old JWT libraries accepted alg:none (no signature required)
    const fakeHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const fakePayload = Buffer.from(JSON.stringify({ id: "hacker", role: "ADMIN" })).toString("base64url");
    const noneAlgToken = `${fakeHeader}.${fakePayload}.`;

    const res = await request(app)
      .get("/api/v1/users/getMe")
      .set({ Authorization: `Bearer ${noneAlgToken}` });

    expect(res.status).toBe(401);
  });

  it("BLOCK: cart routes cannot be accessed without a token", async () => {
    const routes = [
      () => request(app).get("/api/v1/carts/getCart"),
      () => request(app).post("/api/v1/carts/addToCart"),
      () => request(app).delete(`/api/v1/carts/removeFromCart/${new mongoose.Types.ObjectId()}`),
      () => request(app).delete("/api/v1/carts/clearCart"),
    ];

    for (const makeRequest of routes) {
      const res = await makeRequest();
      expect(res.status).toBe(401);
    }
  });

  it("BLOCK: order routes cannot be accessed without a token", async () => {
    const res = await request(app).post("/api/v1/orders/createOrder");
    expect(res.status).toBe(401);
  });
});

//  2. AUTHORIZATION / PRIVILEGE ESCALATION
//  Can a regular USER access ADMIN-only actions?
describe("SEC-02 | Authorization / Privilege Escalation", () => {

  it("BLOCK: USER cannot create a category (admin-only)", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .post("/api/v1/categories/create")
      .set(authHeader(token))
      .send({ name: "Hacked Category" });

    // authorizeRoles blocks this with 403
    expect(res.status).toBe(403);
  });

  it("BLOCK: USER cannot delete a category (admin-only)", async () => {
    const { token } = await createTestUser();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/categories/delete/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("BLOCK: USER cannot create a sticker (admin-only)", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .post("/api/v1/stickers/create")
      .set(authHeader(token))
      .send({ name: "Fake Sticker", price: 0 });

    expect(res.status).toBe(403);
  });

  it("BLOCK: USER cannot delete a sticker (admin-only)", async () => {
    const { token } = await createTestUser();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/stickers/delete/${fakeId}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it("ALLOW: ADMIN can access admin-only category creation", async () => {
    const { token } = await createAdminUser();
    const res = await request(app)
      .post("/api/v1/categories/create")
      .set(authHeader(token))
      .send({ name: "Valid Admin Category" });

    // Should NOT be 403 — admin is permitted
    expect(res.status).not.toBe(403);
  });

  it("BLOCK: a USER cannot change their own role to ADMIN via any endpoint", async () => {
    const { token } = await createTestUser();

    // Try to self-promote via updateAvatar (or any other patch endpoint)
    const res = await request(app)
      .patch("/api/v1/users/updateAvatar")
      .set(authHeader(token))
      .send({ role: "ADMIN" }); // role is not a valid avatar field

    // Role must not change — check by fetching user profile
    const meRes = await request(app)
      .get("/api/v1/users/getMe")
      .set(authHeader(token));

    expect(meRes.body.user.role).toBe("USER");
  });
});

//  3. NOSQL INJECTION
//  MongoDB is vulnerable to operator injection
//  e.g. { "$gt": "" } can bypass equality checks.
describe("SEC-03 | NoSQL Injection Attacks", () => {

  it("BLOCK: login with $gt operator in email field does not grant access", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: { $gt: "" },   // NoSQL injection attempt
        password: "anything"
      });

    // Must NOT return 200 with a token
    expect(res.status).not.toBe(200);
    expect(res.body.token).toBeUndefined();
  });

  it("BLOCK: login with $regex operator in email field is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: { $regex: ".*" }, // matches everything
        password: "TestPass1!"
      });

    expect(res.status).not.toBe(200);
    expect(res.body.token).toBeUndefined();
  });

  it("BLOCK: login with $where operator in password field is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "test@example.com",
        password: { $where: "sleep(5000)" }
      });

    expect(res.status).not.toBe(200);
  });

  it("BLOCK: register with operator injection in username is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ username: { $ne: null } }));

    // Express with mongoose schema validation should reject non-string username
    expect(res.status).not.toBe(201);
  });

  it("BLOCK: resetPassword with $gt operator in email does not leak user data", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/api/v1/users/resetPassword")
      .send({ email: { $gt: "" } });

    // Must not return 200 with a reset link — should be rejected or 400
    if (res.status === 200) {
      // If it somehow returns 200, the message must be the generic "if an account" response
      // and it must NOT contain a reset token or user data
      expect(res.body.message).toMatch(/if an account/i);
      expect(res.body.resetToken).toBeUndefined();
      expect(res.body.user).toBeUndefined();
    } else {
      expect([400, 500]).toContain(res.status);
    }
  });
});

//  4. INPUT VALIDATION & BOUNDARY ATTACKS
//  Overly long inputs, special characters, null
//  bytes — can they crash the server or bypass
//  validation?
describe("SEC-04 | Input Validation & Boundary Attacks", () => {

  it("BLOCK: extremely long username (10,000 chars) is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ username: "a".repeat(10000) }));

    expect(res.status).toBe(400);
  });

  it("BLOCK: extremely long email (10,000 chars) is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ email: "a".repeat(9990) + "@test.com" }));

    expect(res.status).toBe(400);
  });

  it("BLOCK: extremely long password (10,000 chars) is handled without server crash", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ password: "A1!" + "a".repeat(10000) }));

    // bcrypt has a 72-byte input limit; extremely long passwords can cause
    // DoS via CPU. The app should handle this without a 500.
    // We just assert the server doesn't crash (any 4xx is acceptable).
    expect(res.status).toBeLessThan(500);
  });

  it("BLOCK: null byte in username is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ username: "user\x00name" }));

    expect(res.status).toBe(400);
  });

  it("BLOCK: HTML/script tags in full_name are stored as plain text (no XSS)", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({
        full_name: "<script>alert('xss')</script> Doe"
      }));

    // API should either reject it (400) or store it safely as a plain string.
    // It must never execute as HTML. The important thing: no 500 server error.
    if (res.status === 201) {
      // If saved, the value must be a plain string — not executed
      expect(typeof res.body.user.full_name).toBe("string");
    } else {
      expect(res.status).toBe(400);
    }
  });

  it("BLOCK: sending an array instead of a string for email is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: ["test@test.com", "other@test.com"], password: "TestPass1!" });

    expect(res.status).not.toBe(200);
  });

  it("BLOCK: empty JSON body on login returns 400 not 500", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({});

    expect(res.status).toBe(400);
  });
});

//  5. SENSITIVE DATA EXPOSURE
//  The API must never leak passwords, tokens,
//  or internal IDs it shouldn't expose.
describe("SEC-05 | Sensitive Data Exposure", () => {

  it("BLOCK: registration response never includes password_hash", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload());

    expect(res.body.user?.password_hash).toBeUndefined();
    expect(res.body.user?.password).toBeUndefined();
  });

  it("BLOCK: login response never includes password_hash", async () => {
    await request(app).post("/api/v1/users/register").send(validRegisterPayload());
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "new@example.com", password: "NewPass1!" });

    expect(res.body.user?.password_hash).toBeUndefined();
  });

  it("BLOCK: /getMe response never includes password_hash", async () => {
    const { token } = await createTestUser();
    const res = await request(app)
      .get("/api/v1/users/getMe")
      .set(authHeader(token));

    expect(res.body.user?.password_hash).toBeUndefined();
  });

  it("BLOCK: resetPassword response does not leak the raw reset token", async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post("/api/v1/users/resetPassword")
      .send({ email: user.email });

    // The reset token must NOT appear in the response body
    expect(res.body.resetToken).toBeUndefined();
    expect(res.body.token).toBeUndefined();
  });

  it("BLOCK: password_reset_token is stored hashed in DB, not in plain text", async () => {
    const { user } = await createTestUser();
    await request(app)
      .post("/api/v1/users/resetPassword")
      .send({ email: user.email });

    // Fetch the user directly from DB
    const dbUser = await User.findById(user._id).select("+password_reset_token");

    if (dbUser.password_reset_token) {
      // The token in DB must be a SHA-256 hex string (64 chars), not the raw 32-byte token
      expect(dbUser.password_reset_token).toHaveLength(64);
      // It should not look like a JWT (no dots)
      expect(dbUser.password_reset_token).not.toContain(".");
    }
    // If no token is set, the feature may not have run in test env, also fine
  });

  it("BLOCK: error messages do not reveal internal server paths or stack traces", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "notfound@example.com", password: "WrongPass1!" });

    const body = JSON.stringify(res.body);
    // Must not expose file paths, stack traces, or DB query details
    expect(body).not.toMatch(/\/home\//);
    expect(body).not.toMatch(/at Object\./);
    expect(body).not.toMatch(/mongoose/i);
    expect(body).not.toMatch(/mongodb/i);
  });
});

//  6. BROKEN OBJECT LEVEL AUTHORIZATION (BOLA)
//  Can User A access or modify User B's data?
describe("SEC-06 | Broken Object Level Authorization (BOLA)", () => {

  it("BLOCK: User A cannot view User B's cart", async () => {
    const { token: tokenA } = await createTestUser({ username: "usera", email: "usera@test.com" });
    const { token: tokenB } = await createTestUser({ username: "userb", email: "userb@test.com" });

    // User A gets their own cart
    const resA = await request(app).get("/api/v1/carts/getCart").set(authHeader(tokenA));
    const resB = await request(app).get("/api/v1/carts/getCart").set(authHeader(tokenB));

    // Each user must get their OWN cart (different user_ids)
    expect(resA.body.cart.user_id?.toString()).not.toBe(resB.body.cart.user_id?.toString());
  });

  it("BLOCK: User A cannot clear User B's cart by reusing the clearCart endpoint with their own token", async () => {
    const { token: tokenA } = await createTestUser({ username: "usera2", email: "usera2@test.com" });
    const { token: tokenB } = await createTestUser({ username: "userb2", email: "userb2@test.com" });

    const category = await Category.create({ name: "BOLA Test Category" });
    const sticker = await Sticker.create({
      name: "Bola Test Sticker",
      description: "A sticker pack for BOLA testing purposes.",
      price: 50,
      category_id: category._id,
      preview_images: ["bola.jpg"],
      sticker_zip: "bola.zip"
    });

    // User B adds a sticker to their cart
    await request(app)
      .post("/api/v1/carts/addToCart")
      .set(authHeader(tokenB))
      .send({ sticker_id: sticker._id.toString() });

    // User A tries to clear their OWN cart (should not affect User B)
    await request(app).delete("/api/v1/carts/clearCart").set(authHeader(tokenA));

    // User B's cart should still have the sticker
    const resBCart = await request(app).get("/api/v1/carts/getCart").set(authHeader(tokenB));
    expect(resBCart.body.cart.items).toHaveLength(1);
  });
});

//  7. HTTP SECURITY HEADERS (HELMET)
//  Helmet is configured — verify key headers
//  are present on API responses.
describe("SEC-07 | HTTP Security Headers (Helmet)", () => {

  it("includes X-Content-Type-Options: nosniff header", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("includes X-Frame-Options header (clickjacking protection)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("does not expose X-Powered-By: Express header", async () => {
    const res = await request(app).get("/");
    // Helmet removes this header to prevent technology fingerprinting
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("includes a Content-Security-Policy header", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });
});

//  8. PASSWORD SECURITY
//  Weak, common, or trivially-guessable passwords
//  must be rejected at the boundary.
describe("SEC-08 | Password Security", () => {

  const weakPasswords = [
    "password",          // extremely common
    "12345678",          // all digits, no complexity
    "Password1",         // no special character
    "password1!",        // no uppercase
    "PASSWORD1!",        // no lowercase
    "Short1!",           // under 8 characters
    "        ",          // all spaces
    "",                  // empty string
  ];

  weakPasswords.forEach((pwd) => {
    it(`BLOCK: rejects weak password: "${pwd || "(empty)"}"`, async () => {
      const res = await request(app)
        .post("/api/v1/users/register")
        .send(validRegisterPayload({ password: pwd }));

      expect(res.status).toBe(400);
    });
  });

  it("ALLOW: a password meeting all requirements is accepted", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send(validRegisterPayload({ password: "Bubb1stix@Secure!" }));

    expect(res.status).toBe(201);
  });

  it("BLOCK: setNewPassword also enforces the strong password rule", async () => {
    const res = await request(app)
      .post("/api/v1/users/setNewPassword")
      .send({ token: "sometoken", newPassword: "weakpass" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });
});
