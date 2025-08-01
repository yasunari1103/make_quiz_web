// ユークリッドの互除法（最大公約数）
function gcd(a, b) {
    while (b !== 0) {
    let tmp = b;
    b = a % b;
    a = tmp;
    }
    return a;
}

function makeQuizGCD() {
    const outputQuestion = document.getElementById("outputQuestion");
    const outputAnswer = document.getElementById("outputAnswer");
    outputQuestion.innerHTML = "";
    outputAnswer.innerHTML = "";
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [50,100,1000,10000]

    while(count < number) {
        if (level < 1 || level > level_list.length) {
            outputQuestion.innerHTML = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
            return;
        }

        let a = Math.floor(Math.random() * level_list[level-1] * 100);
        let b = Math.floor(Math.random() * level_list[level-1] * 100);

        if (a === 0 || b === 0 || a === b) continue;
        let result = gcd(a, b);

        if (result > level_list[level-1] && a !== result && b !== result) {
            outputQuestion.innerHTML += `${a}と${b}の最大公約数は？<br>`;
            outputAnswer.innerHTML += `答え：${result}<br>`
            count++;
        }
    }
}

function primeFactorize(n) {
    const factorMap = new Map();
    let divisor = 2;
    while (n >= 2) {
        if (n % divisor === 0) {
            factorMap.set(divisor, (factorMap.get(divisor) || 0) + 1);
            n = n / divisor;
        } else {
            divisor++;
        }
    }
    return factorMap;
}

function makeQuizPrimeFactorization() {
    const outputQuestion = document.getElementById("outputQuestion");
    const outputAnswer = document.getElementById("outputAnswer");
    outputQuestion.innerHTML = "";
    outputAnswer.innerHTML = "";
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [50, 100, 1000, 10000];

    if (level < 1 || level > level_list.length) {
        outputQuestion.innerHTML = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
        return;
    }

    let quizCount = 0;
    while (quizCount < number) {
        let n = Math.floor(Math.random() * level_list[level - 1] * 10) + 2;
        let factorMap = primeFactorize(n);
        if ((factorMap.size > 1 && [...factorMap.keys()].every(p => p < 1000)) || (factorMap.size === 1 && [...factorMap.values()][0] > 1)) {
            const [factor, count] = factorMap.entries();

            let formatted = [...factorMap.entries()].map(([factor, count]) => count > 1 ? `${factor}^${count}` : `${factor}`).join(" × ");
            outputQuestion.innerHTML += `${n}の素因数分解は？<br>`;
            outputAnswer.innerHTML += `答え：${formatted}<br>`
            quizCount++;
        }
    }
}


function makeQuizFactorization() {
    const outputQuestion = document.getElementById("outputQuestion");
    const outputAnswer = document.getElementById("outputAnswer");
    outputQuestion.innerHTML = "";
    outputAnswer.innerHTML = "";
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [5, 10, 50, 250]; // 難易度で係数の範囲が変わる

    if (level < 1 || level > level_list.length) {
        outputQuestion.innerHTML = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
        return;
    }

    function formatTerm(coef, variable = '') {
        if (coef === 0) return '';
        if (coef > 0) return `+ ${coef}${variable}`;
        else return `- ${Math.abs(coef)}${variable}`;
    }

    function formatFactor(num) {
        if (num >= 0) return `(x + ${num})`;
        else return `(x - ${Math.abs(num)})`;
    }

    while (count < number) {
        let a = Math.floor(Math.random() * level_list[level - 1]) + 1;
        let b = Math.floor(Math.random() * level_list[level - 1]) + 1;

        if (Math.random() < 0.5) a = -a;
        if (Math.random() < 0.5) b = -b;

        const A = a + b;
        const B = a * b;

        // 1項目（x²）の係数は省略（1なので）
        // 2項目（x）の係数はフォーマットして＋−を整える
        // 定数項は符号付きで表示
        const xTerm = formatTerm(A, 'x').trimStart(); // 先頭の＋は残すか不要なら削る
        const constTerm = (B >= 0) ? `+ ${B}` : `- ${Math.abs(B)}`;

        // 出力例: x² - 8x + 12 = (x - 6)(x - 2)
        outputQuestion.innerHTML += `x² ${xTerm} ${constTerm} を因数分解すると？<br>`;
        outputAnswer.innerHTML += `答え${formatFactor(a)}${formatFactor(b)}<br>`

        count++;
    }

}


async function saveToExcel() {
  // まずoutputQuestionとoutputAnswerからテキスト取得
  const QuestionText = document.getElementById('outputQuestion').innerText;
  const answerText = document.getElementById('outputAnswer').innerText;

  // 問題は改行で分割して配列に
  const questions = QuestionText.split('\n').filter(line => line.trim() !== '');
  const answers = answerText.split('\n').filter(line => line.trim() !== '');

  // ここで問題と答えを4列テーブル風に並べたいならこんな感じ
  // 例： [問題1, "", 問題2, ""] と [答え1, "", 答え2, ""] の2行目
  // 空白列は回答欄や区切り用に入れる

  const dataQ = [];
  const dataA = [];

  for (let i = 0; i < questions.length; i += 2) {
    const rowQ = [];
    const rowA = [];
    rowQ[0] = `${i + 1}問目: ${questions[i]}`;    // A列
    rowA[0] = `${i + 1}問目: ${answers[i]}`;    // A列
    rowQ[1] = "";         // B列空白
    rowA[1] = "";         // B列空白
    if (i + 1 < questions.length) {
      rowQ[2] = `${i + 2}問目: ${questions[i + 1]}`; // C列
      rowA[2] = "";       // C列空白
      rowQ[3] = "";       // D列空白
      rowA[3] = `${i + 2}問目: ${answers[i + 1]}`; // D列

    }
    dataQ.push(rowQ);
    dataA.push(rowA);
  }

  // SheetJSの読み込みが前提（https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js）
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(dataQ);
  const ws2 = XLSX.utils.aoa_to_sheet(dataA);

  XLSX.utils.book_append_sheet(wb, ws1, "Quiz");
  XLSX.utils.book_append_sheet(wb, ws2, "Answer");

  // ファイル保存
  XLSX.writeFile(wb, "quiz.xlsx");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleAnswerBtn");
  const answerBox = document.getElementById("outputAnswer");

  btn.addEventListener("click", () => {
    const isVisible = answerBox.style.display !== "none";
    answerBox.style.display = isVisible ? "none" : "block";
    btn.textContent = isVisible ? "表示" : "隠す";
  });
});
