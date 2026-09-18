import * as XLSX from 'xlsx';

const levelList = [50, 300, 1000, 10000, 50000];

export function gcd(a: number, b: number): number {
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function primeFactorize(n: number): number[] {
  const factors: number[] = [];

  // 1. まず 2 で割れるだけ割る（これで偶数のチェックを全カット）
  while (n % 2 === 0) {
    factors.push(2);
    n /= 2;
  }

  // 2. 3以上の奇数だけを試し割りする
  //    divisor * divisor > n (つまり divisor > √n) になったらループ終了
  let divisor = 3;
  while (divisor * divisor <= n) {
    if (n % divisor === 0) {
      factors.push(divisor);
      n /= divisor;
    } else {
      divisor += 2; // 奇数だけ進める (+2)
    }
  }

  // 3. 最後に残った n が 1 より大きければ、それ自身が最後の素数！
  if (n > 1) {
    factors.push(n);
  }

  return factors;
}

// ---- 各設問作成　（配列　{ questions, answers } を返すように） ----

export function makeQuizGCD(num: number, level: number) {
  if (level < 1 || level > levelList.length) {
    throw new Error(`レベルは1～${levelList.length}の範囲で指定してください。`);
  }

  const questions = [];
  const answers = [];
  let count = 0;

  while (count < num) {
    let a = Math.floor(Math.random() * levelList[level - 1] * 100);
    let b = Math.floor(Math.random() * levelList[level - 1] * 100);

    if (a === 0 || b === 0 || a === b) continue;
    let result = gcd(a,b);

    if (result > levelList[level - 1] && a != result && b != result) {
      questions.push(`gcd (${a},${b}) = `);
      answers.push(result.toString());
      count++;
    }
  }

  return { questions, answers };
}

export function makeQuizPrimeFactorization(num: number, level: number) {
  if (level < 1 || level > levelList.length) {
    throw new Error(`レベルは1～${levelList.length}の範囲で指定してください。`);
  }

  const questions = [];
  const answers = [];
  let quizCount = 0;

  while (quizCount < num) {
    let n = Math.floor(Math.random() * levelList[level - 1] * 10) + 2;
    const factors = primeFactorize(n);

    if (
      (factors.length > 1 && factors.every((factor) => factor < levelList[level - 1] / 2))) {
      const factorCounts = new Map<number, number>();
      for (const factor of factors) {
        factorCounts.set(factor, (factorCounts.get(factor) ?? 0) + 1);
      }
      const formatted = [...factorCounts.entries()]
        .map(([factor, count]) => (count > 1 ? `${factor}^${count}` : `${factor}`))
        .join(" × ");

      questions.push(`${n} = `);
      answers.push(formatted);
      quizCount++;
    }
  }

  return { questions, answers };
}

export function makeQuizFactorization(num: number, level: number) {
  if (level < 1 || level > levelList.length) {
    throw new Error(`レベルは1～${levelList.length}の範囲で指定してください。`);
  }

  function formatTerm(coef: number, variable: string) {
    variable = "";
    if (coef === 0) return "";
    if (coef > 0) return `+ ${coef}${variable}`;
    return `- ${Math.abs(coef)}${variable}`
  }

  function formatFactor(num: number) {
    if (num >= 0) return `(x + ${num})`;
    return `(x - ${Math.abs(num)})`;
  }

  const questions = [];
  const answers = [];
  let count = 0;

  while (count < num) {
    let a = Math.floor(Math.random() * levelList[level - 1]) + 1;
    let b = Math.floor(Math.random() * levelList[level - 1]) + 1;

    if (Math.random() < 0.5) a = -a;
    if (Math.random() < 0.5) b = -b;

    const A = a + b;
    const B = a * b;

    const xTerm = formatTerm(A, "x").trimStart();
    const constTerm = B > 0 ? `+ ${B}` : `- ${Math.abs(B)}`;

    questions.push(`x²　${xTerm} ${constTerm} = `);
    answers.push(`${formatFactor(a)}${formatFactor(b)}`);
    count++;
  }

  return { questions, answers };
}

export function saveToExcel(questions: string[], answers: string[], isAnswerVisible: boolean) {
  if (!isAnswerVisible) {
    alert("回答を表示してから実行してください。");
    return;
  }

  const data: string[][][] = [];

  for (let i = 0;i < questions.length; i++) {
    const blockIndex = Math.floor(i / 32);
    const withinBlockIndex = i % 32;

    if (!data[blockIndex]) {
      data[blockIndex] =[["【問題】"]];
    }
    data[blockIndex].push([`${withinBlockIndex + 1}問目: ${questions[i]}`]);
  }

  for (let blockIndex = 0;blockIndex < data.length; blockIndex++) {
    data[blockIndex].push(["【解答】"]);
    for (
      let i = blockIndex * 32;
      i < Math.min((blockIndex + 1) * 32, answers.length);
      i++
    ) {
      data[blockIndex].push([`${(i % 32) + 1}問目: ${answers[i]}`]);
    }
  }

  const finalData: string[][] = data.flat();

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(finalData);
  XLSX.utils.book_append_sheet(wb, ws, "Quiz+Answer");
  XLSX.writeFile(wb, "quiz.xlsx");
}
