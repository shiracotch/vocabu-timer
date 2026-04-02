/**
 * database.ts のテスト
 * expo-sqlite はモックで差し替え、SQL操作の動作を検証する
 */
import {
  initDatabase,
  saveStudySession,
  fetchSessionResults,
  fetchOverallStats,
} from '../db/database';

// ─── expo-sqlite のモック ──────────────────────────────────────────────────────

// 挿入されたデータを記録するインメモリストア
const insertedSessions: Record<string, { id: string; startedAt: number; durationSeconds: number }> = {};
const insertedResults: Array<{ id: string; sessionId: string; questionId: string; isCorrect: number; answerSeconds: number }> = [];

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),

  runAsync: jest.fn().mockImplementation((sql: string, ...params: unknown[]) => {
    if (sql.includes('INSERT INTO study_sessions')) {
      const [id, startedAt, durationSeconds] = params as [string, number, number];
      insertedSessions[id] = { id, startedAt, durationSeconds };
    } else if (sql.includes('INSERT INTO question_results')) {
      const [id, sessionId, questionId, isCorrect, answerSeconds] = params as [string, string, string, number, number];
      insertedResults.push({ id, sessionId, questionId, isCorrect, answerSeconds });
    }
    return Promise.resolve(undefined);
  }),

  getAllAsync: jest.fn().mockImplementation((_sql: string, sessionId: string) => {
    const rows = insertedResults
      .filter(r => r.sessionId === sessionId)
      .map(r => ({ ...r }));
    return Promise.resolve(rows);
  }),

  getFirstAsync: jest.fn().mockImplementation((sql: string) => {
    // スキーマバージョン取得（マイグレーション判定に使用）
    if (sql.includes('PRAGMA user_version')) {
      return Promise.resolve({ user_version: 0 });
    }
    // 累計統計取得
    const totalAnswered = insertedResults.length;
    const correctCount = insertedResults.filter(r => r.isCorrect === 1).length;
    const avgAnswerSeconds =
      totalAnswered > 0
        ? insertedResults.reduce((sum, r) => sum + r.answerSeconds, 0) / totalAnswered
        : 0;
    return Promise.resolve({ totalAnswered, correctCount, avgAnswerSeconds });
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
}));

// ─── テスト ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // 各テスト前にストアをリセット
  Object.keys(insertedSessions).forEach(k => delete insertedSessions[k]);
  insertedResults.length = 0;
  jest.clearAllMocks();
  // openDatabaseAsync の再設定（clearAllMocks でリセットされるため）
  const SQLite = jest.requireMock('expo-sqlite');
  SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
  // runAsync などもリセット後に再設定
  mockDb.execAsync.mockResolvedValue(undefined);
  mockDb.runAsync.mockImplementation((sql: string, ...params: unknown[]) => {
    if (sql.includes('INSERT INTO study_sessions')) {
      const [id, startedAt, durationSeconds] = params as [string, number, number];
      insertedSessions[id] = { id, startedAt, durationSeconds };
    } else if (sql.includes('INSERT INTO question_results')) {
      const [id, sessionId, questionId, isCorrect, answerSeconds] = params as [string, string, string, number, number];
      insertedResults.push({ id, sessionId, questionId, isCorrect, answerSeconds });
    }
    return Promise.resolve(undefined);
  });
  mockDb.getAllAsync.mockImplementation((_sql: string, sessionId: string) => {
    const rows = insertedResults
      .filter(r => r.sessionId === sessionId)
      .map(r => ({ ...r }));
    return Promise.resolve(rows);
  });
  mockDb.getFirstAsync.mockImplementation((sql: string) => {
    if (sql.includes('PRAGMA user_version')) {
      return Promise.resolve({ user_version: 0 });
    }
    const totalAnswered = insertedResults.length;
    const correctCount = insertedResults.filter(r => r.isCorrect === 1).length;
    const avgAnswerSeconds =
      totalAnswered > 0
        ? insertedResults.reduce((sum, r) => sum + r.answerSeconds, 0) / totalAnswered
        : 0;
    return Promise.resolve({ totalAnswered, correctCount, avgAnswerSeconds });
  });
});

describe('initDatabase', () => {
  test('DBを開いてWAL設定とマイグレーションを実行する', async () => {
    await initDatabase();
    const SQLite = jest.requireMock('expo-sqlite');
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('vocabu-timer.db');
    // WAL設定が実行されること
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
    // マイグレーションでテーブル作成SQLが実行されること
    expect(mockDb.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE study_sessions')
    );
    expect(mockDb.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE question_results')
    );
  });
});

