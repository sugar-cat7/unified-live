/**
 * Escape special characters in a regular expression
 * Used when dynamically generating RegExp to prevent ReDoS attacks
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
