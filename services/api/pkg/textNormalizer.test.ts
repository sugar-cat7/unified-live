import { describe, expect, it } from "vitest";
import { normalizeJapaneseText } from "./textNormalizer";

// ============================================
// normalizeJapaneseText tests
// ============================================

describe("normalizeJapaneseText", () => {
  describe("whitespace around punctuation", () => {
    const punctuationTestCases = [
      {
        name: "removes whitespace after period",
        input: "これはテストです。 次の文です。",
        expected: "これはテストです。次の文です。",
      },
      {
        name: "removes whitespace after comma",
        input: "りんご、 みかん、 バナナ",
        expected: "りんご、みかん、バナナ",
      },
      {
        name: "removes whitespace before period",
        input: "これはテストです 。",
        expected: "これはテストです。",
      },
      {
        name: "removes whitespace before comma",
        input: "りんご 、みかん",
        expected: "りんご、みかん",
      },
      {
        name: "removes whitespace around exclamation marks",
        input: "すごい ！ 素晴らしい！",
        expected: "すごい！素晴らしい！",
      },
      {
        name: "removes whitespace around question marks",
        input: "本当 ？ 嘘？",
        expected: "本当？嘘？",
      },
      {
        name: "removes whitespace around half-width commas",
        input: "A , B , C",
        expected: "A,B,C",
      },
    ];

    it.each(punctuationTestCases)("$name", ({ input, expected }) => {
      expect(normalizeJapaneseText(input)).toBe(expected);
    });
  });

  describe("whitespace between Japanese characters", () => {
    const japaneseSpaceTestCases = [
      {
        name: "removes whitespace between hiragana",
        input: "これ は テスト です",
        expected: "これはテストです",
      },
      {
        name: "removes whitespace between katakana",
        input: "テスト ケース",
        expected: "テストケース",
      },
      {
        name: "removes whitespace between kanji",
        input: "日本 語 処理",
        expected: "日本語処理",
      },
      {
        name: "removes whitespace between mixed character types",
        input: "漢字 と ひらがな と カタカナ",
        expected: "漢字とひらがなとカタカナ",
      },
      {
        name: "removes whitespace between digits and Japanese characters",
        input: "2024 年 1 月",
        expected: "2024年1月",
      },
      {
        name: "removes multiple consecutive whitespace",
        input: "これは    テストです",
        expected: "これはテストです",
      },
    ];

    it.each(japaneseSpaceTestCases)("$name", ({ input, expected }) => {
      expect(normalizeJapaneseText(input)).toBe(expected);
    });
  });

  describe("whitespace around brackets", () => {
    const bracketTestCases = [
      {
        name: "removes whitespace before closing brackets",
        input: "（テスト ）",
        expected: "（テスト）",
      },
      {
        name: "removes whitespace after opening brackets",
        input: "（ テスト）",
        expected: "（テスト）",
      },
      {
        name: "handles whitespace around full-width corner brackets",
        input: "「 テスト 」",
        expected: "「テスト」",
      },
      {
        name: "handles whitespace around half-width brackets",
        input: "( test )",
        expected: "(test)",
      },
      {
        name: "handles whitespace around lenticular brackets",
        input: "【 タイトル 】",
        expected: "【タイトル】",
      },
    ];

    it.each(bracketTestCases)("$name", ({ input, expected }) => {
      expect(normalizeJapaneseText(input)).toBe(expected);
    });
  });

  describe("leading and trailing whitespace", () => {
    const trimTestCases = [
      {
        name: "removes leading whitespace",
        input: "  テスト",
        expected: "テスト",
      },
      {
        name: "removes trailing whitespace",
        input: "テスト  ",
        expected: "テスト",
      },
      {
        name: "removes both leading and trailing whitespace",
        input: "  テスト  ",
        expected: "テスト",
      },
    ];

    it.each(trimTestCases)("$name", ({ input, expected }) => {
      expect(normalizeJapaneseText(input)).toBe(expected);
    });
  });

  describe("combined test cases", () => {
    const complexTestCases = [
      {
        name: "sentence with multiple patterns",
        input: "  これは 、 テスト です 。  次の 文 です 。  ",
        expected: "これは、テストです。次の文です。",
      },
      {
        name: "sentence with brackets and punctuation",
        input: "「 こんにちは 」 、 「 さようなら 」",
        expected: "「こんにちは」、「さようなら」",
      },
      {
        name: "sentence with digits and punctuation",
        input: "2024 年 1 月 1 日 、 新年",
        expected: "2024年1月1日、新年",
      },
    ];

    it.each(complexTestCases)("$name", ({ input, expected }) => {
      expect(normalizeJapaneseText(input)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("handles an empty string", () => {
      expect(normalizeJapaneseText("")).toBe("");
    });

    it("handles a whitespace-only string", () => {
      expect(normalizeJapaneseText("   ")).toBe("");
    });

    it("preserves whitespace in English text", () => {
      expect(normalizeJapaneseText("Hello World")).toBe("Hello World");
    });

    it("handles mixed Japanese and English text", () => {
      // Whitespace around English words is preserved (not covered by the Japanese character regex pattern)
      expect(normalizeJapaneseText("これは test です")).toBe(
        "これは test です",
      );
    });
  });
});
