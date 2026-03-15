import { describe, expect, it } from "vitest";
import { TokenManager } from "./types";
import { AuthenticationError } from "../errors";

describe("TokenManager.is", () => {
  it.each([
    { name: "null", value: null, expected: false },
    { name: "string", value: "hello", expected: false },
    { name: "empty object", value: {}, expected: false },
    { name: "partial (only getAuthHeader)", value: { getAuthHeader: () => {} }, expected: false },
  ])("returns $expected for $name", ({ value, expected }) => {
    expect(TokenManager.is(value)).toBe(expected);
  });

  it("returns true for a valid TokenManager", () => {
    const tm = TokenManager.static("Bearer token");
    expect(TokenManager.is(tm)).toBe(true);
  });

  it("returns true for a manually constructed TokenManager", () => {
    const tm = {
      getAuthHeader: async () => "Bearer x",
      invalidate: () => {},
    };
    expect(TokenManager.is(tm)).toBe(true);
  });
});

describe("TokenManager.static", () => {
  it("returns the provided header", async () => {
    const tm = TokenManager.static("Basic abc123");
    expect(await tm.getAuthHeader()).toBe("Basic abc123");
  });

  it("returns the same header on repeated calls", async () => {
    const tm = TokenManager.static("Bearer token");
    const first = await tm.getAuthHeader();
    const second = await tm.getAuthHeader();
    expect(first).toBe(second);
  });

  it("throws AuthenticationError on invalidate", () => {
    const tm = TokenManager.static("Basic abc123");
    expect(() => tm.invalidate()).toThrow(AuthenticationError);
  });
});
