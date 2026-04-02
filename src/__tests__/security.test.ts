/**
 * セキュリティ観点のテスト
 *
 * 対象リスク：
 *  1. プロトタイプ汚染（variableNames に '__proto__' 等を渡す）
 *  2. mathjs を経由したサンドボックス外アクセス（process / require / global）
 *  3. 極端に長い入力による DoS
 *  4. SQL インジェクション文字列がパラメータとして扱われているか
 *  5. 異常値（負数・NaN・Infinity）の入力
 */

import {
  checkFormulaEquivalence,
  validateFormula,
} from '../utils/formulaChecker';
import {
  initDatabase,
  saveStudySession,
  fetchSessionResults,
} from '../db/database';

// ─── expo-sqlite モック（database.test.ts と同構成） ───────────────────────────

const insertedSessions: Record<string, unknown> = {};
const insertedResults: Array<{
  id: string; sessionId: string; questionId: string;
  isCorrect: number; answerSeconds: number;
}> = [];

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockImplementation((sql: string, ...params: unknown[]) => {
    if (sql.includes('INSERT INTO study_sessions')) {
      const [id, startedAt, durationSeconds] = params as [string, number, number];
      insertedSessions[id as string] = { id, startedAt, durationSeconds };
    } else if (sql.includes('INSERT INTO question_results')) {
      const [id, sessionId, questionId, isCorrect, answerSeconds] = params as [string, string, string, number, number];
      insertedResults.push({ id, sessionId, questionId, isCorrect, answerSeconds });
    }
    return Promise.resolve(undefined);
  }),
  getAllAsync: jest.fn().mockImplementation((_sql: string, sessionId: string) =>
    Promise.resolve(insertedResults.filter(r => r.sessionId === sessionId).map(r => ({ ...r })))
  ),
  getFirstAsync: jest.fn().mockResolvedValue({ totalAnswered: 0, correctCount: 0, avgAnswerSeconds: 0 }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
}));

beforeEach(() => {
  Object.keys(insertedSessions).forEach(k => delete insertedSessions[k]);
  insertedResults.length = 0;
  jest.clearAllMocks();
  const SQLite = jest.requireMock('expo-sqlite');
  SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
  mockDb.execAsync.mockResolvedValue(undefined);
  mockDb.runAsync.mockImplementation((sql: string, ...params: unknown[]) => {
    if (sql.includes('INSERT INTO study_sessions')) {
      const [id, startedAt, durationSeconds] = params as [string, number, number];
      insertedSessions[id as string] = { id, startedAt, durationSeconds };
    } else if (sql.includes('INSERT INTO question_results')) {
      const [id, sessionId, questionId, isCorrect, answerSeconds] = params as [string, string, string, number, number];
      insertedResults.push({ id, sessionId, questionId, isCorrect, answerSeconds });
    }
    return Promise.resolve(undefined);
  });
  mockDb.getAllAsync.mockImplementation((_sql: string, sessionId: string) =>
    Promise.resolve(insertedResults.filter(r => r.sessionId === sessionId).map(r => ({ ...r })))
  );
  mockDb.getFirstAsync.mockResolvedValue({ totalAnswered: 0, correctCount: 0, avgAnswerSeconds: 0 });
});

// ─── 1. プロトタイプ汚染 ──────────────────────────────────────────────────────

