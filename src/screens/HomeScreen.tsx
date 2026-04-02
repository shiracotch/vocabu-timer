/**
 * ホーム画面
 * 累計統計（正答率・平均回答時間）の表示と学習開始ボタンを担当する
 */
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchOverallStats } from '../db/database';
import { RootStackParamList } from '../types/navigation';
import { getColors } from '../theme/colors';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const colors = getColors(useColorScheme());

  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [avgAnswerSeconds, setAvgAnswerSeconds] = useState(0);

  // 画面フォーカス時に統計を再取得する
  useFocusEffect(
    useCallback(() => {
      fetchOverallStats().then((stats) => {
        setTotalAnswered(stats.totalAnswered);
        setCorrectCount(stats.correctCount);
        setAvgAnswerSeconds(stats.avgAnswerSeconds);
      });
    }, [])
  );

  // 正答率を計算する（回答なしの場合は表示しない）
  const accuracyRate =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null;

  // 秒を「X.X秒」形式にフォーマットする
  const formatSeconds = (sec: number) =>
    sec > 0 ? `${sec.toFixed(1)}秒` : '―';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 統計カード */}
      <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.textTertiary }]}>累計成績</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {accuracyRate !== null ? `${accuracyRate}%` : '―'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>正答率</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalAnswered}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>解答数</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatSeconds(avgAnswerSeconds)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>平均回答時間</Text>
          </View>
        </View>
      </View>

      {/* 学習開始ボタン */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('TimerSetup')}
      >
        <Text style={styles.startButtonText}>学習開始</Text>
      </TouchableOpacity>

      {/* 統計詳細ボタン */}
      <TouchableOpacity
        style={[styles.statsButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('Stats')}
      >
        <Text style={[styles.statsButtonText, { color: colors.textSecondary }]}>統計を見る</Text>
      </TouchableOpacity>

      {/* 法的情報リンク */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
          <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>プライバシーポリシー</Text>
        </TouchableOpacity>
        <Text style={[styles.legalSeparator, { color: colors.divider }]}>｜</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
          <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>利用規約</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 40 },

  startButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { fontSize: 20, color: '#fff', fontWeight: '700' },

  statsButton: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statsButtonText: { fontSize: 16 },

  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  legalLinkText: { fontSize: 12 },
  legalSeparator: { fontSize: 12, marginHorizontal: 6 },
});
