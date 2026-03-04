/**
 * Text normalization processing
 *
 * Normalizes and merges Japanese text
 */

/**
 * Normalize Japanese text
 *
 * Removes unnecessary whitespace between Japanese characters and collapses consecutive spaces into one.
 * Also handles whitespace around punctuation appropriately.
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export const normalizeJapaneseText = (text: string): string => {
  return (
    text
      // Remove whitespace immediately after punctuation (e.g., "。 " -> "。")
      .replace(/([。、，,！!？?])\s+/g, "$1")
      // Remove whitespace immediately before punctuation (e.g., " 。" -> "。")
      .replace(/\s+([。、，,！!？?])/g, "$1")
      // Remove unnecessary whitespace between Japanese characters (hiragana, katakana, kanji, digits)
      .replace(/([ぁ-んァ-ヶー一-龥\d])\s+([ぁ-んァ-ヶー一-龥\d])/g, "$1$2")
      // Apply multiple times (to handle nested whitespace patterns)
      .replace(/([ぁ-んァ-ヶー一-龥\d])\s+([ぁ-んァ-ヶー一-龥\d])/g, "$1$2")
      // Remove whitespace immediately before closing brackets
      .replace(/\s+([）)」』】])/g, "$1")
      // Remove whitespace immediately after opening brackets
      .replace(/([（(「『【])\s+/g, "$1")
      // Collapse consecutive whitespace into one
      .replace(/\s+/g, " ")
      // Trim leading and trailing whitespace
      .trim()
  );
};
