export type ModeType = 'PRIME' | 'FACTOR' | 'GCD';
export type PeriodType = 'ALL' | 'MONTH' | 'WEEK' | 'TODAY';

export interface RankingEntry {
  id: string;
  name: string;
  timeSeconds: number;
  number: number;
  level: number;
  currentType: ModeType;
  created_at: string;
  score?: number; // タイムアタック用（オプション）
}