/* ResultPage.tsx */

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FormattedText } from '../components/FormattedText';
import { judgeAnswer, formatUserAnswer } from '../utils/judge';

interface ResultState {
  questions: string[];
  answers: string[];
  userInputs: { val1: string; val2: string }[];
  currentType: 'GCD' | 'PRIME' | 'FACTOR';
  timeSeconds: number;
  level: string;
  format: 'TIME' | 'SCORE';
  score: number;
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

  const { questions, answers, userInputs, currentType, timeSeconds, level, format, score } = state;

  // 時間のフォーマット (例: 02:05)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 正解数のカウント
  let correctCount = 0;
  questions.forEach((_, index) => {
    if (judgeAnswer(currentType, userInputs[index], answers[index])) {
      correctCount++;
    }
  });

  const accuracy = Math.round((correctCount / questions.length) * 100);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎉 対戦結果</h1>
      <h2>mode: {currentType}</h2>

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
        <div style={{border: "1px solid #3b82f6", margin:"0"}}>
          <h3 style={{margin:"0"}}>クリアタイム</h3>
          <p style={{ fontSize: '25px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>{formatTime(timeSeconds)}</p>
        </div>
        {format === 'SCORE' && (
          <div style={{border: "1px solid #3b82f6", margin:"0"}}>
            <h3 style={{margin:"0"}}>スコア</h3>
            <p style={{ fontSize: '25px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>{score}</p>
          </div>
        )}
        <div style={{border: "1px solid #3b82f6", margin:"0"}}>
          <h3 style={{margin:"0"}}>正解数</h3>
          <p style={{ fontSize: '25px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
            {correctCount} / {questions.length}
          </p>
        </div>
        <div style={{border: "1px solid #3b82f6", margin:"0"}}>
          <h3 style={{margin:"0"}}>正解率</h3>
          <p style={{ fontSize: '25px', fontWeight: 'bold', color: '#ffc107', margin: 0 }}>
            {accuracy}%
          </p>
        </div>
      </div>

      {/* 答え合わせ詳細 */}
      <h2>答え合わせ一覧</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {questions.map((question, index) => {
          const isCorrect = judgeAnswer(currentType, userInputs[index], answers[index]);
          const userAnswerStr = formatUserAnswer(currentType, userInputs[index]);

          return (
            <div
              key={`result-${index}`}
              style={{
                border: `2px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
                backgroundColor: '#00043d',
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
                  <strong>あなたの解答:</strong> {userAnswerStr || '未入力'}
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
        {(accuracy === 100) && (format === 'TIME') && (
          <button 
            onClick={() => navigate("/ranking", {
              state: {
                timeSeconds,
                correctCount,
                level,
                currentType,
                },
              }
            )}
          >
            rankingに登録
          </button>
      )}
      </div>
    </div>
  );
};