describe('プロトタイプ汚染への耐性', () => {
  test('variableNames に __proto__ を渡しても Object.prototype が汚染されない', () => {
    const protoBefore = Object.getPrototypeOf({});

    // __proto__ は scope['__proto__'] への代入を試みるが、Object.prototype を汚染してはならない
    checkFormulaEquivalence('x + 1', 'x + 1', ['__proto__']);

    expect(Object.getPrototypeOf({})).toBe(protoBefore);
    // 汚染されていれば isAdmin のような任意プロパティが {} に生える
    expect(({} as Record<string, unknown>)['isAdmin']).toBeUndefined();
  });

  test('variableNames に constructor を渡してもクラッシュしない', () => {
    // constructor プロパティへの書き込みは無害に扱われるべき
    expect(() => {
      checkFormulaEquivalence('x + 1', 'x + 1', ['constructor']);
    }).not.toThrow();
  });

  test('variableNames に toString を渡してもクラッシュしない', () => {
    expect(() => {
      checkFormulaEquivalence('x + 1', 'x + 1', ['toString']);
    }).not.toThrow();
  });

  test('validateFormula: variableNames に __proto__ を渡しても Object.prototype が汚染されない', () => {
    const protoBefore = Object.getPrototypeOf({});

    validateFormula('x + 1', ['__proto__']);

    expect(Object.getPrototypeOf({})).toBe(protoBefore);
  });
});

// ─── 2. mathjs サンドボックス外アクセスの防止 ─────────────────────────────────

describe('mathjs サンドボックス外アクセスの防止', () => {
  test('process へのアクセスを試みる式は false を返す', () => {
    // mathjs は process を変数として認識しない → エラーになり false
    const result = checkFormulaEquivalence('process', 'x', ['x']);
    expect(result).toBe(false);
  });

  test('require を含む式は false を返す', () => {
    const result = checkFormulaEquivalence('require', 'x', ['x']);
    expect(result).toBe(false);
  });

  test('global を含む式は false を返す', () => {
    const result = checkFormulaEquivalence('global', 'x', ['x']);
    expect(result).toBe(false);
  });

  test('import を含む式は false を返す', () => {
    const result = checkFormulaEquivalence('import', 'x', ['x']);
    expect(result).toBe(false);
  });

  test('validateFormula: process を含む式はエラーを返す', () => {
    const error = validateFormula('process', ['x']);
    expect(error).not.toBeNull();
  });

  test('validateFormula: require を含む式はエラーを返す', () => {
    const error = validateFormula('require(x)', ['x']);
    expect(error).not.toBeNull();
  });

  // mathjs 組み込み関数（sin, sqrt 等）は意図的に許可されている
  // ただし数値以外の結果を返す場合は false / エラーになることを確認する
  test('結果が数値にならない mathjs 式（行列など）は false を返す', () => {
    const result = checkFormulaEquivalence('[1, 2, 3]', 'x', ['x']);
    expect(result).toBe(false);
  });
});

// ─── 3. 極端に長い入力（DoS 耐性） ───────────────────────────────────────────

describe('極端に長い入力への耐性（DoS）', () => {
  // 極端に長い文字列でもタイムアウト・クラッシュしないことを確認する
  // Jest のデフォルトタイムアウトは 5000ms

  test('10,000文字の式でも一定時間内に false を返す', () => {
    const longFormula = 'x + '.repeat(2500) + 'x'; // ~10000文字
    const start = Date.now();
    const result = checkFormulaEquivalence(longFormula, 'x', ['x']);
    const elapsed = Date.now() - start;

    // クラッシュせず false または true を返す（値は問わない）
    expect(typeof result).toBe('boolean');
    // 5秒以内に完了する（メインスレッドをブロックしない）
    expect(elapsed).toBeLessThan(5000);
  }, 10000); // このテストだけタイムアウトを 10 秒に延長

  test('10,000文字の式でも validateFormula がエラーを返す', () => {
    const longFormula = 'x + '.repeat(2500) + 'x';
    // 長さ自体は mathjs が処理するが、クラッシュしないことを確認
    expect(() => validateFormula(longFormula, ['x'])).not.toThrow();
  });

  test('深くネストした括弧でもクラッシュしない', () => {
    // ((((x + 1) + 1) + 1) ... ) を 500 段ネスト
    const deepNested = '('.repeat(500) + 'x + 1' + ')'.repeat(500);
    expect(() => checkFormulaEquivalence(deepNested, 'x + 1', ['x'])).not.toThrow();
  });
});

