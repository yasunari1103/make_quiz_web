import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "../lib/supabase";

// 💡 type キーワードを追加して ts(1484) エラーを解消
import type { RankingEntry, ModeType } from '../types/ranking';

export const RankingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // BattlePageから送られてきたデータ（100%正解時）
  const state = location.state as {
    timeSeconds?: number;
    correctCount?: number;
    level?: string;
    currentType: ModeType;
  } | null;

  // 選択中の問題数と難易度（初期値はBattlePageからの引き継ぎ、なければデフォルト）
  const [selectedNumber, setSelectedNumber] = useState<number>(state?.correctCount || 10);
  const [selectedLevel, setSelectedLevel] = useState<string>(state?.level || '1');
  const [selectedType, setSelectedType] = useState<ModeType>(state?.currentType || 'PRIME');
  const [playerName, setPlayerName] = useState<string>('');
  
  // ランキング一覧（型を RankingEntry[] に指定）
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false); // 登録ボタンの押下判定

  // データ取得（ローカルストレージになければモックデータを初期セット）
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ranking-time")
        .select("*")
        .eq('number', selectedNumber)
        .eq('level', Number(selectedLevel))
        .eq('currentType', selectedType)
        .order('timeSeconds', { ascending: true }) // タイムの早い順（昇順）

        if (error) {
          console.error("データ取得エラー",error);
        } else {
          setRankings(data || []);
        }
        setLoading(false);
      };

      fetchRankings();
  }, [selectedNumber, selectedLevel, selectedType]);

  // 💡 Supabase への新規登録処理
  const handleRegister = async () => {
    if (!playerName.trim() || !state?.timeSeconds) return;

    const newEntry = {
      name: playerName,
      timeSeconds: state.timeSeconds,
      number: selectedNumber,
      level: Number(selectedLevel),
      currentType: state?.currentType || selectedType,
      // createdAt は Supabase 側の default (now()) で自動設定される場合は省略可
    };

    const { error } = await supabase
      .from('ranking-time')
      .insert([newEntry]);

    if (error) {
      console.error('登録エラー:', error);
      alert('登録に失敗しました');
    } else {
      alert('ランキングに登録しました！');
      setIsRegistered(true);
      setPlayerName('');
      
      // 再取得して画面を更新
      const { data } = await supabase
        .from('ranking-time')
        .select('*')
        .eq('number', selectedNumber)
        .eq('level', Number(selectedLevel))
        .eq('currentType', selectedType)
        .order('timeSeconds', { ascending: true });
      if (data) setRankings(data);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🏆 ランキング</h1>

      {/* 100%達成直後の場合の登録フォーム */}
      {state?.timeSeconds && (
        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>🎉 記録登録 ({selectedNumber}問 / 難易度{selectedLevel})</h3>
          <p>タイム: {state.timeSeconds} 秒</p>
          <input
            type="text"
            placeholder="名前を入力"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <button
            onClick={handleRegister}
            disabled={isRegistered} // 💡 isRegistered が true のときに無効化！
          >
            {isRegistered ? '登録済み' : '登録する'}
          </button>
        </div>
      )}

      {/* 25通りの部門切り替え */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>
          <label style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>問題数: </label>
          <select value={selectedNumber} onChange={(e) => setSelectedNumber(Number(e.target.value))}>
            {[10, 20, 30, 40, 50].map((num) => (
              <option key={num} value={num}>{num}問</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>
          <label style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>難易度: </label>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            {['1', '2', '3', '4', '5'].map((lvl) => (
              <option key={lvl} value={lvl}>Lv.{lvl}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>
          <label style={{ display: 'flex', flexWrap: 'wrap', width: "20vw", alignItems: 'center' }}>mode: </label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ModeType)}>
            {["PRIME","FACTOR","GCD"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

{/* ランキング一覧表示 */}
      <h2>{selectedNumber}問 / 難易度{selectedLevel} / mode: {selectedType} のランキング</h2>
      
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ol>
          {rankings.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.name}</strong> - {formatTime(entry.timeSeconds)} ({new Date(entry.created_at).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })})
            </li>
          ))}
        </ol>
      )}
      {!loading && rankings.length === 0 && <p>まだ記録がありません。</p>}

      <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
        TOPに戻る
      </button>
    </div>
  );
};