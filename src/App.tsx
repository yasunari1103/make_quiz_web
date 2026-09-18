// App.tsx
import { useState } from 'react';
import {
  makeQuizGCD,
  makeQuizPrimeFactorization,
  makeQuizFactorization,
  saveToExcel,
} from './utils/quizUtils';
import './App.css';
import { FormattedText } from './components/FormattedText';
import { exportToPDF } from './utils/pdfUtils';

export default function App() {
  const [number, setNumber] = useState<string>('10');
  const [level, setLevel] = useState<string>('1');
  const [showAnswer, setShowAnswer] = useState<boolean>(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 💡 handleGenerate は App の中に書く！
  const handleGenerate = (type: 'GCD' | 'PRIME' | 'FACTOR') => {
    try {
      const num = parseInt(number, 10);
      const lvl = parseInt(level, 10);

      if (isNaN(num) || isNaN(lvl)) {
        setErrorMessage('数字を正しく入力してください');
        return;
      }

      let result = { questions: [] as string[], answers: [] as string[] };

      if (type === 'GCD') {
        result = makeQuizGCD(num, lvl);
      }
      else if (type === 'PRIME') {
        result = makeQuizPrimeFactorization(num, lvl);
      }
      else if (type === 'FACTOR') {
        result = makeQuizFactorization(num, lvl);
      }

      setQuestions(result.questions);
      setAnswers(result.answers);
      setErrorMessage(''); // エラーをクリア
    } catch (err: any) {
      setErrorMessage(err.message);
      setQuestions([]);
      setAnswers([]);
    }
  };

  return (
    <div　className="App">
      <h1>基礎計算問題作成機</h1>

      {/* エラーメッセージがある場合に表示 */}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <div>
        <label htmlFor="number">問題数 (10~9999)</label>
        <input
          type="text"
          id="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <br />

        <label htmlFor="level">難易度 (1~5)</label>
        <input
          type="text"
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
        <br />
      </div>
            <button className="fixed-btn" onClick={() => setShowAnswer((visible) => !visible)}>
              {showAnswer ? '解答を隠す' : '解答を表示'}
            </button>

      <div>
        {/* ボタンの onClick で handleGenerate を呼び出す */}
        <button onClick={() => handleGenerate('GCD')}>最大公約数の問題</button>
        <button onClick={() => handleGenerate('PRIME')}>素因数分解の問題</button>
        <button onClick={() => handleGenerate('FACTOR')}>因数分解の問題</button>
      </div>

      {(questions.length > 0) && showAnswer && (
        <>
          <div>
            <button onClick={() => saveToExcel(questions, answers, showAnswer)}>
              Excelで保存
            </button>
            <button onClick={() => exportToPDF(questions, answers)}>
              PDFとして保存（問題数は20の倍数にしてください）
            </button>
          </div>
        </>)}
        {(questions.length > 0) && (<>
          <div id="output">
            <section id="outputQuestion">
              <h2>問題</h2>
              {questions.map((question, index) => (
                <p key={`question-${index}`}>{index + 1}問目: {question}</p>
              ))}
            </section>

            {showAnswer && (
              <section id="outputAnswer">
                <h2>解答</h2>
                {answers.map((answer, index) => (
                  <p key={`answer-${index}`}>
                    {index + 1}問目: <FormattedText text={answer} />
                    </p>
                ))}
              </section>
            )}
          </div>
          {/* 画面外に配置するPDF用のレイアウト容器（画面上は非表示、またはスタイルで綺麗に配置） */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            {/* 表面（問題） */}
            <div id="pdf-surface-questions" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', background: '#fff', color: '#000' }}>
              <h1 style={{ textAlign: 'center', color: '#000' }}>問題</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {questions.map((q, i) => (
                  <p key={i} style={{ fontSize: '16pt', margin: '8px 0' }}>{i + 1}. <FormattedText text={q} /></p>
                ))}
              </div>
            </div>

            {/* 裏面（解答） */}
            <div id="pdf-surface-answers" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', background: '#fff', color: '#000' }}>
              <h1 style={{ textAlign: 'center', color: '#000' }}>解答</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {answers.map((a, i) => (
                  <p key={i} style={{ fontSize: '16pt', margin: '8px 0' }}>{i + 1}. <FormattedText text={a} /></p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}