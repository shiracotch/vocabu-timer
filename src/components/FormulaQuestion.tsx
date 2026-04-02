/**
 * 計算式問題コンポーネント
 * 変数ボタンと演算子ボタンで式を組み立て、等価判定で正誤を判定する
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';

import { FormulaQuestion } from '../types';
import { checkFormulaEquivalence, validateFormula } from '../utils/formulaChecker';
import { getColors } from '../theme/colors';

type Props = {
  question: FormulaQuestion;
  onAnswer: (isCorrect: boolean) => void;
};

type AnswerState = 'inputting' | 'correct' | 'incorrect';

// 演算子ボタンの定義（表示用文字と入力される文字を分ける）
const OPERATORS = [
  { display: '+', value: '+' },
  { display: '−', value: '-' },
  { display: '×', value: '×' },
  { display: '÷', value: '÷' },
  { display: '(', value: '(' },
  { display: ')', value: ')' },
];

export default function FormulaQuestionView({ question, onAnswer }: Props) {
  const colors = getColors(useColorScheme());
  const [formula, setFormula] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('inputting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const variableNames = question.variables.map((v) => v.name);

  function handlePressToken(token: string) {
    if (answerState !== 'inputting') return;
    setErrorMessage(null);
    setFormula((prev) => (prev ? `${prev} ${token}` : token));
  }

  function handleBackspace() {
    if (answerState !== 'inputting') return;
    setErrorMessage(null);
    const tokens = formula.split(' ');
    tokens.pop();
    setFormula(tokens.join(' '));
  }

  function handleClear() {
    if (answerState !== 'inputting') return;
    setErrorMessage(null);
    setFormula('');
  }

  function handleSubmit() {
    if (answerState !== 'inputting') return;

    const error = validateFormula(formula, variableNames);
    if (error) {
      setErrorMessage(error);
      return;
    }

    const isCorrect = checkFormulaEquivalence(formula, question.correctFormula, variableNames);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    onAnswer(isCorrect);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 問題文 */}
      <View style={[styles.bodyContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.typeLabel}>計算式問題</Text>
        <Text style={[styles.body, { color: colors.textPrimary }]}>{question.body}</Text>
      </View>

      {/* 変数の凡例 */}
      <View style={[styles.variablesContainer, { backgroundColor: colors.surfaceSubtle }]}>
        <Text style={[styles.variablesTitle, { color: colors.textTertiary }]}>変数</Text>
        {question.variables.map((v) => (
          <View key={v.name} style={styles.variableRow}>
            <Text style={styles.variableName}>{v.name}</Text>
            <Text style={[styles.variableLabel, { color: colors.textSecondary }]}> = {v.label}</Text>
          </View>
        ))}
      </View>

      {/* 入力表示欄 */}
      <View style={[
        styles.inputDisplay,
        { backgroundColor: colors.surface, borderColor: colors.border },
        answerState === 'correct' && styles.inputDisplayCorrect,
        answerState === 'incorrect' && styles.inputDisplayIncorrect,
      ]}>
        <Text style={[styles.inputText, { color: colors.textPrimary }]} numberOfLines={2}>
          {formula || '式をボタンで入力してください'}
        </Text>
      </View>

      {/* エラーメッセージ */}
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* 入力ボタン（回答前のみ表示） */}
      {answerState === 'inputting' && (
        <View style={styles.keypadContainer}>
          {/* 変数ボタン */}
          <View style={styles.buttonRow}>
            {question.variables.map((v) => (
              <TouchableOpacity
                key={v.name}
                style={[styles.keyButton, { backgroundColor: colors.varButtonBg }]}
                onPress={() => handlePressToken(v.name)}
                accessibilityRole="button"
                accessibilityLabel={`変数 ${v.name}（${v.label}）を入力`}
              >
                <Text style={styles.varButtonText}>{v.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 演算子ボタン */}
          <View style={styles.buttonRow}>
            {OPERATORS.map((op) => (
              <TouchableOpacity
                key={op.value}
                style={[styles.keyButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => handlePressToken(op.value)}
                accessibilityRole="button"
                accessibilityLabel={`${op.display} を入力`}
              >
                <Text style={[styles.opButtonText, { color: colors.textPrimary }]}>{op.display}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 数字ボタン */}
          <View style={styles.buttonRow}>
            {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.keyButton, { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => handlePressToken(num)}
                accessibilityRole="button"
                accessibilityLabel={`${num} を入力`}
              >
                <Text style={[styles.numButtonText, { color: colors.textPrimary }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 操作ボタン */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.keyButton, { backgroundColor: colors.buttonSecondary, flex: 1 }]}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="式をクリア"
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>クリア</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyButton, { backgroundColor: colors.buttonSecondary, flex: 1 }]}
              onPress={handleBackspace}
              accessibilityRole="button"
              accessibilityLabel="最後のトークンを削除"
            >
              <Text style={[styles.backspaceButtonText, { color: colors.textSecondary }]}>⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyButton, styles.submitButton, { flex: 2 }, !formula && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!formula}
              accessibilityRole="button"
              accessibilityLabel="式を判定する"
              accessibilityState={{ disabled: !formula }}
            >
              <Text style={styles.submitButtonText}>判定</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 解説（回答後に表示） */}
      {answerState !== 'inputting' && (
        <View style={[
          styles.explanation,
          answerState === 'correct' ? styles.explanationCorrect : styles.explanationIncorrect,
        ]}>
          <Text style={[styles.explanationTitle, { color: colors.textPrimary }]}>
            {answerState === 'correct' ? '✓ 正解' : '✗ 不正解'}
          </Text>
          {answerState === 'incorrect' && (
            <Text style={styles.correctFormula}>
              正解例: {question.correctFormula.replace(/\*/g, '×').replace(/\//g, '÷')}
            </Text>
          )}
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{question.explanation}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 32 },

  bodyContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typeLabel: { fontSize: 11, color: '#FF9500', fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },

  variablesContainer: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  variablesTitle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  variableRow: { flexDirection: 'row', alignItems: 'center' },
  variableName: { fontSize: 16, fontWeight: '700', color: '#4A90E2', width: 20 },
  variableLabel: { fontSize: 14 },

  inputDisplay: {
    borderRadius: 10,
    padding: 14,
    minHeight: 56,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  inputDisplayCorrect: { borderColor: '#34C759', backgroundColor: '#f0fdf4' },
  inputDisplayIncorrect: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  inputText: { fontSize: 18, fontFamily: 'monospace' },

  errorText: { fontSize: 13, color: '#FF3B30', textAlign: 'center' },

  keypadContainer: { gap: 8 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  keyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  varButtonText: { fontSize: 18, fontWeight: '700', color: '#4A90E2' },
  opButtonText: { fontSize: 20 },
  numButtonText: { fontSize: 16, fontWeight: '600' },

  clearButtonText: { fontSize: 14 },
  backspaceButtonText: { fontSize: 20 },
  submitButton: { backgroundColor: '#4A90E2' },
  submitButtonDisabled: { backgroundColor: '#b0c8ef' },
  submitButtonText: { fontSize: 16, color: '#fff', fontWeight: '700' },

  explanation: { borderRadius: 12, padding: 16, gap: 8 },
  explanationCorrect: { backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: '#34C759' },
  explanationIncorrect: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  explanationTitle: { fontSize: 14, fontWeight: '700' },
  correctFormula: { fontSize: 14, color: '#4A90E2', fontFamily: 'monospace' },
  explanationText: { fontSize: 14, lineHeight: 22 },
});
