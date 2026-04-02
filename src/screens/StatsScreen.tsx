/**
 * 統計画面
 * 累計の正答率と平均回答時間を表示する
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchOverallStats } from '../db/database';
import { RootStackParamList } from '../types/navigation';
import { getColors } from '../theme/colors';

type StatsNavProp = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

export default function StatsScreen() {
  const navigation = useNavigation<StatsNavProp>();
  const colors = getColors(useColorScheme());
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [avgAnswerSeconds, setAvgAnswerSeconds] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchOverallStats().then((stats) => {
        setTotalAnswered(stats.totalAnswered);
        setCorrectCount(stats.correctCount);
        setAvgAnswerSeconds(stats.avgAnswerSeconds);
      });
    }, [])
  );

  const accuracyRate =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null;
  const incorrectCount = totalAnswered - correctCount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {totalAnswered === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>まだ学習記録がありません</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('TimerSetup')}
            accessibilityRole="button"
            accessibilityLabel="学習を始める"
            accessibilityHint="タイマー設定画面へ移動します"
          >
            <Text style={styles.startButtonText}>学習を始める</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>累計成績</Text>
            <Text style={styles.accuracyText}>
              {accuracyRate !== null ? `${accuracyRate}%` : '―'}
            </Text>
            <Text style={[styles.accuracyLabel, { color: colors.textTertiary }]}>正答率</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, styles.cardSmall, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalAnswered}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>総解答数</Text>
            </View>
            <View style={[styles.card, styles.cardSmall, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, styles.correctValue]}>{correctCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>正解数</Text>
            </View>
            <View style={[styles.card, styles.cardSmall, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, styles.incorrectValue]}>{incorrectCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>不正解数</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{avgAnswerSeconds.toFixed(1)}秒</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>1問あたりの平均回答時間</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16 },
  startButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },

  card: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  cardSmall: { flex: 1 },
  cardTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },

  row: { flexDirection: 'row', gap: 12 },

  accuracyText: { fontSize: 52, fontWeight: '700', color: '#34C759' },
  accuracyLabel: { fontSize: 13 },

  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  correctValue: { color: '#34C759' },
  incorrectValue: { color: '#FF3B30' },
});
