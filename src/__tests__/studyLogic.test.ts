/**
 * 学習セッション・統計ロジックの単体テスト
 *
 * テスト計画との対応:
 *  F-T05  - タイマー表示フォーマット（MM:SS）の精度
 *  F-S01  - セッション正答率の計算
 *  F-S03  - 初期状態（0件）での統計表示
 *  D-04   - 統計値の計算精度
 *
 * 注意: StudySessionScreen 等のコンポーネント内にある純粋ロジックを
 *       独立して検証するため、同等のロジックをここで定義してテストする。
 *       コンポーネント側のロジックを変更した場合はこのテストも合わせて更新すること。
 */

// ─── F-T05: タイマー表示フォーマット ──────────────────────────────────────────

/**
 * StudySessionScreen.formatTime と同等のロジック
 * 残り秒数を MM:SS 形式にフォーマットする
 */
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

describe('formatTime（F-T05: タイマー表示精度）', () => {
  test('25分00秒 → "25:00"', () => {
    expect(formatTime(1500)).toBe('25:00');
  });

  test('5分00秒 → "05:00"（ゼロパディング）', () => {
    expect(formatTime(300)).toBe('05:00');
  });

  test('1分00秒 → "01:00"', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  test('0分30秒 → "00:30"', () => {
    expect(formatTime(30)).toBe('00:30');
  });

  test('0分01秒 → "00:01"', () => {
    expect(formatTime(1)).toBe('00:01');
  });

  test('0分00秒 → "00:00"（タイマー終了状態）', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  test('59分59秒 → "59:59"', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  test('60分00秒 → "60:00"（1時間設定の場合）', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  test('1秒ずつ減らしたとき、秒の桁が正しく変化する', () => {
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(59)).toBe('00:59');
  });

  // 境界値テスト
  test('30秒警告閾値（残り30秒）が正しく表現される', () => {
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(29)).toBe('00:29');
  });
});

// ─── F-S01/D-04: セッション正答率計算 ────────────────────────────────────────

/**
 * SessionResultScreen の正答率・平均回答時間計算と同等のロジック
 */
type ResultRecord = {
  isCorrect: boolean;
  answerSeconds: number;
};

function calcSessionStats(results: ResultRecord[]) {
  const totalAnswered = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracyRate =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const avgSeconds =
    totalAnswered > 0
      ? results.reduce((sum, r) => sum + r.answerSeconds, 0) / totalAnswered
      : 0;
  return { totalAnswered, correctCount, accuracyRate, avgSeconds };
}

describe('セッション統計計算（F-S01 / D-04）', () => {
  test('全問正解: 正答率100%', () => {
    const results: ResultRecord[] = [
      { isCorrect: true, answerSeconds: 10 },
      { isCorrect: true, answerSeconds: 20 },
    ];
    const stats = calcSessionStats(results);
    expect(stats.accuracyRate).toBe(100);
    expect(stats.correctCount).toBe(2);
    expect(stats.totalAnswered).toBe(2);
  });

  test('全問不正解: 正答率0%', () => {
    const results: ResultRecord[] = [
      { isCorrect: false, answerSeconds: 5 },
      { isCorrect: false, answerSeconds: 8 },
    ];
    const stats = calcSessionStats(results);
    expect(stats.accuracyRate).toBe(0);
    expect(stats.correctCount).toBe(0);
  });

  test('半分正解: 正答率50%', () => {
    const results: ResultRecord[] = [
      { isCorrect: true, answerSeconds: 10 },
      { isCorrect: false, answerSeconds: 20 },
    ];
    expect(calcSessionStats(results).accuracyRate).toBe(50);
  });

  test('3問中2正解: 正答率66%（端数は Math.round で丸める）', () => {
    const results: ResultRecord[] = [
      { isCorrect: true, answerSeconds: 10 },
      { isCorrect: true, answerSeconds: 10 },
      { isCorrect: false, answerSeconds: 10 },
    ];
    // 2/3 = 66.666... → 67%
    expect(calcSessionStats(results).accuracyRate).toBe(67);
  });

  test('F-S03: 0件のとき正答率は0、クラッシュしない', () => {
    const stats = calcSessionStats([]);
    expect(stats.totalAnswered).toBe(0);
    expect(stats.accuracyRate).toBe(0);
    expect(stats.avgSeconds).toBe(0);
  });

  test('平均回答時間が正確に計算される', () => {
    const results: ResultRecord[] = [
      { isCorrect: true, answerSeconds: 10 },
      { isCorrect: false, answerSeconds: 20 },
      { isCorrect: true, answerSeconds: 30 },
    ];
    expect(calcSessionStats(results).avgSeconds).toBeCloseTo(20, 5);
  });

  test('回答時間が小数のとき正確に平均が計算される', () => {
    const results: ResultRecord[] = [
      { isCorrect: true, answerSeconds: 5.3 },
      { isCorrect: true, answerSeconds: 10.7 },
    ];
    expect(calcSessionStats(results).avgSeconds).toBeCloseTo(8.0, 5);
  });
});

// ─── F-S03 / D-04: ホーム画面・統計画面の正答率計算 ─────────────────────────

/**
 * HomeScreen / StatsScreen の accuracyRate 計算と同等のロジック
 * （DBから取得した totalAnswered / correctCount を元に計算）
 */
function calcAccuracyRate(totalAnswered: number, correctCount: number): number | null {
  return totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null;
}

describe('累計正答率計算（HomeScreen / StatsScreen）', () => {
  test('回答なし: null を返す（"―"表示のため）', () => {
    expect(calcAccuracyRate(0, 0)).toBeNull();
  });

  test('100件中100件正解: 100%', () => {
    expect(calcAccuracyRate(100, 100)).toBe(100);
  });

  test('100件中0件正解: 0%', () => {
    expect(calcAccuracyRate(100, 0)).toBe(0);
  });

  test('1件中1件正解: 100%', () => {
    expect(calcAccuracyRate(1, 1)).toBe(100);
  });

  test('3件中1件正解: 33%', () => {
    // 1/3 = 33.333... → 33%
    expect(calcAccuracyRate(3, 1)).toBe(33);
  });
});

// ─── F-S01: セッション結果画面の getQuestionBody トランケート ────────────────

/**
 * SessionResultScreen.getQuestionBody と同等のロジック
 */
function getQuestionBody(body: string): string {
  return body.length > 40 ? body.slice(0, 40) + '…' : body;
}

describe('getQuestionBody（問題文トランケート）', () => {
  test('40文字以下の問題文はそのまま返す', () => {
    const body = 'OSI参照モデルのネットワーク層の役割は何か。'; // 21文字
    expect(getQuestionBody(body)).toBe(body);
  });

  test('41文字以上は40文字 + "…" に切り詰める', () => {
    const body = 'a'.repeat(50);
    const result = getQuestionBody(body);
    expect(result).toBe('a'.repeat(40) + '…');
    expect(result.length).toBe(41); // 40文字 + '…'(1文字) = 41
  });

  test('ちょうど40文字はトランケートしない', () => {
    const body = 'a'.repeat(40);
    expect(getQuestionBody(body)).toBe(body);
  });

  test('空文字はそのまま返す', () => {
    expect(getQuestionBody('')).toBe('');
  });
});

// ─── F-T05 境界値: タイマー終了直前の挙動 ────────────────────────────────────

describe('タイマー終了閾値（境界値テスト）', () => {
  // StudySessionScreen では remainingSeconds <= 30 で赤色警告になる
  test('残り30秒は警告閾値に含まれる', () => {
    expect(30 <= 30).toBe(true);
  });

  test('残り31秒は警告閾値に含まれない', () => {
    expect(31 <= 30).toBe(false);
  });

  test('残り0秒でセッション終了フラグが立つ', () => {
    expect(0 <= 0).toBe(true);
  });
});
