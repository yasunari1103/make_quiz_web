// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { MakeQuizPage } from './pages/MakeQuizPage';
import { BattlePage } from './pages/BattlePage';
import { ResultPage } from './pages/ResultPage';

// ホーム画面（ナビゲーション）
const HomePage: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>数学速度対戦アプリ</h1>
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
      <Link to="/battle" style={{ padding: '15px 30px', fontSize: '18px', background: '#007bff', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
        ⚡ 速度対戦モードへ
      </Link>
      <Link to="/make-quiz" style={{ padding: '15px 30px', fontSize: '18px', background: '#28a745', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
        📄 PDF問題作成へ
      </Link>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>

      {/* URLに応じたページの切り替え */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/make-quiz" element={<MakeQuizPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;