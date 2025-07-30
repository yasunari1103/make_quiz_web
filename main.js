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