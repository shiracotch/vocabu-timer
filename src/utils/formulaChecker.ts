/**
 * 計算式の等価判定ユーティリティ
 * ユーザーが入力した式と正解の式に複数の数値を代入し、結果が一致するか確認する
 */
import { evaluate } from 'mathjs';

// 判定に使うテストケースの数
const TEST_CASE_COUNT = 8;
// 浮動小数点誤差の許容範囲
const TOLERANCE = 1e-9;
// 変数に代入する値の範囲（0との除算を避けるため10〜100）
const VAR_MIN = 10;
const VAR_MAX = 90;

/**
 * ユーザー入力の式（表示用）をmathjs評価可能な形式に変換する
 * 例: 'x ÷ ( x + y )' → 'x / (x + y)'
 */
export function toEvaluatable(displayFormula: string): string {
  return displayFormula
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '');
}

/**
 * 2つの式が数学的に等価かどうかを判定する
 * @param userFormula - ユーザーが入力した式（表示用記号を含む）
 * @param correctFormula - 正解の式（mathjs形式）
 * @param variableNames - 使用する変数名の配列（例: ['x', 'y']）
 */
export function checkFormulaEquivalence(
  userFormula: string,
  correctFormula: string,
  variableNames: string[]
): boolean {
  const evaluatableUser = toEvaluatable(userFormula);

  for (let i = 0; i < TEST_CASE_COUNT; i++) {
    // 各変数にランダムな値を割り当てる
    const scope: Record<string, number> = {};
    for (const varName of variableNames) {
      scope[varName] = VAR_MIN + Math.random() * VAR_MAX;
    }

    try {
      const userResult = evaluate(evaluatableUser, scope);
      const correctResult = evaluate(correctFormula, scope);

      // 数値以外の結果（複素数など）は不正解とみなす
      if (typeof userResult !== 'number' || typeof correctResult !== 'number') {
        return false;
      }
      // NaNやInfinityは不正解
      if (!isFinite(userResult) || !isFinite(correctResult)) {
        return false;
      }

      if (Math.abs(userResult - correctResult) > TOLERANCE) {
        return false;
      }
    } catch {
      // 評価エラー（構文エラーなど）は不正解
      return false;
    }
  }

  return true;
}

/**
 * 入力した式を安全に評価できるか（構文チェック）
 * @returns エラーメッセージ（問題なければnull）
 */
export function validateFormula(
  displayFormula: string,
  variableNames: string[]
): string | null {
  if (!displayFormula.trim()) return '式を入力してください';

  const evaluatable = toEvaluatable(displayFormula);
  const scope: Record<string, number> = {};
  for (const varName of variableNames) {
    scope[varName] = 10; // ダミー値
  }

  try {
    const result = evaluate(evaluatable, scope);
    if (typeof result !== 'number' || !isFinite(result)) {
      return '有効な数式を入力してください';
    }
    return null;
  } catch {
    return '式の形式が正しくありません';
  }
}
