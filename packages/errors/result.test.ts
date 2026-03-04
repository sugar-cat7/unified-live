import { describe, expect, it } from "vitest";
import { AppError } from "./error";
import { Err, Ok, wrap, wrapSync } from "./result";

// ============================================
// Ok tests
// ============================================

describe("Ok", () => {
  const testCases = [
    {
      name: "can be created without a value",
      input: undefined,
      expectedVal: undefined,
    },
    {
      name: "can hold a string value",
      input: "success",
      expectedVal: "success",
    },
    {
      name: "can hold an object value",
      input: { id: 1, name: "test" },
      expectedVal: { id: 1, name: "test" },
    },
    {
      name: "can hold an array value",
      input: [1, 2, 3],
      expectedVal: [1, 2, 3],
    },
    {
      name: "can hold null as a value",
      input: null,
      expectedVal: null,
    },
    {
      name: "can hold a number value",
      input: 42,
      expectedVal: 42,
    },
    {
      name: "can hold a boolean value",
      input: true,
      expectedVal: true,
    },
  ];

  it.each(testCases)("$name", ({ input, expectedVal }) => {
    const result = Ok(input);

    expect(result.val).toEqual(expectedVal);
    expect(result.err).toBeUndefined();
  });
});

// ============================================
// Err tests
// ============================================

