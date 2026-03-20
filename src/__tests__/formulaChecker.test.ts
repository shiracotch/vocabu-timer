/**
 * formulaChecker ユーティリティのテスト
 */
import {
  toEvaluatable,
  checkFormulaEquivalence,
  validateFormula,
} from '../utils/formulaChecker';

// ─── toEvaluatable ────────────────────────────────────────────────────────────

describe('toEvaluatable', () => {
  test('÷ を / に変換する', () => {
    expect(toEvaluatable('x ÷ y')).toBe('x/y');
  });

  test('× を * に変換する', () => {
    expect(toEvaluatable('x × y')).toBe('x*y');
  });

  test('÷ と × を同時に変換する', () => {
    expect(toEvaluatable('a × b ÷ c')).toBe('a*b/c');
  });

  test('空白を除去する', () => {
    expect(toEvaluatable('x + y')).toBe('x+y');
  });

  test('括弧を含む式を正しく変換する', () => {
    expect(toEvaluatable('x ÷ ( x + y )')).toBe('x/(x+y)');
  });

  test('変換不要な式はそのまま返す', () => {
    expect(toEvaluatable('x/y')).toBe('x/y');
  });
});

// ─── checkFormulaEquivalence ──────────────────────────────────────────────────

describe('checkFormulaEquivalence', () => {
  test('同じ式は等価と判定される', () => {
    const result = checkFormulaEquivalence('x ÷ y', 'x / y', ['x', 'y']);
    expect(result).toBe(true);
  });

  test('数学的に等価な式は等価と判定される（x/y と x*y^-1）', () => {
    // x / y と x * (1 / y) は等価
    const result = checkFormulaEquivalence('x ÷ y', 'x * (1/y)', ['x', 'y']);
    expect(result).toBe(true);
  });

  test('可用性の公式: MTBF÷(MTBF+MTTR)', () => {
    const result = checkFormulaEquivalence(
      'a ÷ ( a + b )',
      'a / (a + b)',
      ['a', 'b']
    );
    expect(result).toBe(true);
  });

  test('異なる式は等価でないと判定される', () => {
    const result = checkFormulaEquivalence('x + y', 'x * y', ['x', 'y']);
    expect(result).toBe(false);
  });

  test('変数の順序が違う式は等価でないと判定される', () => {
    // x / y と y / x は等価でない
    const result = checkFormulaEquivalence('x ÷ y', 'y / x', ['x', 'y']);
    expect(result).toBe(false);
  });

  test('構文エラーのある式は false を返す', () => {
    const result = checkFormulaEquivalence('x ÷ ÷ y', 'x / y', ['x', 'y']);
    expect(result).toBe(false);
  });

  test('変数が1つの場合も正しく判定できる', () => {
    const result = checkFormulaEquivalence('x × x', 'x^2', ['x']);
    expect(result).toBe(true);
  });

  test('3変数の式を正しく判定できる', () => {
    // CPI公式: 命令数 × CPI ÷ クロック周波数
    const result = checkFormulaEquivalence(
      'a × b ÷ c',
      'a * b / c',
      ['a', 'b', 'c']
    );
    expect(result).toBe(true);
  });
});

// ─── validateFormula ──────────────────────────────────────────────────────────

describe('validateFormula', () => {
  test('空文字はエラーを返す', () => {
    const error = validateFormula('', ['x', 'y']);
    expect(error).toBe('式を入力してください');
  });

  test('空白のみはエラーを返す', () => {
    const error = validateFormula('   ', ['x', 'y']);
    expect(error).toBe('式を入力してください');
  });

  test('正しい式は null を返す', () => {
    const error = validateFormula('x ÷ y', ['x', 'y']);
    expect(error).toBeNull();
  });

  test('構文エラーのある式はエラーを返す', () => {
    const error = validateFormula('x ÷ ÷ y', ['x', 'y']);
    expect(error).toBe('式の形式が正しくありません');
  });

  test('0除算になる式はエラーを返す（変数に10を代入した場合は0にならないため通る）', () => {
    // ダミー値10を使うため、変数が0にならない → x/y は有効と判定される
    const error = validateFormula('x ÷ y', ['x', 'y']);
    expect(error).toBeNull();
  });

  test('括弧を含む正しい式は null を返す', () => {
    const error = validateFormula('x ÷ ( x + y )', ['x', 'y']);
    expect(error).toBeNull();
  });

  // L90 カバレッジ: isFinite チェック（Infinity になる式）
  test('結果が Infinity になる式（x ÷ 0）は有効な数式エラーを返す', () => {
    // ダミー値 x=10 のとき 10÷0 = Infinity → !isFinite のブランチ
    const error = validateFormula('x ÷ 0', ['x']);
    expect(error).toBe('有効な数式を入力してください');
  });
});

// ─── カバレッジ補完: Infinity / NaN のエッジケース ────────────────────────────

describe('checkFormulaEquivalence: Infinity / NaN ケース（L56 カバレッジ）', () => {
  test('ユーザー式が Infinity を返す場合（x ÷ 0）は false を返す', () => {
    // x=50 のとき x/0 = Infinity → !isFinite ブランチ
    const result = checkFormulaEquivalence('x ÷ 0', 'x', ['x']);
    expect(result).toBe(false);
  });

  test('正解式が Infinity を返す場合も false を返す', () => {
    const result = checkFormulaEquivalence('x', 'x / 0', ['x']);
    expect(result).toBe(false);
  });
});
