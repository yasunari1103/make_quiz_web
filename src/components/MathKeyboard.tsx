import React, { useRef, useLayoutEffect } from 'react';

interface MathKeyboardProps {
  isOpen: boolean;
  onToggle: () => void;
  onInsert: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onHeightChange?: (height: number) => void;
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  isOpen,
  onToggle,
  onInsert,
  onDelete,
  onClear,
  onHeightChange,
}) => {
    const keyboardRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!keyboardRef.current || !onHeightChange) return;

        const updateHeight = () => {
            if (keyboardRef.current) {
                onHeightChange(keyboardRef.current.offsetHeight);
            }
        };

        updateHeight();

    // サイズの変化（アニメーションや画面回転等）を監視
        const observer = new ResizeObserver(() => updateHeight());
        observer.observe(keyboardRef.current);

        return () => observer.disconnect();
    }, [isOpen, onHeightChange]);

    const keys = [
        ['1', '2', '3', '^'],
        ['4', '5', '6', '*'],
        ['7', '8', '9', '+'],
        ['C', '0', '⌫', '-'],
    ];

  return (
    <div
      ref={keyboardRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#e5e7eb',
        padding: isOpen ? '8px 8px 16px 8px' : '6px 8px', // 💡 折りたたみ時はコンパクトに
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {/* 💡 閉じる/開くバーエリア（タップで開閉をトグル） */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px 0px',
          backgroundColor: '#d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', margin: "0px" }}>
          ⌨️ 数学用キーボード
        </span>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#1d4ed8',
            cursor: 'pointer',
          }}
        >
          {isOpen ? '▼ キーボードをたたむ' : '▲ キーボードを開く'}
        </button>
      </div>

      {/* 💡 isOpen が true のときだけキーを表示 */}
      {isOpen && (
        <>
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              {row.map((key) => {
                let action = () => onInsert(key);
                let bgColor = '#ffffff';
                let textColor = '#1f2937';

                if (key === 'C') {
                  action = onClear;
                  bgColor = '#fca5a5'; // 赤系
                } else if (key === '⌫') {
                  action = onDelete;
                  bgColor = '#d1d5db'; // グレー
                } else if (['^', '*'].includes(key)) {
                  bgColor = '#e0e7ff'; // 薄い青紫
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      action();
                    }}
                    style={{
                      flex: 1,
                      height: '35px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      margin: '0px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: bgColor,
                      color: textColor,
                      cursor: 'pointer',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </>
      )}
    </div>
  );
};