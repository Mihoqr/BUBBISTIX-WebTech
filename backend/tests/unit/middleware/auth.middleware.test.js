import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateToken } from "../../../backend/src/utils/jwt.js";
import authMiddleware from "../../../backend/src/middleware/auth.middleware.js";

//  Unit Tests — authMiddleware
//  Tests the JWT extraction and validation logic
//  WITHOUT hitting the database or HTTP layer.
//  We mock req/res/next to isolate the middleware.
function buildMocks(authHeaderValue = undefined) {
  const req = {
    headers: authHeaderValue ? { authorization: authHeaderValue } : {}
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("authMiddleware", () => {

  // Missing / malformed header
  it("returns 401 when Authorization header is completely absent", () => {
    const { req, res, next } = buildMocks();
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/missing token/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header is present but has no Bearer prefix", () => {
    const { req, res, next } = buildMocks("SomeRandomString");
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is missing after 'Bearer '", () => {
    const { req, res, next } = buildMocks("Bearer ");
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // Invalid tokens
  it("returns 401 for a completely fake token string", () => {
    const { req, res, next } = buildMocks("Bearer fake.token.here");
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/invalid or expired/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is expired", () => {
    import("jsonwebtoken").then(({ default: jwt }) => {
      const expiredToken = jwt.sign(
        { id: "abc", role: "USER" },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
      );
      const { req, res, next } = buildMocks(`Bearer ${expiredToken}`);
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Valid token
  it("calls next() and attaches user to req when token is valid", () => {
    const token = generateToken({ id: "user123", role: "USER" });
    const { req, res, next } = buildMocks(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("user123");
    expect(req.user.role).toBe("USER");
  });

  it("attaches the correct ADMIN role when an admin token is used", () => {
    const token = generateToken({ id: "admin999", role: "ADMIN" });
    const { req, res, next } = buildMocks(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.role).toBe("ADMIN");
  });

  it("does NOT expose the full decoded JWT payload — only id and role", () => {
    const token = generateToken({ id: "user123", role: "USER", extraField: "should_not_appear" });
    const { req, res, next } = buildMocks(`Bearer ${token}`);

    authMiddleware(req, res, next);

    // Middleware should attach only id and role, not everything from the token
    expect(req.user).toEqual({ id: "user123", role: "USER" });
  });
});
