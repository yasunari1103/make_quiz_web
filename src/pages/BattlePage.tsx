import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeQuizGCD,
  makeQuizPrimeFactorization,
  makeQuizFactorization,
} from '../utils/quizUtils';
import '../App.css';
import { FormattedText } from '../components/FormattedText';
import { MathKeyboard } from '../components/MathKeyboard';
import { judgeAnswer } from "../utils/judge";

type QuizType = 'GCD' | 'PRIME' | 'FACTOR';
type BattleFormat = 'TIME' | 'SCORE';
type Field = 'val1' | 'val2';
type Input = { val1: string; val2: string };
type HistoryItem = { question: string; answer: string; user: Input; misses: number };
const EMPTY_INPUT: Input = { val1: '', val2: '' };

export const BattlePage: React.FC = () => {
  const navigate = useNavigate();

  // ===== 共通設定 =====
  const [number, setNumber] = useState<string>('10'); // タイム形式の問題数
  const [level, setLevel] = useState<string>('1');
  const [timeLimit, setTimeLimit] = useState<number>(60); // スコア形式の制限時間(秒)
  const [format, setFormat] = useState<BattleFormat | null>(null);
  const [currentType, setCurrentType] = useState<QuizType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ===== 入力・キーボード =====
  const [userInputs, setUserInputs] = useState<Input[]>([]);
  const [activeInput, setActiveInput] = useState<{ index: number; field: Field } | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(true);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // ===== タイム形式 =====
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // ===== スコア形式 =====
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [remaining, setRemaining] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [misses, setMisses] = useState<number>(0);

  // ------------------------------------------------------------
  // 入力まわり
  // ------------------------------------------------------------
  const handleInputChange = (index: number, field: Field, value: string) => {
    setUserInputs((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] ?? EMPTY_INPUT), [field]: value };
      return next;
    });
  };

  const handleInputFocus = (index: number, field: Field) => {
    setActiveInput({ index, field });
    setIsKeyboardOpen(true);
    const key = `${index}-${field}`;
    setTimeout(() => {
      inputRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleInsert = (char: string) => {
    if (!activeInput) return;
    const { index, field } = activeInput;
    const inputEl = inputRefs.current[`${index}-${field}`];
    const currentVal = userInputs[index]?.[field] || '';

    if (inputEl) {
      const start = inputEl.selectionStart ?? currentVal.length;
      const end = inputEl.selectionEnd ?? currentVal.length;
      handleInputChange(index, field, currentVal.substring(0, start) + char + currentVal.substring(end));
      setTimeout(() => {
        inputEl.focus();
        inputEl.setSelectionRange(start + char.length, start + char.length);
      }, 0);
    } else {
      handleInputChange(index, field, currentVal + char);
    }
  };

  const handleDelete = () => {
    if (!activeInput) return;
    const { index, field } = activeInput;
    const inputEl = inputRefs.current[`${index}-${field}`];
    const currentVal = userInputs[index]?.[field] || '';
    if (!currentVal) return;

    const start = inputEl?.selectionStart ?? currentVal.length;
    const end = inputEl?.selectionEnd ?? currentVal.length;

    let newVal: string;
    let newCursorPos: number;
    if (start !== end) {
      newVal = currentVal.substring(0, start) + currentVal.substring(end);
      newCursorPos = start;
    } else if (start > 0) {
      newVal = currentVal.substring(0, start - 1) + currentVal.substring(start);
      newCursorPos = start - 1;
    } else {
      return;
    }

    handleInputChange(index, field, newVal);
    if (inputEl) {
      setTimeout(() => {
        inputEl.focus();
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleClear = () => {
    if (!activeInput) return;
    handleInputChange(activeInput.index, activeInput.field, '');
  };

  // ------------------------------------------------------------
  // タイマー
  // ------------------------------------------------------------
  // タイム形式: カウントアップ
  useEffect(() => {
    if (!isTimerRunning) return;
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // スコア形式: カウントダウン。0になったら自動で終了
  useEffect(() => {
    if (format !== 'SCORE' || !isPlaying) return;
    if (remaining <= 0) {
      finishScore();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, isPlaying, remaining]);

  // キーボードの高さ計測（MathKeyboard 側の onHeightChange で更新される）
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ------------------------------------------------------------
  // 形式の切り替え（状態を全部リセット）
  // ------------------------------------------------------------
  const selectFormat = (f: BattleFormat) => {
    setFormat(f);
    setIsTimerRunning(false);
    setIsPlaying(false);
    setQuestions([]);
    setAnswers([]);
    setUserInputs([]);
    setCurrentQuestion(null);
    setCurrentType(null);
    setScore(0);
    setCurrentIndex(0);
    setHistory([]);
    setSeconds(0);
    setErrorMessage('');
  };

  // ------------------------------------------------------------
  // タイム形式
  // ------------------------------------------------------------
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
      setUserInputs(result.questions.map(() => ({ ...EMPTY_INPUT })));
      setErrorMessage('');
      setSeconds(0);
      setIsTimerRunning(true);
    } catch (err: any) {
      setErrorMessage(err.message);
      setQuestions([]);
      setAnswers([]);
      setIsTimerRunning(false);
    }
  };

  const handleFinish = () => {
    setIsTimerRunning(false);
    navigate('/result', {
      state: {
        mode: 'TIME',
        questions,
        answers,
        userInputs,
        currentType,
        timeSeconds: seconds,
        level,
        format: 'TIME',
      },
    });
  };

  // ------------------------------------------------------------
  // スコア形式
  // ------------------------------------------------------------
  const nextQuestion = (type: QuizType) => {
    const lvl = parseInt(level, 10);
    // ※ handleGenerate と同じ引数順 (問題数, 難易度)
    const q =
      type === 'PRIME'
        ? makeQuizPrimeFactorization(1, lvl)
        : type === 'FACTOR'
        ? makeQuizFactorization(1, lvl)
        : makeQuizGCD(1, lvl);

    setCurrentQuestion(q.questions[0]);
    setCurrentAnswer(String(q.answers[0]));
    setUserInputs([{ ...EMPTY_INPUT }]);
    setActiveInput({ index: 0, field: 'val1' });
  };

  const startScore = (type: QuizType) => {
    if (isNaN(parseInt(level, 10))) {
      setErrorMessage('難易度を選んでください');
      return;
    }
    setErrorMessage('');
    setCurrentType(type);
    setScore(0);
    setCurrentIndex(0);
    setHistory([]);
    setRemaining(timeLimit);
    setIsPlaying(true);
    nextQuestion(type);
  };

  const handleSubmitAnswer = () => {
    if (!isPlaying || !currentQuestion || !currentType) return;
    const user = userInputs[0] ?? EMPTY_INPUT;
    const correct = judgeAnswer(currentType, user, currentAnswer);

    if (correct) {
      // 正解 → 記録して次の問題へ
      setScore((s) => s + Math.abs(parseInt(userInputs[0].val1)) + Math.abs(parseInt(userInputs[0].val2)));
      setHistory((h) => [...h, { question: currentQuestion, answer: currentAnswer, user, misses }]);
      setCurrentIndex((i) => i + 1);
      nextQuestion(currentType); // misses も 0 に戻る
    } else {
      // 不正解 → 同じ問題のまま、入力欄だけクリアして再挑戦
      setMisses((m) => m + 1);
      setUserInputs([{ ...EMPTY_INPUT }]);
      setActiveInput({ index: 0, field: 'val1' });
      setTimeout(() => inputRefs.current['0-val1']?.focus(), 0);
    }
  };

  const finishScore = () => {
    setIsPlaying(false);
    navigate('/result', {
      state: {
        mode: 'SCORE',
        questions: history.map((h) => h.question),
        answers: history.map((h) => h.answer),
        userInputs: history.map((h) => h.user),
        misses: history.map((h) => h.misses), // 各問の不正解回数
        currentType,
        score,
        timeSeconds: timeLimit,
        level,
        format: 'SCORE',
      },
    });
  };

  // ------------------------------------------------------------
  // 描画ヘルパー
  // ------------------------------------------------------------
  const setRef = (index: number, field: Field) => (el: HTMLInputElement | null) => {
    inputRefs.current[`${index}-${field}`] = el;
  };

  const renderInputs = (index: number) => {
    const val = userInputs[index] ?? EMPTY_INPUT;

    if (currentType === 'FACTOR') {
      return (
        <>
          (x
          <input
            ref={setRef(index, 'val1')}
            type="text"
            inputMode="none"
            placeholder="解1"
            value={val.val1}
            onFocus={() => handleInputFocus(index, 'val1')}
            onClick={() => handleInputFocus(index, 'val1')}
            onChange={(e) => handleInputChange(index, 'val1', e.target.value)}
            style={{ padding: '6px', fontSize: '16px', width: '80px' }}
          />
          <span>)(x</span>
          <input
            ref={setRef(index, 'val2')}
            type="text"
            inputMode="none"
            placeholder="解2"
            value={val.val2}
            onFocus={() => handleInputFocus(index, 'val2')}
            onClick={() => handleInputFocus(index, 'val2')}
            onChange={(e) => handleInputChange(index, 'val2', e.target.value)}
            style={{ padding: '6px', fontSize: '16px', width: '80px' }}
          />
          )
        </>
      );
    }

    return (
      <input
        ref={setRef(index, 'val1')}
        type="text"
        inputMode="none"
        placeholder={currentType === 'PRIME' ? '例: 2^2*3' : '例: 12'}
        value={val.val1}
        onFocus={() => handleInputFocus(index, 'val1')}
        onClick={() => handleInputFocus(index, 'val1')}
        onChange={(e) => handleInputChange(index, 'val1', e.target.value)}
        style={{ padding: '6px', fontSize: '16px', width: '150px' }}
      />
    );
  };

  const badgeStyle: React.CSSProperties = {
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
  };

  const radioRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' };

  // ------------------------------------------------------------
  // 描画
  // ------------------------------------------------------------
  return (
    <div className="App" style={{ padding: '20px', position: 'relative' }}>
      {/* 右上固定の表示 */}
      {format === 'TIME' && <div style={badgeStyle}>経過時間： {formatTime(seconds)}</div>}
      {format === 'SCORE' && isPlaying && (
        <div style={badgeStyle}>
          スコア： {score}　残り： {remaining}秒
        </div>
      )}

      {/* キーボード再表示ボタン */}
      {!isKeyboardOpen && (
        <button
          onClick={() => setIsKeyboardOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            zIndex: 999,
            cursor: 'pointer',
          }}
        >
          ⌨️ キーボード表示
        </button>
      )}

      <h1>速度対戦！計算問題</h1>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {/* 形式の選択 */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #334155',
          paddingBottom: '8px',
        }}
      >
        <button className="battle-format" onClick={() => selectFormat('TIME')}>タイム形式</button>
        <button className="battle-format" onClick={() => selectFormat('SCORE')}>スコア形式</button>
      </div>

      {/* 設定（形式を選んだら表示。プレイ中のスコア形式は隠す） */}
      {format !== null && !(format === 'SCORE' && isPlaying) && (
      <div>
        <div>
          {format === 'TIME' ? (
            <div>
              <p>問題数</p>
              <div style={radioRow}>
                {[10, 20, 30, 40, 50].map((n) => (
                  <label key={`num-${n}`} style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="number"
                      value={n}
                      checked={number === String(n)}
                      onChange={(e) => setNumber(e.target.value)}
                      style={{ marginRight: '4px' }}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p>制限時間</p>
              <div style={radioRow}>
                {[30, 60, 120, 180].map((t) => (
                  <label key={`tl-${t}`} style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="timeLimit"
                      checked={timeLimit === t}
                      onChange={() => setTimeLimit(t)}
                      style={{ marginRight: '4px' }}
                    />
                    {t}秒
                  </label>
                ))}
              </div>
            </div>
          )}

          <br />

          <div>
            <p>難易度 (1~5)</p>
            <div style={radioRow}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <label key={`lvl-${lvl}`} style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={lvl}
                    checked={level === String(lvl)}
                    onChange={(e) => setLevel(e.target.value)}
                    style={{ marginRight: '4px' }}
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* 出題ジャンル = スタートボタン */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
            {(
              [
                ['GCD', '最大公約数'],
                ['PRIME', '素因数分解'],
                ['FACTOR', '因数分解'],
              ] as [QuizType, string][]
            ).map(([type, label]) => (
              <button
                key={type}
                className="make-quiz-type"
                onClick={() => (format === 'SCORE' ? startScore(type) : handleGenerate(type))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ===== タイム形式: 問題一覧 ===== */}
      {format === 'TIME' && questions.length > 0 && (
        <div id="battle-output" style={{ marginTop: '20px' }}>
          <section id="outputQuestion">
            <h2>問題一覧</h2>
            {questions.map((question, index) => (
              <div
                className="question-item"
                key={`question-${index}`}
                style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px', fontSize: '18px' }}
              >
                <div className="question-text">
                  <span style={{ flexGrow: 1 }}>
                    <FormattedText text={question} />
                  </span>
                </div>
                <div className="userForm" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {renderInputs(index)}
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

      {/* ===== スコア形式: 1問ずつ ===== */}
      {format === 'SCORE' && isPlaying && (
        <div id="battle-output" style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            <span>第 {currentIndex + 1} 問</span>
          </div>

          <section id="outputQuestion">
            <h2>問題</h2>
            <div className="question-text" style={{ fontSize: '20px', marginBottom: '10px' }}>
              <FormattedText text={currentQuestion || ''} />
            </div>

            <div
              className="userForm"
              style={{ display: 'flex', gap: '5px', alignItems: 'center' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
            >
              {renderInputs(0)}
              <button
                onClick={handleSubmitAnswer}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                回答
              </button>
            </div>

            <button
              onClick={finishScore}
              style={{ marginTop: '10px', padding: '6px 16px', cursor: 'pointer' }}
            >
              途中で終了
            </button>
          </section>
        </div>
      )}

      {/* 数学キーボード（問題が表示されている間だけ） */}
      {((format === 'TIME' && questions.length > 0) || (format === 'SCORE' && isPlaying)) && (
        <MathKeyboard
          isOpen={isKeyboardOpen}
          onToggle={() => setIsKeyboardOpen((prev) => !prev)}
          onInsert={handleInsert}
          onDelete={handleDelete}
          onClear={handleClear}
          onHeightChange={setKeyboardHeight}
        />
      )}

      {/* キーボードに隠れないための余白 */}
      <div style={{ paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px' }} />
    </div>
  );
};