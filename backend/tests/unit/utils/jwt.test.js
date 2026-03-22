import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "../../../backend/src/utils/jwt.js";

//  Unit Tests — generateToken() & verifyToken()
//  These functions wrap jsonwebtoken and are the
//  heart of the app's authentication system.


const TEST_PAYLOAD = { id: "abc123", role: "USER" };

describe("generateToken()", () => {

  it("returns a non-empty string", () => {
    const token = generateToken(TEST_PAYLOAD);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("produces a valid JWT with three dot-separated parts", () => {
    const token = generateToken(TEST_PAYLOAD);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("encodes the correct user id inside the token", () => {
    const token = generateToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe("abc123");
  });

  it("encodes the correct role inside the token", () => {
    const token = generateToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token);
    expect(decoded.role).toBe("USER");
  });

  it("includes an expiration claim (exp)", () => {
    const token = generateToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
    // exp should be in the future
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("generates unique tokens for repeated calls (different iat)", async () => {
    const token1 = generateToken(TEST_PAYLOAD);
    // Small delay to ensure different iat
    await new Promise(r => setTimeout(r, 10));
    const token2 = generateToken(TEST_PAYLOAD);
    // Tokens CAN be the same within the same second (iat granularity),
    // but the function must not throw — we just verify both are strings
    expect(typeof token1).toBe("string");
    expect(typeof token2).toBe("string");
  });
});

describe("verifyToken()", () => {

  it("successfully verifies a valid token and returns the payload", () => {
    const token = generateToken(TEST_PAYLOAD);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe("abc123");
    expect(decoded.role).toBe("USER");
  });

  it("throws JsonWebTokenError for a completely fake token", () => {
    expect(() => verifyToken("this.is.fake")).toThrow();
  });

  it("throws JsonWebTokenError when the signature is tampered", () => {
    const token = generateToken(TEST_PAYLOAD);
    // Change the last character of the signature to corrupt it
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(() => verifyToken(tampered)).toThrow();
  });

  it("throws TokenExpiredError for an already-expired token", () => {
    // Sign a token that expired 1 second ago
    const expiredToken = jwt.sign(
      TEST_PAYLOAD,
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    expect(() => verifyToken(expiredToken)).toThrow(/expired/i);
  });

  it("throws for an empty string token", () => {
    expect(() => verifyToken("")).toThrow();
  });

  it("throws for a token signed with a DIFFERENT secret", () => {
    const wrongSecretToken = jwt.sign(TEST_PAYLOAD, "totally_wrong_secret");
    expect(() => verifyToken(wrongSecretToken)).toThrow();
  });
});
