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
    const output = document.getElementById("output");
    output.innerText = ""; // 初期化
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [50,100,1000,10000]

    while(count < number) {
        if (level < 1 || level > level_list.length) {
            output.innerText = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
            return;
        }

        let a = Math.floor(Math.random() * level_list[level-1] * 100);
        let b = Math.floor(Math.random() * level_list[level-1] * 100);

        if (a === 0 || b === 0 || a === b) continue;
        let result = gcd(a, b);

        if (result > level_list[level-1] && a !== result && b !== result) {
            output.innerText += `${a}と${b}の最大公約数は${result}です\n`;
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
    const output = document.getElementById("output");
    output.innerText = "";
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [50, 100, 1000, 10000];

    if (level < 1 || level > level_list.length) {
        output.innerText = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
        return;
    }

    let quizCount = 0;
    while (quizCount < number) {
        let n = Math.floor(Math.random() * level_list[level - 1] * 10) + 2;
        let factorMap = primeFactorize(n);
        if (factorMap.size > 1 || (factorMap.size === 1 && [...factorMap.values()][0] > 1)) {
            if (count > 1) {formatted = [...factorMap.entries()].map(([factor, count]) => `${factor}^${count}`).join(" × ");}
            else {formatted = [...factorMap.entries()].map(([factor, count]) => `${factor}`).join(" × ");}
            output.innerText += `${n}の素因数分解は${formatted}です\n`;
            quizCount++;
        }
    }
}


function makeQuizFactorization() {
    const output = document.getElementById("output");
    output.innerText = "";
    let count = 0;
    const number = parseInt(document.getElementById("number").value);
    const level = parseInt(document.getElementById("level").value);
    const level_list = [5, 10, 50, 250]; // 難易度で係数の範囲が変わる

    if (level < 1 || level > level_list.length) {
        output.innerText = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
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
        output.innerText += `x² ${xTerm} ${constTerm} = ${formatFactor(a)}${formatFactor(b)}\n`;

        count++;
    }

}
