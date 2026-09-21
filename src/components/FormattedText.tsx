import React from 'react';

interface Props {
  text: string;
}

// 指数 (^数字) を <sup>数字</sup> に変換して描画するヘルパー関数
const renderPowerText = (str: string) => {
  const parts = str.split(/(\^\d+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('^')) {
      return <sup key={index}>{part.slice(1)}</sup>;
    }
    return part;
  });
};

export const FormattedText: React.FC<Props> = ({ text }) => {
  // 1. "x = (分子) / 分母" の分数パターンにマッチするか判定
  const fractionMatch = text.match(/^(x\s*=\s*)\((.*?)\)\s*\/\s*(.+)$/);

  if (fractionMatch) {
    const [, prefix, num, den] = fractionMatch;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {renderPowerText(prefix)}
        <span className="fraction">
          <span className="numerator">{renderPowerText(num)}</span>
          <span className="denominator">{renderPowerText(den)}</span>
        </span>
      </span>
    );
  }

  // 2. 分数ではない場合（素因数分解の指数表記など）
  return <span>{renderPowerText(text)}</span>;
};