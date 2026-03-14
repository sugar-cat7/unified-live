import { describe, expect, it } from "vitest";
import { TokenManager } from "../../auth/types.js";
import { AuthenticationError } from "../../errors.js";

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
