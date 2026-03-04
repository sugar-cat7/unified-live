import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timeZone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { LOCALE_TIMEZONE_MAP, type TargetLang } from "./schema";

dayjs.extend(customParseFormat);
dayjs.extend(timeZone);
dayjs.extend(utc);
dayjs.tz.setDefault("UTC");

/**
 * Convert a date to UTC ISO string format.
 * @param input Date | string | number
 * @returns UTC ISO string (e.g., "2024-01-15T10:30:00Z")
 */
const convertToUTC = (input: Date | string | number): string => {
  return dayjs.tz(input).utc().format();
};

/**
 * Get the current UTC time as a Date object.
 * @returns Date object in UTC
 */
const getCurrentUTCDate = (): Date => {
  return dayjs.tz().toDate();
};

/**
 * Get the current UTC time as an ISO string.
 * @returns UTC ISO string
 */
const getCurrentUTCString = (): string => {
  return dayjs.tz().format();
};

/**
 * Get the current UTC timestamp in milliseconds.
 * Use this instead of Date.now().
 * @returns Unix timestamp in milliseconds
 */
const getCurrentTimestamp = (): number => {
  return dayjs.tz().valueOf();
};

/**
 * Convert a date to a Date object in UTC.
 * @param input Date | string | number
 * @returns Date object in UTC
 */
const convertToUTCDate = (input: Date | string | number): Date => {
  return dayjs.tz(input).utc().toDate();
};

/**
 * Convert a date string from a specific timezone to UTC ISO string.
 * @param dateStr Date | string | number
 * @param tz Timezone string (e.g., "Asia/Tokyo")
 * @returns UTC ISO string
 */
const convertToUTCTimestamp = (
  dateStr: Date | string | number,
  tz: string,
): string => {
  return dayjs.tz(dateStr, tz).utc().format();
};

/**
 * Add days to a date and convert to UTC.
 * @param dateStr Date | string | number
 * @param days Number of days to add
 * @param tz Timezone string
 * @returns UTC ISO string
 */
const addDaysAndConvertToUTC = (
  dateStr: Date | string | number,
  days: number,
  tz: string,
): string => {
  return dayjs.tz(dateStr, tz).add(days, "day").utc().format();
};

/**
 * Get the end of day for a date in UTC.
 * @param dateStr Date | string | number
 * @param tz Timezone string
 * @returns UTC ISO string at end of day
 */
const getEndOfDayUTC = (
  dateStr: Date | string | number,
  tz: string,
): string => {
  return dayjs.tz(dateStr, tz).endOf("day").utc().format();
};

/**
 * Get the previous day's date.
 * @param dateStr Date | string | number
 * @param tz Timezone string
 * @returns Date string in YYYY-MM-DD format
 */
const getPreviousDay = (
  dateStr: Date | string | number,
  tz: string,
): string => {
  return dayjs.tz(dateStr, tz).subtract(1, "day").format("YYYY-MM-DD");
};

/**
 * Get the current year in UTC.
 * @returns Current year as number
 */
const getCurrentYear = (): number => {
  return dayjs.tz().year();
};

/**
 * Format a date to ISO date string (YYYY-MM-DD).
 * @param input Date | string | number
 * @returns Date string in YYYY-MM-DD format
 */
const formatToISODate = (input: Date | string | number): string => {
  return dayjs.tz(input).format("YYYY-MM-DD");
};

/**
 * Format a date to ISO string with custom separator for filenames.
 * @param input Date | string | number
 * @returns Filename-safe ISO string (e.g., "2024-01-15T10-30-00-000Z")
 */
const formatToFilenameSafeISO = (input: Date | string | number): string => {
  return dayjs.tz(input).utc().format("YYYY-MM-DDTHH-mm-ss-SSS[Z]");
};

/**
 * Add milliseconds to the current time and return a Date object.
 * @param ms Milliseconds to add
 * @returns Date object with added time
 */
