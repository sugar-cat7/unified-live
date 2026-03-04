import { describe, expect, it } from "vitest";
import { uuid } from "./uuid";

// ============================================
// uuid tests
// ============================================

describe("uuid", () => {
  const formatTestCases = [
    {
      name: "generates a UUID v4 format string",
      check: (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        ),
      expected: true,
    },
    {
      name: "generates a 36-character string",
      check: (id: string) => id.length === 36,
      expected: true,
    },
    {
      name: "returns a string type",
      check: (id: string) => typeof id === "string",
      expected: true,
    },
    {
      name: "is split into 5 segments",
      check: (id: string) => id.split("-").length === 5,
      expected: true,
    },
  ];

  it.each(formatTestCases)("$name", ({ check, expected }) => {
    const id = uuid();

    expect(check(id)).toBe(expected);
  });

  const segmentLengthTestCases = [
    { segmentIndex: 0, expectedLength: 8, name: "1st segment" },
    { segmentIndex: 1, expectedLength: 4, name: "2nd segment" },
    { segmentIndex: 2, expectedLength: 4, name: "3rd segment" },
    { segmentIndex: 3, expectedLength: 4, name: "4th segment" },
    { segmentIndex: 4, expectedLength: 12, name: "5th segment" },
  ];

  it.each(segmentLengthTestCases)("$name is $expectedLength characters", ({
    segmentIndex,
    expectedLength,
  }) => {
    const id = uuid();
    const parts = id.split("-");

    expect(parts[segmentIndex].length).toBe(expectedLength);
  });

  const uniquenessTestCases = [
    { count: 10, name: "generates 10 unique IDs" },
    { count: 100, name: "generates 100 unique IDs" },
    { count: 1000, name: "generates 1000 unique IDs" },
  ];

  it.each(uniquenessTestCases)("$name", ({ count }) => {
    const ids = new Set<string>();
    for (let i = 0; i < count; i++) {
      ids.add(uuid());
    }

    expect(ids.size).toBe(count);
  });
});
