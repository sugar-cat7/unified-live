import { describe, expect, it } from "vitest";
import { escapeRegExp } from "./escapeRegExp";

describe("escapeRegExp", () => {
  it("returns normal strings as-is", () => {
    expect(escapeRegExp("hello")).toBe("hello");
    expect(escapeRegExp("えーと")).toBe("えーと");
  });

  it("escapes special regex characters", () => {
    expect(escapeRegExp("a.b")).toBe("a\\.b");
    expect(escapeRegExp("a*b")).toBe("a\\*b");
    expect(escapeRegExp("a+b")).toBe("a\\+b");
    expect(escapeRegExp("a?b")).toBe("a\\?b");
    expect(escapeRegExp("[abc]")).toBe("\\[abc\\]");
    expect(escapeRegExp("(a|b)")).toBe("\\(a\\|b\\)");
  });

  it("handles an empty string", () => {
    expect(escapeRegExp("")).toBe("");
  });

  it("escaped string can be safely used with RegExp", () => {
    const input = "a+a+";
    const escaped = escapeRegExp(input);
    const regex = new RegExp(escaped, "g");
    expect("a+a+".match(regex)).toEqual(["a+a+"]);
  });
});
