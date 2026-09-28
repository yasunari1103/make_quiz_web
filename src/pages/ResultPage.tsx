import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FormattedText } from '../components/FormattedText';

interface ResultState {
  questions: string[];
  answers: string[];
  userInputs: { val1: string; val2: string }[];
  currentType: 'GCD' | 'PRIME' | 'FACTOR' | 'QUADRATIC';
  timeSeconds: number;
}

// ユーザーの入力文字列（例: "3 * 2^2" や "2*2*3"）を素数の配列 [2, 2, 3] に変換する
export const parsePrimeFactors = (input: string): number[] => {
  if (!input || !input.trim()) return [];

  // 表記揺れを統一（全角×や*、スペース除去）
  const normalized = input
    .replace(/×/g, '*')
    .replace(/\s+/g, '');

  // '*' で分割して各項を処理
  const terms = normalized.split('*');
  const factors: number[] = [];

  for (const term of terms) {
    if (!term) continue;

    if (term.includes('^')) {
      // 累乗形式 (例: "2^3")
      const [baseStr, expStr] = term.split('^');
      const base = parseInt(baseStr, 10);
      const exp = parseInt(expStr, 10);

      if (!isNaN(base) && !isNaN(exp) && exp > 0) {
        for (let i = 0; i < exp; i++) {
          factors.push(base);
        }
      }
    } else {
      // 単体数字 (例: "2")
      const num = parseInt(term, 10);
      if (!isNaN(num)) {
        factors.push(num);
      }
    }
  }

  // 昇順にソートして並び順を統一（例: [3, 2, 2] -> [2, 2, 3]）
  return factors.sort((a, b) => a - b);
};

// 数字の配列同士（例: [2, 2, 3] と [2, 2, 3]）が一致するかチェック
export const checkAnswerFactors = (arr1: number[], arr2: number[]): boolean => {
  // 長さが違ったら不一致
  if (arr1.length !== arr2.length) return false;

  // 要素がすべて一致しているか確認（ソートは parsePrimeFactors 側で済んでいる前提）
  return arr1.every((val, idx) => val === arr2[idx]);
};

export const ResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // BattlePage から渡されたデータを受け取る
  const state = location.state as ResultState;

  if (!state) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>結果データがありません</h2>
        <Link to="/battle">対戦モードに戻る</Link>
      </div>
    );
  }

  const { questions, answers, userInputs, currentType, timeSeconds } = state;

  // 時間のフォーマット (例: 02:05)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ユーザーの入力値を文字列にまとめる関数
  const formatUserAnswer = (input: { val1: string; val2: string }) => {
    if (currentType === 'PRIME') {
      return input.val1.trim() || '（無回答）';
    }
    if (!input.val1 && !input.val2) return '（無回答）';
    return `${input.val1.trim()}, ${input.val2.trim()}`;
  };

  // 正解数のカウント
  let correctCount = 0;
  questions.forEach((_, index) => {
    const userAnswerStr = formatUserAnswer(userInputs[index]);
    const userAnswerFactors = parsePrimeFactors(userAnswerStr)
    const correctAnserFactors = parsePrimeFactors(answers[index]);
    const isCorrect = checkAnswerFactors(userAnswerFactors, correctAnserFactors);

    if (isCorrect) {
      correctCount++;
    }
  });

  const accuracy = Math.round((correctCount / questions.length) * 100);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎉 対戦結果</h1>

      {/* スコア・タイム概要 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          backgroundColor: '#00043d',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h3>クリアタイム</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
            ⏱️ {formatTime(timeSeconds)}
          </p>
        </div>
        <div>
          <h3>正解数</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
            {correctCount} / {questions.length} 問
          </p>
        </div>
        <div>
          <h3>正解率</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', margin: 0 }}>
            {accuracy}%
          </p>
        </div>
      </div>

      {/* 答え合わせ詳細 */}
      <h2>答え合わせ一覧</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {questions.map((question, index) => {
            const userAnswerStr = formatUserAnswer(userInputs[index]);
            const userAnswerFactors = parsePrimeFactors(userAnswerStr)
            const correctAnserFactors = parsePrimeFactors(answers[index]);
            const isCorrect = checkAnswerFactors(userAnswerFactors, correctAnserFactors);

          return (
            <div
              key={`result-${index}`}
              style={{
                border: `2px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
                backgroundColor: isCorrect ? '#00043d' : '#00043d',
                borderRadius: '8px',
                padding: '15px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                  {index + 1}問目: <FormattedText text={question} />
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: isCorrect ? '#28a745' : '#dc3545',
                  }}
                >
                  {isCorrect ? '⭕ 正解' : '❌ 不正解'}
                </span>
              </div>

              <div style={{ marginTop: '10px', fontSize: '16px' }}>
                <div>
                  <strong>あなたの解答:</strong> {userAnswerStr}
                </div>
                {!isCorrect && (
                  <div style={{ color: '#dc3545', marginTop: '4px' }}>
                    <strong>正解:</strong> <FormattedText text={answers[index]} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* もう一度遊ぶボタン */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/battle')}
          style={{
            padding: '12px 30px',
            fontSize: '18px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          もう一度対戦する
        </button>
      </div>
    </div>
  );
};