const addMillisecondsFromNow = (ms: number): Date => {
  return dayjs.tz().add(ms, "millisecond").toDate();
};

/**
 * Subtract days from a date and return a Date object.
 * @param input Date | string | number
 * @param days Number of days to subtract
 * @returns Date object
 */
const subtractDays = (input: Date | string | number, days: number): Date => {
  return dayjs.tz(input).subtract(days, "day").toDate();
};

/**
 * Subtract minutes from a date and return a Date object.
 * @param input Date | string | number
 * @param minutes Number of minutes to subtract
 * @returns Date object
 */
const subtractMinutes = (
  input: Date | string | number,
  minutes: number,
): Date => {
  return dayjs.tz(input).subtract(minutes, "minute").toDate();
};

/**
 * Add minutes to a date and return a Date object.
 * @param input Date | string | number
 * @param minutes Number of minutes to add
 * @returns Date object
 */
const addMinutes = (input: Date | string | number, minutes: number): Date => {
  return dayjs.tz(input).add(minutes, "minute").toDate();
};

/**
 * Check if a date is before another date.
 * @param date1 Date | string | number
 * @param date2 Date | string | number
 * @returns true if date1 is before date2
 */
const isBefore = (
  date1: Date | string | number,
  date2: Date | string | number,
): boolean => {
  return dayjs.tz(date1).isBefore(dayjs.tz(date2));
};

/**
 * Calculate the difference between two dates in seconds.
 * @param date1 Date | string | number (end date)
 * @param date2 Date | string | number (start date)
 * @param float If true, returns floating point value (default: false)
 * @returns Difference in seconds (date1 - date2)
 */
const diffInSeconds = (
  date1: Date | string | number,
  date2: Date | string | number,
  float = false,
): number => {
  return dayjs.tz(date1).diff(dayjs.tz(date2), "second", float);
};

/**
 * Returns a date formatted according to the specified language and time zone.
 * Use this for displaying dates to users in their local timezone.
 * @param input Date | string | number (ISO8601, UNIX timestamp, Date object)
 * @param lang TargetLang (ISO 639-1 language code)
 * @returns A string formatted in the local format for the specified language
 */
const formatToLocalizedDate = (
  input: Date | string | number,
  lang: TargetLang,
): string => {
  const { locale, timeZone } = LOCALE_TIMEZONE_MAP[lang];

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
    hour12: locale.startsWith("en") || locale.startsWith("es"), // en, es use AM/PM notation
  }).format(convertToUTCDate(input));
};

/**
 * Format a date for JST (Japan Standard Time) display.
 * @param input Date | string | number
 * @returns Formatted date string in JST
 */
const formatToJST = (input: Date | string | number): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
    hour12: false,
  }).format(convertToUTCDate(input));
};

/**
 * Format a date for JST display (short format: YYYY/MM/DD).
 * @param input Date | string | number
 * @returns Date string in YYYY/MM/DD format (JST)
 */
const formatToJSTShort = (input: Date | string | number): string => {
  return dayjs.tz(input).tz("Asia/Tokyo").format("YYYY/MM/DD");
};

/**
 * Format a date for JST display (MM/DD format for charts).
 * @param input Date | string | number
 * @returns Date string in M/D format (JST)
 */
const formatToJSTMonthDay = (input: Date | string | number): string => {
  return dayjs.tz(input).tz("Asia/Tokyo").format("M/D");
};

export {
  convertToUTC,
  convertToUTCDate,
  getCurrentUTCDate,
  getCurrentUTCString,
  getCurrentTimestamp,
  formatToLocalizedDate,
  convertToUTCTimestamp,
  addDaysAndConvertToUTC,
  getEndOfDayUTC,
  getPreviousDay,
  getCurrentYear,
  formatToISODate,
  formatToFilenameSafeISO,
  addMillisecondsFromNow,
  subtractDays,
  subtractMinutes,
  addMinutes,
  isBefore,
  diffInSeconds,
  formatToJST,
  formatToJSTShort,
  formatToJSTMonthDay,
};
