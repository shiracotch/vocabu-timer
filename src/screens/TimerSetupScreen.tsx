/**
 * タイマー設定画面
 * 学習時間（分）を選択して学習セッションを開始する
 * デフォルト25分、1〜60分の範囲で変更可能
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';

type TimerSetupNavProp = NativeStackNavigationProp<RootStackParamList, 'TimerSetup'>;

// 分の最小・最大・デフォルト値
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const DEFAULT_MINUTES = 25;

// クイック選択用のプリセット値（分）
const PRESET_MINUTES = [5, 10, 15, 25, 30, 45, 60];

export default function TimerSetupScreen() {
  const navigation = useNavigation<TimerSetupNavProp>();
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);

  function handleDecrement() {
    setMinutes((prev) => Math.max(MIN_MINUTES, prev - 1));
  }

  function handleIncrement() {
    setMinutes((prev) => Math.min(MAX_MINUTES, prev + 1));
  }

  function handleStart() {
    navigation.navigate('StudySession', { durationSeconds: minutes * 60 });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>学習時間を設定</Text>

      {/* 時間カウンター */}
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, minutes <= MIN_MINUTES && styles.counterButtonDisabled]}
          onPress={handleDecrement}
          disabled={minutes <= MIN_MINUTES}
        >
          <Text style={styles.counterButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.timeDisplay}>
          <Text style={styles.timeValue}>{minutes}</Text>
          <Text style={styles.timeUnit}>分</Text>
        </View>

        <TouchableOpacity
          style={[styles.counterButton, minutes >= MAX_MINUTES && styles.counterButtonDisabled]}
          onPress={handleIncrement}
          disabled={minutes >= MAX_MINUTES}
        >
          <Text style={styles.counterButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* クイック選択 */}
      <View style={styles.presetContainer}>
        {PRESET_MINUTES.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.presetButton, minutes === preset && styles.presetButtonActive]}
            onPress={() => setMinutes(preset)}
          >
            <Text
              style={[styles.presetButtonText, minutes === preset && styles.presetButtonTextActive]}
            >
              {preset}分
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 開始ボタン */}
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>開始</Text>
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
    gap: 32,
  },
  label: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },

  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  counterButtonDisabled: { backgroundColor: '#ccc' },
  counterButtonText: { fontSize: 28, color: '#fff', fontWeight: '700' },

  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  timeValue: { fontSize: 72, fontWeight: '700', color: '#333', lineHeight: 80 },
  timeUnit: { fontSize: 24, color: '#666', paddingBottom: 10 },

  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  presetButtonText: { fontSize: 14, color: '#555' },
  presetButtonTextActive: { color: '#fff', fontWeight: '600' },

  startButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
