import jsPDF from 'jspdf';

// 配列を chunkSize(20) ごとに分割するヘルパー関数
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

// jsPDFで2行分数を描画するヘルパー関数
function drawFraction(
  pdf: jsPDF,
  prefix: string,  // 例: "1. x = "
  numerator: string,  // 分子 (例: "1 ± √5")
  denominator: string, // 分母 (例: "2")
  x: number,
  y: number
) {
  pdf.setFontSize(13);

  // 1. "1. x = " の描画
  pdf.text(prefix, x, y, { align: 'left' });
  const prefixWidth = pdf.getTextWidth(prefix);
  const startX = x + prefixWidth;

  // 分子と分母の幅を計測して長い方に合わせる
  const numWidth = pdf.getTextWidth(numerator);
  const denWidth = pdf.getTextWidth(denominator);
  const fracWidth = Math.max(numWidth, denWidth) + 4; // 左右に余裕を持たせる

  // 2. 分子 (少し上に配置)
  const numX = startX + (fracWidth - numWidth) / 2;
  pdf.text(numerator, numX, y - 4);

  // 3. 分数線 (横線)
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1,0], 0)
  pdf.line(startX+2, y-3, startX + fracWidth*1.5, y-3);

  // 4. 分母 (少し下に配置)
  const denX = startX + (fracWidth - denWidth) / 2;
  pdf.text(denominator, denX+3, y + 1);
}

// テキスト内の指数 (例: 2^3) や √ を解析して描画する関数
function drawFormattedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  baseFontSize: number = 13
) {
  // 1. 文字化け対策: √記号の調整 (標準フォントで化ける場合は √ -> v や √(...) に置換)
  // ※標準Helveticaを使う場合は文字化け防止のため '√' を '√' が通るフォントにするか 'v' 等に変換
  let processedText = text.replace(/√/g, '√'); 

  // 2. 指数 (^数字) の分割処理
  // 例: "2^3 × 5^2" -> ["2", "^3", " × ", "5", "^2"]
  const parts = processedText.split(/(\^\d+)/g);
  let currentX = x;

  parts.forEach((part) => {
    if (part.startsWith('^')) {
      // --- 上付き文字 (指数) の描画 ---
      const expText = part.slice(1); // "^3" -> "3"
      
      // 文字サイズを小さくする (例: 13pt -> 9pt)
      const smallFontSize = Math.round(baseFontSize * 0.65);
      pdf.setFontSize(smallFontSize);

      // 通常の位置より少し上に配置 (Y座標を -2.5mm 上げる)
      pdf.text(expText, currentX, y - 2.2);

      // X位置を進める
      currentX += pdf.getTextWidth(expText);
    } else {
      // --- 通常テキストの描画 ---
      pdf.setFontSize(baseFontSize);
      pdf.text(part, currentX, y);

      // X位置を進める
      currentX += pdf.getTextWidth(part);
    }
  });

  // フォントサイズを元に戻しておく
  pdf.setFontSize(baseFontSize);
}

export async function exportToPDF(
  questions: string[],
  answers: string[]
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const PAGE_SIZE = 20; // 1ページあたりの問題数

  const questionPages = chunkArray(questions, PAGE_SIZE);
  const answerPages = chunkArray(answers, PAGE_SIZE);

  let isFirstPage = true;

  for (let pageIdx = 0; pageIdx < questionPages.length; pageIdx++) {
    const pageQuestions = questionPages[pageIdx];
    const pageAnswers = answerPages[pageIdx];

    // --- 1. 表面（問題：左揃え） ---
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    // タイトル (h2: margin-bottom 10px 相当)
    pdf.setFontSize(30);
    pdf.text(`Questions`, 105, 12, { align: 'center' });

    // 問題文 (font-size: 13pt / padding-left: 15mm)
    pdf.setFontSize(20);
    let startY = 22;        // 開始Y位置 (mm)
    const lineHeight = 14; // 20問がA4枠内にきれいに収まる行間

    pageQuestions.forEach((q, i) => {
      const y = startY + i * lineHeight;
      pdf.text(q, 15, y, { align: 'left' });
      
      // 下線の破線（border-bottom: 1px dotted #ccc 相当）
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(15, y + 2, 195, y + 2);
    });

    // --- 2. 裏面（解答：左揃え） ---
    pdf.addPage();

    // タイトル
    pdf.setFontSize(30);
    pdf.text(`Answers`, 105, 12, { align: 'center' });

    // 解答文
    pdf.setFontSize(20);
    pageAnswers.forEach((a, i) => {
      const y = startY + i * lineHeight;
      // "(分子) / 分母" の形式かを判定
      const match = a.match(/^x\s*=\s*\((.*?)\)\s*\/\s*(.+)$/);

      if (match) {
        const [, num, den] = match;
        drawFraction(pdf, `x = `, num, den, 15, y);
      } else {
        // 整数解などの通常描画
        pdf.text(`${a}`, 15, y, { align: 'left' });
      }
      
      // 下線の破線
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(15, y + 2, 195, y + 2);
    });
  }

  // ファイル書き出し（ダウンロード）
  pdf.save('prime-quiz-20.pdf');
}