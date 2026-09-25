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

  // 単純な正誤判定（ホワイトスペースを無視して比較）
  // 💡 指定された2パターン（`^` 表記と上付き文字表記）のみを受け入れる正規化関数
const checkAnswer = (userAnsStr: string, correctAnsStr: string) => {
    if (!userAnsStr || !correctAnsStr) return false;

    // 💡 HTMLタグ（<sup>3</sup> など）や特殊文字を変換・正規化する処理
    const normalize = (str: string) =>
        str
        // 1. <sup>数字</sup> を '^数字' に置換 (例: <sup>3</sup> -> ^3)
        .replace(/<sup[^>]*>(.*?)<\/sup>/gi, '^$1')
        // 2. その他のHTMLタグ（もしあれば）を全て除去
        .replace(/<[^>]+>/g, '')
        // 3. 掛け算記号（× や ・）を半角アスタリスク '*' に統一
        .replace(/[×・]/g, '*')
        // 4. 小さい上付き文字（³ ²）も '^数字' に統一
        .replace(/¹/g, '^1')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁴/g, '^4')
        .replace(/⁵/g, '^5')
        .replace(/⁶/g, '^6')
        .replace(/⁷/g, '^7')
        .replace(/⁸/g, '^8')
        .replace(/⁹/g, '^9')
        .replace(/⁰/g, '^0')
        // 5. 空白（スペース）を削除
        .replace(/\s+/g, '');

    // ユーザーの入力値と、タグ除去・正規化した正解データを比較
    return normalize(userAnsStr) === normalize(correctAnsStr);
    };

  // 正解数のカウント
  let correctCount = 0;
  questions.forEach((_, index) => {
    const userAns = formatUserAnswer(userInputs[index]);
    if (checkAnswer(userAns, answers[index])) {
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
          const isCorrect = checkAnswer(userAnswerStr, answers[index]);

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