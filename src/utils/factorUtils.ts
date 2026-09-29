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

// 因数分解の正誤判定メイン関数
export const checkFactorAnswer = (userInput: string, correctAnswer: string): boolean => {
  if (!userInput || !userInput.trim()) return false;

  // カッコ (...) の中身を抽出する正規表現
  const extractFactors = (str: string): string[] => {
    const matches = str.match(/\([^)]+\)/g);
    if (!matches) {
      // カッコがない入力（そのままの文字列）の場合は1つの要素として扱う
      return [normalizeFactor(str)];
    }
    // 各カッコの中身を取り出して正規化し、カッコ全体の順番もソートする
    return matches
      .map(m => normalizeFactor(m.slice(1, -1))) // "(x+5)" -> "x+5" -> 正規化
      .sort(); // カッコ同士の順番（順不同）を揃える
  };

  const userFactors = extractFactors(userInput);
  const correctFactors = extractFactors(correctAnswer);

  if (userFactors.length !== correctFactors.length) return false;

  return userFactors.every((val, idx) => val === correctFactors[idx]);
};