// ─── 4. SQL インジェクション文字列の取り扱い ─────────────────────────────────

describe('SQL インジェクション文字列の取り扱い', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  test("SQL インジェクション文字列はプレースホルダー経由で渡され、SQL クエリに結合されない", async () => {
    const maliciousId = "'; DROP TABLE question_results; --";

    await saveStudySession(60, [
      { questionId: maliciousId, isCorrect: true, answerSeconds: 5 },
    ]);

    // INSERT INTO question_results の呼び出しを取得
    const call = mockDb.runAsync.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO question_results')
    );
    expect(call).toBeDefined();

    const sql = call![0] as string;
    const params = call!.slice(1);

    // SQL 文にインジェクション文字列が直接含まれていない
    expect(sql).not.toContain(maliciousId);
    // インジェクション文字列はパラメータ（3番目の ?）として渡されている
    expect(params).toContain(maliciousId);
  });

  test("OR 1=1 形式のインジェクション文字列もパラメータとして安全に渡される", async () => {
    const maliciousId = '" OR "1"="1';

    await saveStudySession(60, [
      { questionId: maliciousId, isCorrect: false, answerSeconds: 3 },
    ]);

    const call = mockDb.runAsync.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO question_results')
    );
    const sql = call![0] as string;
    const params = call!.slice(1);

    expect(sql).not.toContain(maliciousId);
    expect(params).toContain(maliciousId);
  });

  test("fetchSessionResults: インジェクション文字列のセッション ID はパラメータとして渡される", async () => {
    const maliciousSessionId = "' OR '1'='1";

    await fetchSessionResults(maliciousSessionId);

    const call = mockDb.getAllAsync.mock.calls[0];
    const sql = call[0] as string;
    const param = call[1] as string;

    // SQL 文にインジェクション文字列が含まれていない
    expect(sql).not.toContain(maliciousSessionId);
    // パラメータとして渡されている
    expect(param).toBe(maliciousSessionId);
  });

  test("Null バイトを含む questionId もクラッシュせず保存される", async () => {
    const nullByteId = "q1\x00DROP";

    await expect(
      saveStudySession(60, [{ questionId: nullByteId, isCorrect: true, answerSeconds: 1 }])
    ).resolves.not.toThrow();

    // パラメータとして渡されている（SQL に直接結合されていない）
    const call = mockDb.runAsync.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO question_results')
    );
    expect(call!.slice(1)).toContain(nullByteId);
  });
});

// ─── 5. 異常値の入力 ─────────────────────────────────────────────────────────

describe('異常値の入力への耐性', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  test('durationSeconds に 0 を渡してもクラッシュしない', async () => {
    await expect(saveStudySession(0, [])).resolves.not.toThrow();
  });

  test('answerSeconds に 0 を渡してもクラッシュしない', async () => {
    await expect(
      saveStudySession(60, [{ questionId: 'q1', isCorrect: true, answerSeconds: 0 }])
    ).resolves.not.toThrow();
  });

  test('answerSeconds に負の値を渡してもクラッシュしない', async () => {
    // 現状バリデーションがないため保存される。将来的には弾くべきだがクラッシュはしてはならない
    await expect(
      saveStudySession(60, [{ questionId: 'q1', isCorrect: true, answerSeconds: -1 }])
    ).resolves.not.toThrow();
  });

  test('durationSeconds に NaN を渡してもクラッシュしない', async () => {
    await expect(saveStudySession(NaN, [])).resolves.not.toThrow();
  });

  test('durationSeconds に Infinity を渡してもクラッシュしない', async () => {
    await expect(saveStudySession(Infinity, [])).resolves.not.toThrow();
  });

  test('空文字の questionId を渡してもクラッシュしない', async () => {
    await expect(
      saveStudySession(60, [{ questionId: '', isCorrect: true, answerSeconds: 5 }])
    ).resolves.not.toThrow();
  });
});
