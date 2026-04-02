/**
 * SQLiteデータベースの初期化と操作
 * 問題データはTSファイルで静的管理するため、DBは学習結果のみ保存する
 */
import * as SQLite from 'expo-sqlite';
import { StudySession, QuestionResult } from '../types';

const DB_NAME = 'vocabu-timer.db';

// スキーマバージョン（カラム追加などの変更時にインクリメントする）
const SCHEMA_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

/** DBに接続し、マイグレーションを実行してテーブルを初期化する */
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const currentVersion = await getSchemaVersion();

  if (currentVersion < SCHEMA_VERSION) {
    await migrate(currentVersion);
  }
}

/** 現在のスキーマバージョンを取得する */
async function getSchemaVersion(): Promise<number> {
  const row = await getDb().getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  return row?.user_version ?? 0;
}

/**
 * スキーマのマイグレーションを実行する
 * バージョンごとに差分を適用し、最終的にSCHEMA_VERSIONまで上げる
 */
async function migrate(fromVersion: number): Promise<void> {
  if (fromVersion < 1) {
    // v0 → v1: テーブルを正規の定義で作り直す
    // （旧バージョンで startedAt カラムなしで作成されていた問題を修正）
    await getDb().execAsync(`
      DROP TABLE IF EXISTS question_results;
      DROP TABLE IF EXISTS study_sessions;

      CREATE TABLE study_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        startedAt INTEGER NOT NULL,
        durationSeconds INTEGER NOT NULL
      );

      CREATE TABLE question_results (
        id TEXT PRIMARY KEY NOT NULL,
        sessionId TEXT NOT NULL,
        questionId TEXT NOT NULL,
        isCorrect INTEGER NOT NULL,
        answerSeconds REAL NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES study_sessions(id) ON DELETE CASCADE
      );
    `);
  }

  await getDb().execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

/** DB接続を取得する（未初期化の場合はエラー） */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('DBが初期化されていません。initDatabase()を先に呼び出してください。');
  return db;
}

/** ランダムなIDを生成する */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── StudySession 操作 ────────────────────────────────────────────────────────

/** 学習セッションと問題ごとの結果を保存する */
export async function saveStudySession(
  durationSeconds: number,
  results: { questionId: string; isCorrect: boolean; answerSeconds: number }[]
): Promise<StudySession> {
  const session: StudySession = {
    id: generateId(),
    startedAt: Date.now(),
    durationSeconds,
  };

  await getDb().runAsync(
    'INSERT INTO study_sessions (id, startedAt, durationSeconds) VALUES (?, ?, ?)',
    session.id, session.startedAt, session.durationSeconds
  );

  for (const result of results) {
    const questionResult: QuestionResult = {
      id: generateId(),
      sessionId: session.id,
      questionId: result.questionId,
      isCorrect: result.isCorrect,
      answerSeconds: result.answerSeconds,
    };
    await getDb().runAsync(
      'INSERT INTO question_results (id, sessionId, questionId, isCorrect, answerSeconds) VALUES (?, ?, ?, ?, ?)',
      questionResult.id,
      questionResult.sessionId,
      questionResult.questionId,
      questionResult.isCorrect ? 1 : 0,
      questionResult.answerSeconds
    );
  }

  return session;
}

/** 指定セッションの問題結果一覧を取得する */
export async function fetchSessionResults(sessionId: string): Promise<QuestionResult[]> {
  const rows = await getDb().getAllAsync<{
    id: string; sessionId: string; questionId: string;
    isCorrect: number; answerSeconds: number;
  }>(
    'SELECT * FROM question_results WHERE sessionId = ?',
    sessionId
  );
  return rows.map(row => ({ ...row, isCorrect: row.isCorrect === 1 }));
}

/** 累計統計を取得する（全セッション合計の正答率・平均回答時間） */
export async function fetchOverallStats(): Promise<{
  totalAnswered: number;
  correctCount: number;
  avgAnswerSeconds: number;
}> {
  const row = await getDb().getFirstAsync<{
    totalAnswered: number;
    correctCount: number;
    avgAnswerSeconds: number;
  }>(
    `SELECT
      COUNT(*) AS totalAnswered,
      SUM(isCorrect) AS correctCount,
      AVG(answerSeconds) AS avgAnswerSeconds
    FROM question_results`
  );
  return {
    totalAnswered: row?.totalAnswered ?? 0,
    correctCount: row?.correctCount ?? 0,
    avgAnswerSeconds: row?.avgAnswerSeconds ?? 0,
  };
}
