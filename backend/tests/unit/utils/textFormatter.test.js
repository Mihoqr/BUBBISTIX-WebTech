import { describe, it, expect } from "vitest";
import { toTitleCase } from "../../../backend/src/utils/textFormatter.js";

//  Unit Tests — toTitleCase()
//  Tests the utility that capitalises every word


describe("toTitleCase()", () => {

  // Happy path
  it("capitalises every word in a normal sentence", () => {
    expect(toTitleCase("john doe")).toBe("John Doe");
  });

  it("handles a single-word input", () => {
    expect(toTitleCase("alice")).toBe("Alice");
  });

  it("converts a fully uppercase string to title case", () => {
    expect(toTitleCase("JOHN DOE")).toBe("John Doe");
  });

  it("converts a mixed-case string to title case", () => {
    expect(toTitleCase("mArIa cLaRa")).toBe("Maria Clara");
  });

  it("handles a three-word name correctly", () => {
    expect(toTitleCase("jose rizal hernandez")).toBe("Jose Rizal Hernandez");
  });

  it("trims leading and trailing whitespace", () => {
    expect(toTitleCase("  jane doe  ")).toBe("Jane Doe");
  });

  it("collapses multiple spaces between words", () => {
    // Multiple internal spaces should still produce correct title case
    expect(toTitleCase("john   doe")).toBe("John Doe");
  });

  // Edge cases
  it("returns an empty string unchanged", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("returns null/undefined input unchanged (does not throw)", () => {
    expect(toTitleCase(null)).toBe(null);
    expect(toTitleCase(undefined)).toBe(undefined);
  });

  it("handles a string that is only spaces", () => {
    // Only spaces - filter removes empty words - result is empty string
    const result = toTitleCase("   ");
    expect(result).toBe("");
  });

  it("preserves digits inside words", () => {
    expect(toTitleCase("user1 test2")).toBe("User1 Test2");
  });
});
