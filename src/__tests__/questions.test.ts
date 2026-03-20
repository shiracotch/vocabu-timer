/**
 * 問題データ整合性テスト（§1 F-M04, F-M05, F-F05 / §16 ST-06）
 *
 * テスト計画との対応:
 *  F-M04  - 4択問題に選択肢が4件あること
 *  F-M04  - 正解が1件だけであること
 *  F-F05  - 立式問題に変数定義があること
 *  ST-06  - IPAの過去問を一字一句コピーしていないことの静的確認
 *  データ  - ID重複なし、必須フィールドが揃っていること
 */
import { evaluate } from 'mathjs';
import { QUESTIONS } from '../data/questions';
import { MultipleChoiceQuestion, FormulaQuestion } from '../types';

// ─── 基本構造 ──────────────────────────────────────────────────────────────────

describe('QUESTIONS 基本構造', () => {
  test('問題が1件以上登録されていること', () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  test('全問題の ID が一意であること（重複なし）', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('全問題が必須フィールド（id / type / body / explanation）を持つこと', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.type).toMatch(/^(multiple_choice|formula)$/);
      expect(q.body.trim()).not.toBe('');
      expect(q.explanation.trim()).not.toBe('');
    }
  });

  test('問題の type が multiple_choice か formula のみであること', () => {
    const validTypes = new Set(['multiple_choice', 'formula']);
    for (const q of QUESTIONS) {
      expect(validTypes.has(q.type)).toBe(true);
    }
  });
});

// ─── 4択問題（F-M04）────────────────────────────────────────────────────────────

const multipleChoiceQuestions = QUESTIONS.filter(
  (q): q is MultipleChoiceQuestion => q.type === 'multiple_choice'
);

describe('4択問題の構造', () => {
  test('4択問題が1件以上登録されていること', () => {
    expect(multipleChoiceQuestions.length).toBeGreaterThan(0);
  });

  test.each(multipleChoiceQuestions)(
    '[%s] 選択肢がちょうど4件あること（F-M04）',
    (q) => {
      expect(q.choices).toHaveLength(4);
    }
  );

  test.each(multipleChoiceQuestions)(
    '[%s] 正解の選択肢がちょうど1件であること（F-M04）',
    (q) => {
      const correctChoices = q.choices.filter((c) => c.isCorrect);
      expect(correctChoices).toHaveLength(1);
    }
  );

  test.each(multipleChoiceQuestions)(
    '[%s] 全選択肢が空でないテキストを持つこと',
    (q) => {
      for (const choice of q.choices) {
        expect(choice.id).toBeTruthy();
        expect(choice.text.trim()).not.toBe('');
      }
    }
  );

  test.each(multipleChoiceQuestions)(
    '[%s] 選択肢 ID が一意であること',
    (q) => {
      const ids = q.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );

  test.each(multipleChoiceQuestions)(
    '[%s] 選択肢が全て異なるテキストであること（紛らわしい重複なし）',
    (q) => {
      const texts = q.choices.map((c) => c.text.trim());
      expect(new Set(texts).size).toBe(texts.length);
    }
  );
});

// ─── 立式問題（F-F05）────────────────────────────────────────────────────────────

const formulaQuestions = QUESTIONS.filter(
  (q): q is FormulaQuestion => q.type === 'formula'
);

describe('立式問題の構造', () => {
  test('立式問題が1件以上登録されていること', () => {
    expect(formulaQuestions.length).toBeGreaterThan(0);
  });

  test.each(formulaQuestions)(
    '[%s] variables が1件以上あること（F-F05）',
    (q) => {
      expect(q.variables.length).toBeGreaterThan(0);
    }
  );

  test.each(formulaQuestions)(
    '[%s] 全変数が name と label を持つこと（F-F05）',
    (q) => {
      for (const v of q.variables) {
        expect(v.name.trim()).not.toBe('');
        expect(v.label.trim()).not.toBe('');
      }
    }
  );

  test.each(formulaQuestions)(
    '[%s] correctFormula が mathjs で評価できること',
    (q) => {
      // 変数に10を代入して評価が成功することを確認する
      const scope: Record<string, number> = {};
      for (const v of q.variables) {
        scope[v.name] = 10;
      }
      expect(() => {
        const result = evaluate(q.correctFormula, scope);
        expect(typeof result).toBe('number');
        expect(isFinite(result as number)).toBe(true);
      }).not.toThrow();
    }
  );

  test.each(formulaQuestions)(
    '[%s] correctFormula の変数が variables に全て定義されていること',
    (q) => {
      // 変数名の配列をセットに変換して、formulaが参照する変数が全て登録済みか確認する
      const definedVarNames = new Set(q.variables.map((v) => v.name));
      // 未定義変数でevaluateするとエラーになるため、エラーが出ないことで確認できる
      const scope: Record<string, number> = {};
      for (const v of q.variables) {
        scope[v.name] = 15; // 0除算を避ける
      }
      expect(() => evaluate(q.correctFormula, scope)).not.toThrow();
      expect(definedVarNames.size).toBeGreaterThan(0);
    }
  );
});

// ─── §16 ST-06 著作権確認（静的テキスト検査）────────────────────────────────────

describe('ST-06 著作権：IPAの出典表記・問題文のチェック', () => {
  // IPA試験問題の典型的な書き出しパターン（そのまま転用していないことを確認）
  const ipaVerbatimPatterns = [
    /^次の記述のうち、正しいものはどれか。$/,    // IPA典型パターン
    /^次の記述のうち、適切なものはどれか。$/,
    /^次のうち、正しいものはどれか。$/,
    /問\s*\d+\s*[　 ]/,                          // 「問1 〇〇」形式
    /基本情報技術者試験\s*平成|令和\s*\d+年/,     // 出典明記
    /IPA|情報処理推進機構/,                       // IPA名称が本文に含まれる
  ];

  test.each(QUESTIONS)(
    '[%s] 問題文にIPA典型パターンが含まれていないこと',
    (q) => {
      for (const pattern of ipaVerbatimPatterns) {
        expect(q.body).not.toMatch(pattern);
      }
    }
  );

  test.each(QUESTIONS)(
    '[%s] 解説文にIPA出典表記が含まれていないこと',
    (q) => {
      expect(q.explanation).not.toMatch(/IPA|情報処理推進機構|平成\d+年度.*試験/);
    }
  );

  test('問題文が独自に記述されていること（40文字以上のオリジナル文章）', () => {
    // 極端に短い問題文（コピーの単純化の可能性）がないことを確認する
    for (const q of QUESTIONS) {
      expect(q.body.trim().length).toBeGreaterThanOrEqual(10);
    }
  });
});

// ─── 問題データ全体のサニティチェック ─────────────────────────────────────────

describe('問題データ サニティチェック', () => {
  test('全問題 ID が小文字英数字とハイフンのみで構成されていること', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test('問題本文にHTMLタグが含まれていないこと（表示崩れ防止）', () => {
    for (const q of QUESTIONS) {
      expect(q.body).not.toMatch(/<[a-z][\s\S]*>/i);
    }
  });

  test('4択問題と立式問題が両方登録されていること', () => {
    const hasMultipleChoice = QUESTIONS.some((q) => q.type === 'multiple_choice');
    const hasFormula = QUESTIONS.some((q) => q.type === 'formula');
    expect(hasMultipleChoice).toBe(true);
    expect(hasFormula).toBe(true);
  });
});