describe("Err", () => {
  const testCases = [
    {
      name: "can hold a basic error",
      input: {
        message: "Something went wrong",
        code: "INTERNAL_SERVER_ERROR" as const,
      },
      expected: {
        message: "Something went wrong",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    {
      name: "can hold a NOT_FOUND error",
      input: {
        message: "Not found",
        code: "NOT_FOUND" as const,
        context: { resourceId: "123" },
      },
      expected: {
        message: "Not found",
        code: "NOT_FOUND",
        context: { resourceId: "123" },
      },
    },
    {
      name: "can hold a BAD_REQUEST error",
      input: {
        message: "Invalid input",
        code: "BAD_REQUEST" as const,
      },
      expected: {
        message: "Invalid input",
        code: "BAD_REQUEST",
      },
    },
  ];

  it.each(testCases)("$name", ({ input, expected }) => {
    const error = new AppError(input);
    const result = Err(error);

    expect(result.err?.message).toBe(expected.message);
    expect(result.err?.code).toBe(expected.code);
    if (expected.context) {
      expect(result.err?.context).toEqual(expected.context);
    }
    expect(result.val).toBeUndefined();
  });
});

// ============================================
// Result type discrimination tests
// ============================================

describe("Result type discrimination", () => {
  const testCases = [
    {
      name: "Ok has val and no err",
      createResult: () => Ok("value"),
      isOk: true,
      expectedVal: "value",
    },
    {
      name: "Err has err and no val",
      createResult: () =>
        Err(new AppError({ message: "Error", code: "BAD_REQUEST" })),
      isOk: false,
      expectedMessage: "Error",
    },
  ];

  it.each(testCases)("$name", ({ createResult, isOk, expectedVal, expectedMessage }) => {
    const result = createResult();

    if (isOk) {
      expect(result.err).toBeUndefined();
      expect(result.val).toBe(expectedVal);
    } else {
      expect(result.err).toBeDefined();
      expect(result.err?.message).toBe(expectedMessage);
      expect(result.val).toBeUndefined();
    }
  });
});

// ============================================
// wrap tests
// ============================================

describe("wrap", () => {
  const createError = (err: Error) =>
    new AppError({
      message: err.message,
      code: "INTERNAL_SERVER_ERROR",
      cause: err,
    });

  const successTestCases = [
    {
      name: "wraps a successful Promise with Ok",
      promise: () => Promise.resolve("success"),
      expectedVal: "success",
    },
    {
      name: "can wrap a Promise returning an object",
      promise: () => Promise.resolve({ data: "async result" }),
      expectedVal: { data: "async result" },
    },
    {
      name: "can wrap a Promise returning an array",
      promise: () => Promise.resolve([1, 2, 3]),
      expectedVal: [1, 2, 3],
    },
    {
      name: "can wrap a Promise returning null",
      promise: () => Promise.resolve(null),
      expectedVal: null,
    },
  ];

  it.each(successTestCases)("$name", async ({ promise, expectedVal }) => {
    const result = await wrap(promise(), createError);

    expect(result.val).toEqual(expectedVal);
    expect(result.err).toBeUndefined();
  });

  const failureTestCases = [
    {
      name: "wraps a failed Promise with Err",
      promise: () => Promise.reject(new Error("Failed")),
      expectedMessage: "Failed",
      expectedCode: "INTERNAL_SERVER_ERROR",
    },
    {
      name: "can wrap an async function error",
      promise: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        throw new Error("Async error");
      },
      expectedMessage: "Async error",
      expectedCode: "INTERNAL_SERVER_ERROR",
    },
  ];

  it.each(failureTestCases)(
    "$name",
    async ({ promise, expectedMessage, expectedCode }) => {
      const result = await wrap(promise(), createError);

      expect(result.err).toBeDefined();
      expect(result.err?.message).toBe(expectedMessage);
      expect(result.err?.code).toBe(expectedCode);
      expect(result.val).toBeUndefined();
    },
  );

  const customErrorFactoryTestCases = [
    {
      name: "can transform errors with a custom error factory",
      errorFactory: (err: Error) =>
        new AppError({
          message: `Custom: ${err.message}`,
          code: "BAD_REQUEST",
          context: { original: err.message },
        }),
      originalMessage: "Original error",
      expectedMessage: "Custom: Original error",
      expectedCode: "BAD_REQUEST",
      expectedContext: { original: "Original error" },
    },
  ];

  it.each(customErrorFactoryTestCases)(
    "$name",
    async ({
      errorFactory,
      originalMessage,
      expectedMessage,
      expectedCode,
      expectedContext,
    }) => {
      const promise = Promise.reject(new Error(originalMessage));
      const result = await wrap(promise, errorFactory);

      expect(result.err?.message).toBe(expectedMessage);
      expect(result.err?.code).toBe(expectedCode);
      expect(result.err?.context).toEqual(expectedContext);
    },
  );
});

// ============================================
// wrapSync tests
// ============================================

describe("wrapSync", () => {
  const createError = (err: Error) =>
    new AppError({
      message: err.message,
      code: "INTERNAL_SERVER_ERROR",
      cause: err,
    });

  const successTestCases = [
    {
      name: "wraps a successful synchronous function with Ok",
      fn: () => "success",
      expectedVal: "success",
    },
    {
      name: "can wrap a function returning an object",
      fn: () => ({ data: "sync result" }),
      expectedVal: { data: "sync result" },
    },
    {
      name: "can wrap a function returning an array",
      fn: () => [1, 2, 3],
      expectedVal: [1, 2, 3],
    },
    {
      name: "can wrap a function returning null",
      fn: () => null,
      expectedVal: null,
    },
  ];

  it.each(successTestCases)("$name", ({ fn, expectedVal }) => {
    const result = wrapSync(fn, createError);

    expect(result.val).toEqual(expectedVal);
    expect(result.err).toBeUndefined();
  });

  const failureTestCases = [
    {
      name: "wraps a throwing function with Err",
      fn: () => {
        throw new Error("Failed");
      },
      expectedMessage: "Failed",
      expectedCode: "INTERNAL_SERVER_ERROR",
    },
    {
      name: "can wrap a function throwing a custom error",
      fn: () => {
        throw new Error("Custom sync error");
      },
      expectedMessage: "Custom sync error",
      expectedCode: "INTERNAL_SERVER_ERROR",
    },
  ];

  it.each(failureTestCases)("$name", ({ fn, expectedMessage, expectedCode }) => {
    const result = wrapSync(fn, createError);

    expect(result.err).toBeDefined();
    expect(result.err?.message).toBe(expectedMessage);
    expect(result.err?.code).toBe(expectedCode);
    expect(result.val).toBeUndefined();
  });

  const customErrorFactoryTestCases = [
    {
      name: "can transform errors with a custom error factory",
      errorFactory: (err: Error) =>
        new AppError({
          message: `Sync Custom: ${err.message}`,
          code: "BAD_REQUEST",
          context: { original: err.message },
        }),
      originalMessage: "Original sync error",
      expectedMessage: "Sync Custom: Original sync error",
      expectedCode: "BAD_REQUEST",
      expectedContext: { original: "Original sync error" },
    },
  ];

  it.each(customErrorFactoryTestCases)(
    "$name",
    ({ errorFactory, originalMessage, expectedMessage, expectedCode, expectedContext }) => {
      const fn = () => {
        throw new Error(originalMessage);
      };
      const result = wrapSync(fn, errorFactory);

      expect(result.err?.message).toBe(expectedMessage);
      expect(result.err?.code).toBe(expectedCode);
      expect(result.err?.context).toEqual(expectedContext);
    },
  );
});
