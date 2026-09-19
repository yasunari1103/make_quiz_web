import jsPDF from 'jspdf';

// 配列を chunkSize(20) ごとに分割するヘルパー関数
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
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
      pdf.text(a, 15, y, { align: 'left' });
      
      // 下線の破線
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(15, y + 2, 195, y + 2);
    });
  }

  // ファイル書き出し（ダウンロード）
  pdf.save('prime-quiz-20.pdf');
}