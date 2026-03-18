/**
 * ホーム画面
 * 累計統計（正答率・平均回答時間）の表示と学習開始ボタンを担当する
 */
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchOverallStats } from '../db/database';
import { RootStackParamList } from '../types/navigation';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

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
    <View style={styles.container}>
      {/* 統計カード */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>累計成績</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accuracyRate !== null ? `${accuracyRate}%` : '―'}
            </Text>
            <Text style={styles.statLabel}>正答率</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalAnswered}</Text>
            <Text style={styles.statLabel}>解答数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatSeconds(avgAnswerSeconds)}</Text>
            <Text style={styles.statLabel}>平均回答時間</Text>
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
        style={styles.statsButton}
        onPress={() => navigation.navigate('Stats')}
      >
        <Text style={styles.statsButtonText}>統計を見る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
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
    color: '#999',
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
  statValue: { fontSize: 24, fontWeight: '700', color: '#333' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#eee' },

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
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statsButtonText: { fontSize: 16, color: '#555' },
});
