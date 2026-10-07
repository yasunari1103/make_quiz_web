import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { RankingEntry, PeriodType, ModeType } from '../types/ranking';

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
    timeSeconds?: number;
    correctCount?: number;
    level?: string;
    currentType?: ModeType;
  } | null;

  // フィルター状態
  const [selectedNumber, setSelectedNumber] = useState<number>(state?.correctCount || 10);
  const [selectedLevel, setSelectedLevel] = useState<string>(state?.level || '1');
  const [selectedType, setSelectedType] = useState<ModeType>(state?.currentType || 'PRIME');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');

  // 登録用状態
  const [playerName, setPlayerName] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // ランキングデータ状態
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 💡 データ取得処理（フィルター変更時に自動実行）
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);

      let query = supabase
        .from('ranking-time')
        .select('*')
        .eq('number', selectedNumber)
        .eq('level', Number(selectedLevel))
        .eq('currentType', selectedType)
        .order('timeSeconds', { ascending: true })
        .limit(100);

      // 期間フィルターの適用
      const startDate = getPeriodStartDate(selectedPeriod);
      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('データ取得エラー:', error);
      } else {
        setRankings(data || []);
      }
      setLoading(false);
    };

    fetchRankings();
  }, [selectedNumber, selectedLevel, selectedType, selectedPeriod]);

  // 新規登録処理
  const handleRegister = async () => {
    if (!playerName.trim() || !state?.timeSeconds) return;

    const newEntry = {
      name: playerName,
      timeSeconds: state.timeSeconds,
      number: selectedNumber,
      level: Number(selectedLevel),
      currentType: state?.currentType || selectedType,
    };

    const { error } = await supabase.from('ranking-time').insert([newEntry]);

    if (error) {
      console.error('登録エラー:', error);
      alert('登録に失敗しました');
    } else {
      alert('ランキングに登録しました！');
      setIsRegistered(true);
      setPlayerName('');

      // 再取得
      const startDate = getPeriodStartDate(selectedPeriod);
      let query = supabase
        .from('ranking-time')
        .select('*')
        .eq('number', selectedNumber)
        .eq('level', Number(selectedLevel))
        .eq('currentType', selectedType)
        .order('timeSeconds', { ascending: true });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data } = await query;
      if (data) setRankings(data);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 期間タブの定義
  const periodTabs: { label: string; value: PeriodType }[] = [
    { label: '全期間', value: 'ALL' },
    { label: '月間', value: 'MONTH' },
    { label: '週間', value: 'WEEK' },
    { label: '今日', value: 'TODAY' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
      <h1>🏆 ランキング</h1>

      {/* 記録登録フォーム */}
      {state?.timeSeconds && (
        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>🎉 記録登録 ({selectedNumber}問 / Lv.{selectedLevel} / mode: {state.currentType || selectedType})</h3>
          <p>タイム: {formatTime(state.timeSeconds)}</p>
          <input
            type="text"
            placeholder="名前を入力"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
            disabled={isRegistered}
          />
          <button onClick={handleRegister} disabled={isRegistered || !playerName.trim()}>
            {isRegistered ? '登録済み' : '登録する'}
          </button>
        </div>
      )}

      {/* 条件切り替え（問題数・難易度・モード） */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div>
          <label>問題数: </label>
          <select value={selectedNumber} onChange={(e) => setSelectedNumber(Number(e.target.value))}>
            {[10, 20, 30, 40, 50].map((num) => (
              <option key={num} value={num}>{num}問</option>
            ))}
          </select>
        </div>

        <div>
          <label>難易度: </label>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            {['1', '2', '3', '4', '5'].map((lvl) => (
              <option key={lvl} value={lvl}>Lv.{lvl}</option>
            ))}
          </select>
        </div>

        <div>
          <label>mode: </label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ModeType)}>
            {['PRIME', 'FACTOR', 'GCD'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 💡 期間選択タブ UI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #334155', paddingBottom: '8px' }}>
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
        {periodTabs.find((t) => t.value === selectedPeriod)?.label}ランキング ({selectedNumber}問 / Lv.{selectedLevel} / {selectedType})
      </h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ol style={{ paddingLeft: '20px' }}>
          {rankings.map((entry, index) => (
            <li key={entry.id} style={{ margin: '8px 0' }}>
              {index === 0 && '🥇 '}
              {index === 1 && '🥈 '}
              {index === 2 && '🥉 '}
              <strong>{entry.name}</strong> - {formatTime(entry.timeSeconds)}{' '}
              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                ({new Date(entry.created_at).toLocaleDateString('ja-JP')})
              </span>
            </li>
          ))}
        </ol>
      )}

      {!loading && rankings.length === 0 && (
        <p style={{ color: '#94a3b8' }}>この期間の記録はまだありません。</p>
      )}

      <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
        TOPに戻る
      </button>
    </div>
  );
};