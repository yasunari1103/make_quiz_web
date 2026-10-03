// src/types/ranking.ts

export type ModeType = 'PRIME' | 'FACTOR' | 'GCD';

export interface RankingEntry {
  id: string;
  name: string;
  timeSeconds: number;
  number: number;
  level: number;
  currentType: ModeType;
  created_at: string; // Supabase側のカラム名に合わせる
}