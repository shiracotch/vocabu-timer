/**
 * 4択問題コンポーネント
 * 選択肢をタップすると正誤判定し、解説を表示する
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

import { MultipleChoiceQuestion } from '../types';

type Props = {
  question: MultipleChoiceQuestion;
  onAnswer: (isCorrect: boolean) => void;
};

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function MultipleChoiceQuestionView({ question, onAnswer }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');

  function handleSelect(choiceId: string) {
    if (answerState !== 'unanswered') return;

    const selected = question.choices.find((c) => c.id === choiceId);
    if (!selected) return;

    setSelectedId(choiceId);
    setAnswerState(selected.isCorrect ? 'correct' : 'incorrect');
    onAnswer(selected.isCorrect);
  }

  function getChoiceStyle(choiceId: string) {
    if (answerState === 'unanswered') return styles.choice;
    const choice = question.choices.find((c) => c.id === choiceId);
    if (choice?.isCorrect) return [styles.choice, styles.choiceCorrect];
    if (choiceId === selectedId) return [styles.choice, styles.choiceIncorrect];
    return [styles.choice, styles.choiceDimmed];
  }

  function getChoiceTextStyle(choiceId: string) {
    if (answerState === 'unanswered') return styles.choiceText;
    const choice = question.choices.find((c) => c.id === choiceId);
    if (choice?.isCorrect || choiceId === selectedId) return [styles.choiceText, styles.choiceTextHighlight];
    return [styles.choiceText, styles.choiceTextDimmed];
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 問題文 */}
      <View style={styles.bodyContainer}>
        <Text style={styles.typeLabel}>4択問題</Text>
        <Text style={styles.body}>{question.body}</Text>
      </View>

      {/* 選択肢 */}
      <View style={styles.choicesContainer}>
        {question.choices.map((choice, index) => (
          <TouchableOpacity
            key={choice.id}
            style={getChoiceStyle(choice.id)}
            onPress={() => handleSelect(choice.id)}
            disabled={answerState !== 'unanswered'}
          >
            <Text style={styles.choiceLabel}>{['ア', 'イ', 'ウ', 'エ'][index]}</Text>
            <Text style={getChoiceTextStyle(choice.id)}>{choice.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 解説（回答後に表示） */}
      {answerState !== 'unanswered' && (
        <View style={[styles.explanation, answerState === 'correct' ? styles.explanationCorrect : styles.explanationIncorrect]}>
          <Text style={styles.explanationTitle}>
            {answerState === 'correct' ? '✓ 正解' : '✗ 不正解'}
          </Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },

  bodyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typeLabel: { fontSize: 11, color: '#4A90E2', fontWeight: '700' },
  body: { fontSize: 16, color: '#333', lineHeight: 24 },

  choicesContainer: { gap: 10 },
  choice: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  choiceCorrect: { borderColor: '#34C759', backgroundColor: '#f0fdf4' },
  choiceIncorrect: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  choiceDimmed: { opacity: 0.5 },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A90E2',
    width: 20,
    textAlign: 'center',
  },
  choiceText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 },
  choiceTextHighlight: { fontWeight: '600' },
  choiceTextDimmed: { color: '#aaa' },

  explanation: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  explanationCorrect: { backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: '#34C759' },
  explanationIncorrect: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  explanationText: { fontSize: 14, color: '#555', lineHeight: 22 },
});
