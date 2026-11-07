import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { RankingEntry, PeriodType, ModeType } from '../types/ranking';

type Format = 'TIME' | 'SCORE';

// ranking-score テーブルの1行（types/ranking.ts に移してもOK）
// number = 制限時間(秒), score = スコア
type ScoreEntry = {
  id: number;
  name: string;
  number: number;
  score: number;
  level: number;
  currentType: ModeType;
  created_at: string;
};

// スコア形式の制限時間の選択肢（BattlePage の選択肢と揃えること。共通ファイルに切り出すのがおすすめ）
const SCORE_TIME_LIMITS = [60, 120, 180, 300];
const TIME_QUESTION_COUNTS = [10, 20, 30, 40, 50];

// --- 日時計算用ヘルパー関数 ---
const getPeriodStartDate = (period: PeriodType): string | null => {
  const now = new Date();

  if (period === 'TODAY') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return today.toISOString();
  }

  if (period === 'WEEK') {
    // 月曜日を週の始まりとする計算
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  if (period === 'MONTH') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return firstDay.toISOString();
  }

  return null; // 'ALL' の場合は null
};

export const RankingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    format?: Format;
    score?: number;
    timeLimit?: number; // スコア形式の制限時間(秒)
    timeSeconds?: number;
    correctCount?: number;
    level?: string;
    currentType?: ModeType;
    runId?: string;
  } | null;

  // 今回の記録（登録できる記録がなければ null）
  const entryFormat: Format | null =
    state?.format === 'SCORE' && state.score ? 'SCORE' : state?.format !== 'SCORE' && state?.timeSeconds ? 'TIME' : null;

  // 登録に使う値は「画面のフィルター」ではなく、遷移時に渡された値
  const entryLevel = Number(state?.level || '1');
  const entryNumber = state?.correctCount || 10; // タイム形式の問題数
  const entryTimeLimit = state?.timeLimit || 60; // スコア形式の制限時間

  // フィルター状態
  const [selectedFormat, setSelectedFormat] = useState<Format>(entryFormat ?? 'TIME');
  const [selectedNumber, setSelectedNumber] = useState<number>(entryNumber); // 問題数（TIME用）
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(entryTimeLimit); // 秒数（SCORE用）
  const [selectedLevel, setSelectedLevel] = useState<string>(state?.level || '1');
  const [selectedType, setSelectedType] = useState<ModeType>(state?.currentType || 'PRIME');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');

  const entryType: ModeType = state?.currentType || selectedType;

  // 登録用状態
  const [playerName, setPlayerName] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  // ランキングデータ状態
  const [timeRankings, setTimeRankings] = useState<RankingEntry[]>([]);
  const [scoreRankings, setScoreRankings] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0); // 登録後の再取得用

  // 💡 データ取得処理（フィルター変更・登録後に自動実行）
  useEffect(() => {
    let cancelled = false;

    const fetchRankings = async () => {
      setLoading(true);
      const startDate = getPeriodStartDate(selectedPeriod);

      if (selectedFormat === 'TIME') {
        let query = supabase
          .from('ranking-time')
          .select('*')
          .eq('number', selectedNumber)
          .eq('level', Number(selectedLevel))
          .eq('currentType', selectedType)
          .order('timeSeconds', { ascending: true })
          .limit(100);
        if (startDate) query = query.gte('created_at', startDate);

        const { data, error } = await query;
        if (cancelled) return;
        if (error) console.error('データ取得エラー:', error);
        else setTimeRankings(data || []);
      } else {
        let query = supabase
          .from('ranking-score')
          .select('*')
          .eq('second', selectedTimeLimit)
          .eq('level', Number(selectedLevel))
          .eq('currentType', selectedType)
          .order('score', { ascending: false }) // スコアは高い順
          .order('created_at', { ascending: true }) // 同点は先に達成した人が上
          .limit(100);
        if (startDate) query = query.gte('created_at', startDate);

        const { data, error } = await query;
        if (cancelled) return;
        if (error) console.error('データ取得エラー:', error);
        else setScoreRankings((data as ScoreEntry[]) || []);
      }
      setLoading(false);
    };

    fetchRankings();
    return () => {
      cancelled = true;
    };
  }, [selectedFormat, selectedNumber, selectedTimeLimit, selectedLevel, selectedType, selectedPeriod, refreshKey]);

  // 新規登録処理
  const handleRegister = async () => {
    if (!playerName.trim() || !entryFormat || sending || isRegistered) return;
    setSending(true);

    const common = {
      name: playerName.trim(),
      level: entryLevel,
      currentType: entryType,
      run_id: state?.runId,
    };

    const { error } =
      entryFormat === 'SCORE'
        ? await supabase
            .from('ranking-score')
            .insert([{ ...common, second: entryTimeLimit, score: state!.score }])
        : await supabase
            .from('ranking-time')
            .insert([{ ...common, number: entryNumber, timeSeconds: state!.timeSeconds }]);

    setSending(false);

    if (error) {
      if (error.code === '23505') {
        setIsRegistered(true);
        alert('この記録はすでに登録されています');
        return;
      }
      console.error('登録エラー:', error);
      alert('登録に失敗しました');
      return;
    }

    alert('ランキングに登録しました！');
    setIsRegistered(true);
    setPlayerName('');

    // 登録した記録が見える表示に切り替えて再取得
    setSelectedFormat(entryFormat);
    setSelectedLevel(String(entryLevel));
    setSelectedType(entryType);
    if (entryFormat === 'SCORE') setSelectedTimeLimit(entryTimeLimit);
    else setSelectedNumber(entryNumber);
    setRefreshKey((k) => k + 1);

    navigate(location.pathname, { replace: true, state: null }); // 登録後に state をクリアして再登録を防ぐ
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const medal = (index: number) => (index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '');

  // 期間タブの定義
  const periodTabs: { label: string; value: PeriodType }[] = [
    { label: '全期間', value: 'ALL' },
    { label: '月間', value: 'MONTH' },
    { label: '週間', value: 'WEEK' },
    { label: '今日', value: 'TODAY' },
  ];

  const rankingCount = selectedFormat === 'TIME' ? timeRankings.length : scoreRankings.length;

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
      <h1>🏆 ランキング</h1>

      {isRegistered && <p>✅ ランキングに登録しました</p>}

      {/* 記録登録フォーム */}
      {entryFormat && !isRegistered && (
        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {entryFormat === 'SCORE' ? (
            <>
              <h3>
                🎉 スコア登録 ({entryTimeLimit}秒 / Lv.{entryLevel} / mode: {entryType})
              </h3>
              <p>スコア: {state!.score}点</p>
            </>
          ) : (
            <>
              <h3>
                🎉 記録登録 ({entryNumber}問 / Lv.{entryLevel} / mode: {entryType})
              </h3>
              <p>タイム: {formatTime(state!.timeSeconds!)}</p>
            </>
          )}
          <input
            type="text"
            placeholder="名前を入力"
            value={playerName}
            maxLength={20}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <button onClick={handleRegister} disabled={sending || !playerName.trim()}>
            {sending ? '登録中...' : '登録する'}
          </button>
        </div>
      )}

      {/* 条件切り替え（形式・難易度・モード・問題数/秒数） */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div>
          <label>問題形式: </label>
          <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value as Format)}>
            <option value="SCORE">SCORE</option>
            <option value="TIME">TIME</option>
          </select>
        </div>

        <div>
          <label>難易度: </label>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            {['1', '2', '3', '4', '5'].map((lvl) => (
              <option key={lvl} value={lvl}>
                Lv.{lvl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>mode: </label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ModeType)}>
            {['PRIME', 'FACTOR', 'GCD'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {selectedFormat === 'TIME' ? (
          <div>
            <label>問題数: </label>
            <select value={selectedNumber} onChange={(e) => setSelectedNumber(Number(e.target.value))}>
              {TIME_QUESTION_COUNTS.map((num) => (
                <option key={num} value={num}>
                  {num}問
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label>秒数: </label>
            <select value={selectedTimeLimit} onChange={(e) => setSelectedTimeLimit(Number(e.target.value))}>
              {SCORE_TIME_LIMITS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}秒
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 💡 期間選択タブ UI */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #334155',
          paddingBottom: '8px',
        }}
      >
        {periodTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedPeriod(tab.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: selectedPeriod === tab.value ? 'bold' : 'normal',
              background: selectedPeriod === tab.value ? '#3b82f6' : '#1e293b',
              color: selectedPeriod === tab.value ? '#ffffff' : '#94a3b8',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ランキング表示部分 */}
      <h2>
        {periodTabs.find((t) => t.value === selectedPeriod)?.label}ランキング (
        {selectedFormat === 'SCORE' ? `${selectedTimeLimit}秒` : `${selectedNumber}問`} / Lv.{selectedLevel} / mode:{' '}
        {selectedType})
      </h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ol style={{ paddingLeft: '20px' }}>
          {selectedFormat === 'TIME'
            ? timeRankings.map((entry, index) => (
                <li key={entry.id} style={{ margin: '8px 0' }}>
                  {medal(index)}
                  <strong>{entry.name}</strong> - {formatTime(entry.timeSeconds)}{' '}
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                    ({new Date(entry.created_at).toLocaleDateString('ja-JP')})
                  </span>
                </li>
              ))
            : scoreRankings.map((entry, index) => (
                <li key={entry.id} style={{ margin: '8px 0' }}>
                  {medal(index)}
                  <strong>{entry.name}</strong> - {entry.score}点{' '}
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                    ({new Date(entry.created_at).toLocaleDateString('ja-JP')})
                  </span>
                </li>
              ))}
        </ol>
      )}

      {!loading && rankingCount === 0 && <p style={{ color: '#94a3b8' }}>この期間の記録はまだありません。</p>}

      <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
        TOPに戻る
      </button>
      <button onClick={() => navigate('/battle')} style={{ marginTop: '20px' }}>
        もう一度対戦する
      </button>
    </div>
  );
};