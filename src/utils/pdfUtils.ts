import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 配列を chunkSize(30) ごとに分割するヘルパー関数
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

export async function exportToPDF(
  questions: string[],
  answers: string[],
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const PAGE_SIZE = 20; // 1ページあたりの問題数

  const questionPages = chunkArray(questions, PAGE_SIZE);
  const answerPages = chunkArray(answers, PAGE_SIZE);

  // 一時的に生成するレンダリング用コンテナ
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  document.body.appendChild(container);

  let isFirstPage = true;

  for (let pageIdx = 0; pageIdx < questionPages.length; pageIdx++) {
    const pageQuestions = questionPages[pageIdx];
    const pageAnswers = answerPages[pageIdx];

    // --- 1. 表面（問題：左揃え）のHTML作成 ---
    const qElem = document.createElement('div');
    qElem.style.cssText = 'width: 210mm; height: 297mm; padding-left: 15mm; padding-right: 15mm; padding-top: 3mm; background: #fff; color: #000; box-sizing: border-box;';
    qElem.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 10px; color: #000;">問題 (${pageIdx + 1}ページ目)</h2>
      <div style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
        ${pageQuestions
          .map(
            (q) =>
              `<div style="font-size: 13pt; font-family: monospace; border-bottom: 1px dotted #ccc; padding: 0px 0;">
                ${q}
              </div>`
          )
          .join('')}
      </div>
    `;
    container.appendChild(qElem);

    const canvasQ = await html2canvas(qElem, { scale: 2 });
    const imgDataQ = canvasQ.toDataURL('image/png');

    if (!isFirstPage) pdf.addPage();
    pdf.addImage(imgDataQ, 'PNG', 0, 0, 210, 297);
    isFirstPage = false;
    container.removeChild(qElem);

    // --- 2. 裏面（解答：右揃え）のHTML作成 ---
    const aElem = document.createElement('div');
    aElem.style.cssText = 'width: 210mm; height: 297mm; padding-left: 15mm; padding-right: 15mm; padding-top: 3mm; background: #fff; color: #000; box-sizing: border-box;';
    aElem.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 10px; color: #000;">解答 (${pageIdx + 1}ページ目)</h2>
      <div style="display: flex; flex-direction: column; gap: 6px; text-align: right;">
        ${pageAnswers
          .map(
            (a) =>
              `<div style="font-size: 13pt; font-family: monospace; border-bottom: 1px dotted #ccc; padding: 0px 0;">
                ${a}
              </div>`
          )
          .join('')}
      </div>
    `;
    container.appendChild(aElem);

    const canvasA = await html2canvas(aElem, { scale: 2 });
    const imgDataA = canvasA.toDataURL('image/png');

    pdf.addPage();
    pdf.addImage(imgDataA, 'PNG', 0, 0, 210, 297);
    container.removeChild(aElem);
  }

  document.body.removeChild(container);
  pdf.save('prime-quiz-30.pdf');
}