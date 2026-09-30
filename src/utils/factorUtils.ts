// カッコ内の項（例: "x+5" や "5+x"）を正規化して揃える関数
const normalizeFactor = (factor: string): string => {
  // 空白を除去
  const clean = factor.replace(/\s+/g, '');
  
  // "+" や "-" の前で分割して項に分解 (例: "x+5" -> ["x", "+5"], "-24+x" -> ["-24", "+x"])
  const terms = clean.match(/[+-]?[^+-]+/g) || [clean];
  
  // 各項をアルファベット順・昇順に並び替えて結合（"5+x" も "-24+x" も "x+5" / "x-24" に統一される）
  return terms
    .map(t => (t.startsWith('+') || t.startsWith('-') ? t : `+${t}`)) // 符号を明示
    .sort()
    .join('');
};

// 式（例: "(x+5)(x-24)"）から数字（定数項）だけを抽出してソートする関数
export const extractNumbersFromFormula = (formula: string): string[] => {
  if (!formula) return [];
  formula = formula.replace(/\s/g, "");

  const matches = formula.match(/[+-]?\d+/g) || [];
  return matches
    .map((num) => num.replace(/^\+/, ''))
    .sort((a, b) => Number(a) - Number(b));
};

// ユーザー入力の数字文字列（例: "5, -24" や "5*24"）から数字を抽出する関数
export const extractNumbersFromInput = (input: string): string[] => {
  if (!input) return [];
  input = input.replace(/\s/g, "");

  // 数字（符号つき）のみ抽出
  const matches = input.match(/[+-]?\d+/g) || [];

  return matches
    .map((num) => num.replace(/^\+/, ''))
    .sort((a, b) => Number(a) - Number(b));
};

// 因数分解の比較関数
export const checkFactorAnswer = (userInputStr: string, correctAnswerFormula: string): boolean => {
  const userNums = extractNumbersFromInput(userInputStr);
  const correctNums = extractNumbersFromFormula(correctAnswerFormula);

  if (userNums.length !== correctNums.length || userNums.length === 0) {
    return false;
  }

  // ソートされた配列同士を比較
  return userNums.every((val, idx) => val === correctNums[idx]);
};