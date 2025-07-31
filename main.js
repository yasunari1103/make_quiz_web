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
    const level_list = [50,100,1000]

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
    const level_list = [50, 100, 1000];

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
    const level_list = [5, 10, 50]; // 難易度で係数の範囲が変わる

    if (level < 1 || level > level_list.length) {
        output.innerText = "レベルは1〜" + level_list.length + "の範囲で入力してね！";
        return;
    }

    while (count < number) {
        const a = Math.floor(Math.random() * level_list[level - 1]) + 1;
        const b = Math.floor(Math.random() * level_list[level - 1]) + 1;
        const c = Math.floor(Math.random() * level_list[level - 1]) + 1;
        const d = Math.floor(Math.random() * level_list[level - 1]) + 1;

        // 展開: (ax + b)(cx + d) = acx^2 + (ad + bc)x + bd
        const A = a * c;
        const B = a * d + b * c;
        const C = b * d;

        output.innerText += `${A}x² + ${B}x + ${C} = (${a}x + ${b})(${c}x + ${d})\n`;
        count++;
    }
}
