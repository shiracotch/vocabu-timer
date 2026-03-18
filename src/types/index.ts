// アプリ全体で使用する型定義

/** 問題の種別 */
export type QuestionType = 'multiple_choice' | 'formula';

/** 4択問題の選択肢 */
export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

/** 計算式問題の変数定義 */
export type FormulaVariable = {
  name: string;  // 'x', 'y', 'a' など
  label: string; // '平均故障間隔（MTBF）' など
};

/** 4択問題 */
export type MultipleChoiceQuestion = {
  id: string;
  type: 'multiple_choice';
  body: string;
  choices: Choice[];
  explanation: string;
};

/** 計算式問題 */
export type FormulaQuestion = {
  id: string;
  type: 'formula';
  body: string;
  variables: FormulaVariable[];
  correctFormula: string; // mathjsで評価できる形式（例: 'x / (x + y)'）
  explanation: string;
};

/** 問題（共用型） */
export type Question = MultipleChoiceQuestion | FormulaQuestion;

/** 学習セッション */
export type StudySession = {
  id: string;
  startedAt: number;
  durationSeconds: number; // 実際に学習した時間（秒）
};

/** 1問ごとの結果 */
export type QuestionResult = {
  id: string;
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  answerSeconds: number; // 回答にかかった時間（秒）
};
