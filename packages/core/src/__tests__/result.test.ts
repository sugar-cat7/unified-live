import { describe, expect, it } from "vitest";
import { NotFoundError, UnifiedLiveError } from "../errors";
import { Err, Ok, unwrap, wrap } from "../result";

describe("Ok", () => {
  it("creates an OkResult with a value", () => {
    const result = Ok(42);
    expect(result.val).toBe(42);
    expect(result.err).toBeUndefined();
  });

  it("creates an OkResult without a value", () => {
    const result = Ok();
    expect(result.val).toBeUndefined();
    expect(result.err).toBeUndefined();
  });
});

describe("Err", () => {
  it("creates an ErrResult with an error", () => {
    const error = new NotFoundError("youtube", "abc123");
    const result = Err(error);
    expect(result.err).toBe(error);
    expect(result.val).toBeUndefined();
  });
});

describe("wrap", () => {
  it("returns Ok for a resolved promise", async () => {
    const result = await wrap(
      Promise.resolve("hello"),
      (e) => new UnifiedLiveError(e.message, "INTERNAL", { platform: "test" }),
    );
    expect(result.val).toBe("hello");
    expect(result.err).toBeUndefined();
  });

  it("returns Err for a rejected promise", async () => {
    const result = await wrap(
      Promise.reject(new Error("boom")),
      (e) => new UnifiedLiveError(e.message, "INTERNAL", { platform: "test" }),
    );
    expect(result.err).toBeInstanceOf(UnifiedLiveError);
    expect(result.err?.message).toBe("boom");
    expect(result.val).toBeUndefined();
  });
});

describe("unwrap", () => {
  it("returns value from Ok result", () => {
    const result = Ok("data");
    expect(unwrap(result)).toBe("data");
  });

  it("throws error from Err result", () => {
    const error = new NotFoundError("youtube", "abc123");
    const result = Err(error);
    expect(() => unwrap(result)).toThrow(error);
  });
});
