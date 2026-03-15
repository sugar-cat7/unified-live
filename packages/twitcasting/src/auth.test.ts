import { describe, expect, it } from "vitest";
import { createBasicAuthTokenManager } from "./auth";

describe("createBasicAuthTokenManager", () => {
  const config = { clientId: "myClientId", clientSecret: "myClientSecret" };
  const expectedHeader = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;

  it("returns Basic auth header with base64-encoded credentials", async () => {
    const manager = createBasicAuthTokenManager(config);

    const header = await manager.getAuthHeader();

    expect(header).toBe(expectedHeader);
  });

  it("always returns the same header (idempotent)", async () => {
    const manager = createBasicAuthTokenManager(config);

    const first = await manager.getAuthHeader();
    const second = await manager.getAuthHeader();
    const third = await manager.getAuthHeader();

    expect(first).toBe(expectedHeader);
    expect(second).toBe(expectedHeader);
    expect(third).toBe(expectedHeader);
  });

  it("invalidate is a no-op — still returns same header after invalidate", async () => {
    const manager = createBasicAuthTokenManager(config);

    const before = await manager.getAuthHeader();
    manager.invalidate();
    const after = await manager.getAuthHeader();

    expect(before).toBe(expectedHeader);
    expect(after).toBe(expectedHeader);
  });
});
