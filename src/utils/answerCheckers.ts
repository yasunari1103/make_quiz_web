// src/utils/mathHelpers.ts

/**
 * ユーザーの入力文字列（例: "3 * 2^2" や "2*2*3"）を素数の配列 [2, 2, 3] に変換する
 */
export const parsePrimeFactors = (input: string): number[] => {
  if (!input || !input.trim()) return [];

  // 表記揺れを統一（全角×や*、スペース除去）
  const normalized = input
    .replace(/×/g, '*')
    .replace(/\s+/g, '');

  const terms = normalized.split('*');
  const factors: number[] = [];

  for (const term of terms) {
    if (!term) continue;

    if (term.includes('^')) {
      const [baseStr, expStr] = term.split('^');
      const base = parseInt(baseStr, 10);
      const exp = parseInt(expStr, 10);

      if (!isNaN(base) && !isNaN(exp) && exp > 0) {
        for (let i = 0; i < exp; i++) {
          factors.push(base);
        }
      }
    } else {
      const num = parseInt(term, 10);
      if (!isNaN(num)) {
        factors.push(num);
      }
    }
  }

  return factors.sort((a, b) => a - b);
};

/**
 * 素因数（数値配列）の一致チェック
 */
export const checkAnswerFactors = (arr1: number[], arr2: number[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
};

/**
 * 総合判定用の便利関数（文字列の入力と正解配列を渡せば判定してくれる）
 */
export const isPrimeAnswerCorrect = (userInput: string, correctAnswer: number[]): boolean => {
  const parsedUserAnswer = parsePrimeFactors(userInput);
  const sortedCorrectAnswer = [...correctAnswer].sort((a, b) => a - b);
  return checkAnswerFactors(parsedUserAnswer, sortedCorrectAnswer);
};