describe('saveStudySession', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  test('セッションと問題結果を保存し、StudySession を返す', async () => {
    const results = [
      { questionId: 'q1', isCorrect: true, answerSeconds: 15 },
      { questionId: 'q2', isCorrect: false, answerSeconds: 30 },
    ];

    const session = await saveStudySession(300, results);

    expect(session.durationSeconds).toBe(300);
    expect(typeof session.id).toBe('string');
    expect(session.id.length).toBeGreaterThan(0);
    expect(typeof session.startedAt).toBe('number');
  });

  test('問題ごとに runAsync が呼ばれる（1セッション + 2問 = 3回）', async () => {
    const results = [
      { questionId: 'q1', isCorrect: true, answerSeconds: 10 },
      { questionId: 'q2', isCorrect: false, answerSeconds: 20 },
    ];

    await saveStudySession(120, results);

    // study_sessions 1回 + question_results 2回 = 計3回
    expect(mockDb.runAsync).toHaveBeenCalledTimes(3);
  });

  test('isCorrect が true の場合、DBには 1 として保存される', async () => {
    await saveStudySession(60, [{ questionId: 'q1', isCorrect: true, answerSeconds: 5 }]);

    const savedResult = insertedResults[0];
    expect(savedResult.isCorrect).toBe(1);
  });

  test('isCorrect が false の場合、DBには 0 として保存される', async () => {
    await saveStudySession(60, [{ questionId: 'q1', isCorrect: false, answerSeconds: 5 }]);

    const savedResult = insertedResults[0];
    expect(savedResult.isCorrect).toBe(0);
  });
});

describe('fetchSessionResults', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  test('指定セッションの結果を取得し、isCorrect を boolean に変換する', async () => {
    const session = await saveStudySession(120, [
      { questionId: 'q1', isCorrect: true, answerSeconds: 10 },
      { questionId: 'q2', isCorrect: false, answerSeconds: 20 },
    ]);

    const results = await fetchSessionResults(session.id);

    expect(results).toHaveLength(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(false);
  });

  test('存在しないセッションIDは空配列を返す', async () => {
    const results = await fetchSessionResults('non-existent-id');
    expect(results).toHaveLength(0);
  });
});

describe('fetchOverallStats', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  test('データがない場合は全て 0 を返す', async () => {
    const stats = await fetchOverallStats();
    expect(stats.totalAnswered).toBe(0);
    expect(stats.correctCount).toBe(0);
    expect(stats.avgAnswerSeconds).toBe(0);
  });

  test('複数セッションの累計統計を正しく集計する', async () => {
    await saveStudySession(300, [
      { questionId: 'q1', isCorrect: true, answerSeconds: 10 },
      { questionId: 'q2', isCorrect: false, answerSeconds: 20 },
    ]);
    await saveStudySession(300, [
      { questionId: 'q3', isCorrect: true, answerSeconds: 30 },
    ]);

    const stats = await fetchOverallStats();

    expect(stats.totalAnswered).toBe(3);
    expect(stats.correctCount).toBe(2);
    // (10 + 20 + 30) / 3 = 20
    expect(stats.avgAnswerSeconds).toBeCloseTo(20, 5);
  });

  // L115-117 カバレッジ: getFirstAsync が null を返した場合の null ガード
  test('DBが null 行を返した場合はデフォルト値 0 を返す', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const stats = await fetchOverallStats();
    expect(stats.totalAnswered).toBe(0);
    expect(stats.correctCount).toBe(0);
    expect(stats.avgAnswerSeconds).toBe(0);
  });
});

// ─── カバレッジ補完: DB 未初期化エラー（L37）────────────────────────────────

describe('DB未初期化エラー（L37 カバレッジ）', () => {
  test('initDatabase 未呼び出しで saveStudySession を呼ぶとエラーを投げる', async () => {
    // jest.resetModules でモジュールキャッシュをクリアし、db = null の初期状態を再現する
    jest.resetModules();
    jest.mock('expo-sqlite', () => ({
      openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
    }));
    const { saveStudySession: freshSave } = require('../db/database');
    await expect(freshSave(60, [])).rejects.toThrow('DBが初期化されていません');
  });
});
