/**
 * React Navigation のスタックパラメータ型定義
 */

export type RootStackParamList = {
  /** ホーム（統計サマリー + 学習開始） */
  Home: undefined;
  /** タイマー設定（学習時間の選択） */
  TimerSetup: undefined;
  /** 学習セッション（タイマー + 問題表示） */
  StudySession: { durationSeconds: number };
  /** セッション結果（正答率 + 平均回答時間） */
  SessionResult: { sessionId: string };
  /** 累計統計 */
  Stats: undefined;
  /** 法的情報（プライバシーポリシー / 利用規約） */
  Legal: { type: 'privacy' | 'terms' };
};
