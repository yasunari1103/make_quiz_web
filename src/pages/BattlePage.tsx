import React, { useState, useEffect } from 'react';
import {
  makeQuizGCD,
  makeQuizPrimeFactorization,
  makeQuizFactorization,
} from '../utils/quizUtils';
import '../App.css';
import { FormattedText } from '../components/FormattedText';
import { useNavigate } from 'react-router-dom'

type QuizType = 'GCD' | 'PRIME' | 'FACTOR' | 'QUADRATIC';

export const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [number, setNumber] = useState<string>('10');
  const [level, setLevel] = useState<string>('2');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 💡 現在のクイズの種類を保持
  const [currentType, setCurrentType] = useState<QuizType | null>(null);

  // 💡 ユーザーの入力値を管理するState（1問につき最大2個の入力欄に対応）
  const [userInputs, setUserInputs] = useState<{ val1: string; val2: string }[]>([]);

  // 💡 タイマー関連のState
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

// タイマーのカウントアップ処理
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>; // 👈 ここを修正
    if (isTimerRunning) {
      timer = setInterval(() => {
        // カウントアップ処理など
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // 時間のフォーマット (例: 02:05)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 難易度変更用ハンドラー
  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLevel(e.target.value);
  };

  const handleGenerate = (type: QuizType) => {
    try {
      const num = parseInt(number, 10);
      const lvl = parseInt(level, 10);

      if (isNaN(num) || isNaN(lvl)) {
        setErrorMessage('数字を正しく入力してください');
        return;
      }

      let result = { questions: [] as string[], answers: [] as string[] };

      if (type === 'GCD') result = makeQuizGCD(num, lvl);
      else if (type === 'PRIME') result = makeQuizPrimeFactorization(num, lvl);
      else if (type === 'FACTOR') result = makeQuizFactorization(num, lvl);

      setQuestions(result.questions);
      setAnswers(result.answers);
      setCurrentType(type);
      
      // 解答入力欄の初期化
      setUserInputs(Array(result.questions.length).fill({ val1: '', val2: '' }));
      setErrorMessage('');

      // タイマーリセット＆スタート
      setSeconds(0);
      setIsTimerRunning(true);
    } catch (err: any) {
      setErrorMessage(err.message);
      setQuestions([]);
      setAnswers([]);
      setIsTimerRunning(false);
    }
  };

  // 入力値変更用ハンドラー
  const handleInputChange = (index: number, field: 'val1' | 'val2', value: string) => {
    setUserInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = { ...newInputs[index], [field]: value };
      return newInputs;
    });
  };

  // 秒数の停止処理（必要に応じて呼び出し）
  const handleFinish = () => {
    setIsTimerRunning(false);
    
    navigate('/result', {
        state: {
            questions,
            answers,
            userInputs,
            currentType,
            timeSeconds: seconds,
        },
    })
  };

  return (
    <div className="App" style={{ padding: '20px', position: 'relative' }}>
      {/* ⏱️ 右上固定タイマー */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
        }}
      >
        ⏱️ {formatTime(seconds)}
      </div>

      <h1>速度対戦！計算問題</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <div>
        {/* 問題数選択 */}
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>問題数 (10~50)</p>
          {[10, 20, 30, 40, 50].map((num) => (
            <label key={`num-${num}`} style={{ marginRight: '10px' }}>
              <input
                type="radio"
                name="number"
                value={num}
                checked={number === String(num)}
                onChange={(e) => setNumber(e.target.value)}
              />{' '}
              {num}
            </label>
          ))}
        </div>

        <br />

        {/* 難易度選択 */}
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>難易度 (1~5)</p>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <label key={`lvl-${lvl}`} style={{ marginRight: '10px' }}>
              <input
                type="radio"
                name="difficulty"
                value={lvl}
                checked={level === String(lvl)}
                onChange={handleLevelChange}
              />{' '}
              {lvl}
            </label>
          ))}
        </div>

        <br />
      </div>

      {/* 問題生成ボタン */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <button onClick={() => handleGenerate('GCD')}>最大公約数</button>
        <button onClick={() => handleGenerate('PRIME')}>素因数分解</button>
        <button onClick={() => handleGenerate('FACTOR')}>因数分解</button>
      </div>

      {/* 問題・解答フォーム表示エリア */}
      {questions.length > 0 && (
        <div id="battle-output" style={{ marginTop: '20px' }}>
          <section id="outputQuestion">
            <h2>問題一覧</h2>
            {questions.map((question, index) => (
              <div
                className='question-item'
                key={`question-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '12px',
                  fontSize: '18px',
                }}
              >
                <div className='question-text'>
                  <span style={{ flexGrow: 1 }}><FormattedText text={question} /></span>
                </div>
                {/* 💡 問題タイプに応じた入力フォームの分岐 */}
                <div className="userForm" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {currentType === 'PRIME' ? (
                    /* 1. 素因数分解用：単一の入力欄 */
                    <input
                      type="text"
                      placeholder="例: 2^2 * 3"
                      value={userInputs[index]?.val1 || ''}
                      onChange={(e) => handleInputChange(index, 'val1', e.target.value)}
                      style={{ padding: '6px', fontSize: '16px', width: '150px' }}
                    />
                  ) : (
                    /* 2. GCD / 因数分解 / 2次方程式用：2つの入力欄 */
                    <>
                      <input
                        type="text"
                        placeholder="解1"
                        value={userInputs[index]?.val1 || ''}
                        onChange={(e) => handleInputChange(index, 'val1', e.target.value)}
                        style={{ padding: '6px', fontSize: '16px', width: '80px' }}
                      />
                      <span>,</span>
                      <input
                        type="text"
                        placeholder="解2"
                        value={userInputs[index]?.val2 || ''}
                        onChange={(e) => handleInputChange(index, 'val2', e.target.value)}
                        style={{ padding: '6px', fontSize: '16px', width: '80px' }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={handleFinish}
              style={{
                marginTop: '20px',
                padding: '10px 30px',
                fontSize: '18px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              解答を提出して終了
            </button>
          </section>
        </div>
      )}
    </div>
  );
};