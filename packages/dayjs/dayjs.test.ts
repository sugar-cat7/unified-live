import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDaysAndConvertToUTC,
  addMillisecondsFromNow,
  addMinutes,
  convertToUTC,
  convertToUTCDate,
  convertToUTCTimestamp,
  formatToFilenameSafeISO,
  formatToISODate,
  formatToJST,
  formatToJSTMonthDay,
  formatToJSTShort,
  formatToLocalizedDate,
  getCurrentTimestamp,
  getCurrentUTCDate,
  getCurrentUTCString,
  getCurrentYear,
  getEndOfDayUTC,
  getPreviousDay,
  isBefore,
  subtractDays,
  subtractMinutes,
} from "./dayjs";

describe("@my-app/dayjs", () => {
  const FIXED_DATE = "2025-01-15T10:30:00.000Z";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_DATE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCurrentUTCDate", () => {
    it("returns current time as Date object", () => {
      const result = getCurrentUTCDate();
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(FIXED_DATE);
    });
  });

  describe("getCurrentUTCString", () => {
    it("returns current time as ISO string", () => {
      const result = getCurrentUTCString();
      expect(typeof result).toBe("string");
      expect(result).toContain("2025-01-15");
    });
  });

  describe("getCurrentTimestamp", () => {
    it("returns current timestamp in milliseconds", () => {
      const result = getCurrentTimestamp();
      expect(typeof result).toBe("number");
      expect(result).toBe(new Date(FIXED_DATE).getTime());
    });
  });

  describe("getCurrentYear", () => {
    it("returns current year", () => {
      const result = getCurrentYear();
      expect(result).toBe(2025);
    });
  });

  describe("convertToUTC", () => {
    it("converts Date to UTC ISO string", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = convertToUTC(date);
      expect(typeof result).toBe("string");
      expect(result).toContain("2025-01-15");
    });

    it("converts timestamp to UTC ISO string", () => {
      const timestamp = 1736937000000;
      const result = convertToUTC(timestamp);
      expect(typeof result).toBe("string");
    });

    it("converts ISO string to UTC ISO string", () => {
      const isoString = "2025-01-15T10:30:00.000Z";
      const result = convertToUTC(isoString);
      expect(typeof result).toBe("string");
    });
  });

  describe("convertToUTCDate", () => {
    it("converts string to Date object", () => {
      const result = convertToUTCDate("2025-01-15T10:30:00.000Z");
      expect(result).toBeInstanceOf(Date);
    });

    it("converts timestamp to Date object", () => {
      const timestamp = 1736937000000;
      const result = convertToUTCDate(timestamp);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("convertToUTCTimestamp", () => {
    it("converts date with timezone to UTC string", () => {
      const result = convertToUTCTimestamp("2025-01-15 19:30:00", "Asia/Tokyo");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatToISODate", () => {
    it("formats date to YYYY-MM-DD", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToISODate(date);
      expect(result).toBe("2025-01-15");
    });
  });

  describe("formatToFilenameSafeISO", () => {
    it("formats date to filename-safe ISO string", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToFilenameSafeISO(date);
      expect(result).toBe("2025-01-15T10-30-00-000Z");
    });
  });

  describe("addMillisecondsFromNow", () => {
    it("adds milliseconds to current time", () => {
      const result = addMillisecondsFromNow(60000);
      expect(result).toBeInstanceOf(Date);
      const expected = new Date(FIXED_DATE).getTime() + 60000;
      expect(result.getTime()).toBe(expected);
    });
  });

  describe("subtractDays", () => {
    it("subtracts days from date", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = subtractDays(date, 7);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain("2025-01-08");
    });
  });

  describe("subtractMinutes", () => {
    it("subtracts minutes from date", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = subtractMinutes(date, 30);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain("10:00:00");
    });
  });

  describe("addMinutes", () => {
    it("adds minutes to date", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = addMinutes(date, 30);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain("11:00:00");
    });
  });

  describe("isBefore", () => {
    it("returns true if date1 is before date2", () => {
      const date1 = new Date("2025-01-14T10:30:00.000Z");
      const date2 = new Date("2025-01-15T10:30:00.000Z");
      expect(isBefore(date1, date2)).toBe(true);
    });

    it("returns false if date1 is after date2", () => {
      const date1 = new Date("2025-01-16T10:30:00.000Z");
      const date2 = new Date("2025-01-15T10:30:00.000Z");
      expect(isBefore(date1, date2)).toBe(false);
    });

    it("returns false if dates are equal", () => {
      const date1 = new Date("2025-01-15T10:30:00.000Z");
      const date2 = new Date("2025-01-15T10:30:00.000Z");
      expect(isBefore(date1, date2)).toBe(false);
    });
  });

  describe("addDaysAndConvertToUTC", () => {
    it("adds days to date and converts to UTC", () => {
      const result = addDaysAndConvertToUTC(
        "2025-01-15 10:30:00",
        7,
        "Asia/Tokyo",
      );
      expect(typeof result).toBe("string");
    });
  });

  describe("getEndOfDayUTC", () => {
    it("gets end of day in UTC (converts from timezone to UTC)", () => {
      // 2025-01-15 23:59:59 Asia/Tokyo = 2025-01-15 14:59:59 UTC (JST is UTC+9)
      const result = getEndOfDayUTC("2025-01-15 10:30:00", "Asia/Tokyo");
      expect(typeof result).toBe("string");
      expect(result).toContain("14:59:59");
    });
  });

  describe("getPreviousDay", () => {
    it("gets previous day in YYYY-MM-DD format", () => {
      const result = getPreviousDay("2025-01-15 10:30:00", "Asia/Tokyo");
      expect(result).toBe("2025-01-14");
    });
  });

  describe("formatToLocalizedDate", () => {
    it("formats date for Japanese locale", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToLocalizedDate(date, "ja");
      expect(typeof result).toBe("string");
      expect(result).toContain("2025");
    });

    it("formats date for English locale", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToLocalizedDate(date, "en");
      expect(typeof result).toBe("string");
      expect(result).toContain("2025");
    });

    it("formats date for Korean locale", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToLocalizedDate(date, "ko");
      expect(typeof result).toBe("string");
      expect(result).toContain("2025");
    });
  });

  describe("formatToJST", () => {
    it("formats date to JST full format", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToJST(date);
      expect(typeof result).toBe("string");
      expect(result).toContain("2025");
      expect(result).toContain("1月");
      expect(result).toContain("15日");
    });
  });

  describe("formatToJSTShort", () => {
    it("formats date to JST short format (YYYY/MM/DD)", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToJSTShort(date);
      expect(result).toBe("2025/01/15");
    });
  });

  describe("formatToJSTMonthDay", () => {
    it("formats date to JST month/day format (M/D)", () => {
      const date = new Date("2025-01-15T10:30:00.000Z");
      const result = formatToJSTMonthDay(date);
      expect(result).toBe("1/15");
    });
  });
});
