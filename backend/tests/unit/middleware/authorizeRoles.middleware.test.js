import { describe, it, expect, vi } from "vitest";
import authorizeRoles from "../../../backend/src/middleware/authorizeRoles.middleware.js";

//  Unit Tests — authorizeRoles middleware
//  This middleware sits AFTER authMiddleware and
//  checks if req.user.role matches an allowed list.


function buildMocks(role = undefined) {
  const req = {
    user: role !== undefined ? { id: "someId", role } : undefined
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("authorizeRoles()", () => {

  // Allowed roles
  it("calls next() when user role exactly matches the allowed role", () => {
    const { req, res, next } = buildMocks("ADMIN");
    authorizeRoles("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when user role is one of multiple allowed roles", () => {
    const { req, res, next } = buildMocks("USER");
    authorizeRoles("USER", "ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() when an ADMIN accesses an ADMIN-only route", () => {
    const { req, res, next } = buildMocks("ADMIN");
    authorizeRoles("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // Denied roles
  it("returns 403 when a USER tries to access an ADMIN-only route", () => {
    const { req, res, next } = buildMocks("USER");
    authorizeRoles("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/permission/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for an unknown role that is not in the allowed list", () => {
    const { req, res, next } = buildMocks("SUPERUSER");
    authorizeRoles("USER", "ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // Missing user
  it("returns 403 when req.user is undefined (unauthenticated request slipped through)", () => {
    const req = { user: undefined };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    authorizeRoles("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when req.user exists but has no role property", () => {
    const req = { user: { id: "abc123" } }; // role is missing
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    authorizeRoles("USER")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // Case sensitivity
  it("is case-sensitive — 'admin' (lowercase) does NOT match 'ADMIN'", () => {
    const { req, res, next } = buildMocks("admin"); // lowercase
    authorizeRoles("ADMIN")(req, res, next);

    // The app uses uppercase roles, so lowercase should be rejected
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
