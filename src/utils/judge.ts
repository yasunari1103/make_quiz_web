// utils/judge.ts
import { checkFactorAnswer } from './factorUtils';
import { parsePrimeFactors, checkAnswerFactors } from './answerCheckers';

export type QuizType = 'GCD' | 'PRIME' | 'FACTOR';
export type UserInput = { val1: string; val2: string };

// ResultPage の formatUserAnswer と同じ
export const formatUserAnswer = (type: QuizType, input: UserInput): string => {
  if (type !== 'FACTOR') return input.val1.trim() || '（無回答）';
  if (!input.val1 && !input.val2) return '（無回答）';
  return `(x${input.val1.trim()})(x${input.val2.trim()})`;
};

// ResultPage の判定と同じ
export const judgeAnswer = (type: QuizType, input: UserInput, correct: string): boolean => {
  const userStr = formatUserAnswer(type, input);
  if (type === 'FACTOR') return checkFactorAnswer(userStr, correct);
  return checkAnswerFactors(parsePrimeFactors(userStr), parsePrimeFactors(correct));
};