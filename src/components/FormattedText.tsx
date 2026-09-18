import React from 'react';

// "2^3 × 5^2" のような文字列を "2³ × 5²" のように描画するコンポーネント
export const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // `^数字` や `^変数` のパターンにマッチさせて分割
  const parts = text.split(/(\^\d+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('^')) {
          // ^ を除外して <sup> で囲む
          return <sup key={index}>{part.slice(1)}</sup>;
        }
        return part;
      })}
    </span>
  );
};