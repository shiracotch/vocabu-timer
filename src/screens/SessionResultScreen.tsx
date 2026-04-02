/**
 * セッション結果画面
 * 正答率と1問あたりの平均回答時間を表示する
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../types/navigation';
import { QuestionResult } from '../types';
import { fetchSessionResults } from '../db/database';
import { QUESTIONS } from '../data/questions';
import { getColors } from '../theme/colors';

type SessionResultNavProp = NativeStackNavigationProp<RootStackParamList, 'SessionResult'>;
type SessionResultRouteProp = RouteProp<RootStackParamList, 'SessionResult'>;

export default function SessionResultScreen() {
  const navigation = useNavigation<SessionResultNavProp>();
  const route = useRoute<SessionResultRouteProp>();
  const { sessionId } = route.params;
  const colors = getColors(useColorScheme());

  const [results, setResults] = useState<QuestionResult[]>([]);

  useEffect(() => {
    fetchSessionResults(sessionId).then(setResults);
  }, [sessionId]);

  const totalAnswered = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracyRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const avgSeconds =
    totalAnswered > 0
      ? results.reduce((sum, r) => sum + r.answerSeconds, 0) / totalAnswered
      : 0;

  // 問題IDから問題文の冒頭を取得する
  function getQuestionBody(questionId: string): string {
    const q = QUESTIONS.find((q) => q.id === questionId);
    if (!q) return questionId;
    return q.body.length > 40 ? q.body.slice(0, 40) + '…' : q.body;
  }

  if (totalAnswered === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>今回は問題を解けませんでした</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          accessibilityRole="button"
          accessibilityLabel="ホームへ戻る"
        >
          <Text style={styles.homeButtonText}>ホームへ戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* サマリー */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.accuracyValue]}>{accuracyRate}%</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>正答率</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{correctCount}/{totalAnswered}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>正解/解答数</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{avgSeconds.toFixed(1)}秒</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>平均回答時間</Text>
          </View>
        </View>
      </View>

      {/* 問題ごとの結果一覧 */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>問題ごとの結果</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.resultItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.resultMark, item.isCorrect ? styles.correct : styles.incorrect]}>
              {item.isCorrect ? '○' : '✗'}
            </Text>
            <View style={styles.resultBody}>
              <Text style={[styles.resultQuestionBody, { color: colors.textPrimary }]}>{getQuestionBody(item.questionId)}</Text>
              <Text style={[styles.resultTime, { color: colors.textTertiary }]}>{item.answerSeconds.toFixed(1)}秒</Text>
            </View>
          </View>
        )}
      />

      {/* ホームへ戻るボタン */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
        accessibilityRole="button"
        accessibilityLabel="ホームへ戻る"
      >
        <Text style={styles.homeButtonText}>ホームへ戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  emptyText: { fontSize: 16 },

  summaryCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  accuracyValue: { color: '#34C759' },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  summaryDivider: { width: 1, height: 40 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  resultMark: { fontSize: 20, fontWeight: '700', width: 24, textAlign: 'center' },
  correct: { color: '#34C759' },
  incorrect: { color: '#FF3B30' },
  resultBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultQuestionBody: { flex: 1, fontSize: 13, lineHeight: 18 },
  resultTime: { fontSize: 13, marginLeft: 8 },

  homeButton: {
    margin: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
