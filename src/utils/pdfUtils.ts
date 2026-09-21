import jsPDF from 'jspdf';

// 配列を chunkSize(20) ごとに分割するヘルパー関数
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

/**
 * テキスト（指数 ^数字 を含む）を描画し、描画した全体の横幅(mm)を返す
 */
function drawFormattedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  baseFontSize: number = 13
): number {
  // 標準フォント向け文字化け対策 (√ -> v)
  const processedText = text.replace(/√/g, 'v');

  // 指数 (^数字) の分割処理
  const parts = processedText.split(/(\^\d+)/g);
  let currentX = x;

  parts.forEach((part) => {
    if (part.startsWith('^')) {
      const expText = part.slice(1);
      const smallFontSize = Math.round(baseFontSize * 0.65);
      
      pdf.setFontSize(smallFontSize);
      pdf.text(expText, currentX, y - 2.2);
      currentX += pdf.getTextWidth(expText);
    } else {
      pdf.setFontSize(baseFontSize);
      pdf.text(part, currentX, y);
      currentX += pdf.getTextWidth(part);
    }
  });

  pdf.setFontSize(baseFontSize);
  return currentX - x;
}

/**
 * 指数対応テキストの横幅をあらかじめ計算する
 */
function getFormattedTextWidth(pdf: jsPDF, text: string, baseFontSize: number = 13): number {
  const processedText = text.replace(/√/g, 'v');
  const parts = processedText.split(/(\^\d+)/g);
  let totalWidth = 0;

  parts.forEach((part) => {
    if (part.startsWith('^')) {
      const expText = part.slice(1);
      pdf.setFontSize(Math.round(baseFontSize * 0.65));
      totalWidth += pdf.getTextWidth(expText);
    } else {
      pdf.setFontSize(baseFontSize);
      totalWidth += pdf.getTextWidth(part);
    }
  });

  pdf.setFontSize(baseFontSize);
  return totalWidth;
}

/**
 * 数式（分数・指数対応）を描画するメイン関数
 */
function drawMathExpression(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  baseFontSize: number = 13
) {
  pdf.setFontSize(baseFontSize);

  // "x = (分子) / 分母" の分数パターン判定
  const fractionMatch = text.match(/^(.*?)\((.*?)\)\s*\/\s*(.+)$/);

  if (fractionMatch) {
    const [, prefix, numerator, denominator] = fractionMatch;

    // 1. 接頭辞 ("1. x = ") の描画
    const prefixWidth = drawFormattedText(pdf, prefix, x, y, baseFontSize);
    const startX = x + prefixWidth;

    // 2. 分子・分母の幅計算
    const numWidth = getFormattedTextWidth(pdf, numerator, baseFontSize);
    const denWidth = getFormattedTextWidth(pdf, denominator, baseFontSize);
    const fracWidth = Math.max(numWidth, denWidth) + 3;

    // 3. 分子 (上側)
    const numX = startX + (fracWidth - numWidth) / 2;
    drawFormattedText(pdf, numerator, numX, y - 3.5, baseFontSize);

    // 4. 分数線
    pdf.setLineWidth(0.3);
    pdf.setLineDashPattern([1, 0], 0);
    pdf.line(startX, y - 1.5, startX + fracWidth, y - 1.5);

    // 5. 分母 (下側)
    const denX = startX + (fracWidth - denWidth) / 2;
    drawFormattedText(pdf, denominator, denX, y + 3.5, baseFontSize);
  } else {
    // 通常テキスト（指数含む）
    drawFormattedText(pdf, text, x, y, baseFontSize);
  }
}

/**
 * 高速PDF出力関数（メイン）
 */
export async function exportToPDF(questions: string[], answers: string[]) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const PAGE_SIZE = 20; // 1ページ20問

  const questionPages = chunkArray(questions, PAGE_SIZE);
  const answerPages = chunkArray(answers, PAGE_SIZE);

  let isFirstPage = true;

  for (let pageIdx = 0; pageIdx < questionPages.length; pageIdx++) {
    const pageQuestions = questionPages[pageIdx];
    const pageAnswers = answerPages[pageIdx];
    const startNum = pageIdx * PAGE_SIZE + 1;

    // --- 1. 表面 (問題) ---
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    pdf.setFontSize(16);
    pdf.text(`Questions`, 105, 12, { align: 'center' });

    let startY = 24;
    const lineHeight = 13.0; // 20問用の行間

    pageQuestions.forEach((q, i) => {
      const y = startY + i * lineHeight;
      const text = `${startNum + i}. ${q}`;

      drawMathExpression(pdf, text, 15, y, 13);

      // 下線（破線）
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(15, y + 2, 195, y + 2);
    });

    // --- 2. 裏面 (解答) ---
    pdf.addPage();

    pdf.setFontSize(16);
    pdf.text(`Answers`, 105, 12, { align: 'center' });

    pageAnswers.forEach((a, i) => {
      const y = startY + i * lineHeight;
      const text = `${startNum + i}. ${a}`;

      drawMathExpression(pdf, text, 15, y, 13);

      // 下線（破線）
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(15, y + 2, 195, y + 2);
    });
  }

  pdf.save('math-quiz.pdf');
}