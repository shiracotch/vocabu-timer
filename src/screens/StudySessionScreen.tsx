/**
 * 学習セッション画面
 * ポモドーロタイマーで問題をランダムに出題し、結果を保存する
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../types/navigation';
import { Question } from '../types';
import { QUESTIONS } from '../data/questions';
import { saveStudySession } from '../db/database';
import MultipleChoiceQuestionView from '../components/MultipleChoiceQuestion';
import FormulaQuestionView from '../components/FormulaQuestion';
import { getColors } from '../theme/colors';

type StudySessionNavProp = NativeStackNavigationProp<RootStackParamList, 'StudySession'>;
type StudySessionRouteProp = RouteProp<RootStackParamList, 'StudySession'>;

/** 1問ごとの回答記録 */
type ResultRecord = {
  questionId: string;
  isCorrect: boolean;
  answerSeconds: number;
};

export default function StudySessionScreen() {
  const navigation = useNavigation<StudySessionNavProp>();
  const route = useRoute<StudySessionRouteProp>();
  const { durationSeconds } = route.params;
  const colors = getColors(useColorScheme());

  // タイマー残り時間（表示用state + 終了判定用ref）
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const remainingSecondsRef = useRef(durationSeconds);
  // シャッフルされた問題リスト（無限ループのためにインデックスで管理）
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // 現在の問題に答えたかどうか
  const [hasAnswered, setHasAnswered] = useState(false);
  // 回答記録
  const resultsRef = useRef<ResultRecord[]>([]);
  // 現在の問題の開始時刻
  const questionStartRef = useRef<number>(Date.now());
  // タイマーのintervalID
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // セッション終了済みフラグ（二重実行防止）
  const isFinishedRef = useRef(false);
  // バックグラウンド移行時刻（復帰時の差分補正に使用）
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    // 問題をシャッフルしてセットする
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    questionStartRef.current = Date.now();

    // カウントダウンタイマーを開始する
    // ※タイマーコールバック内でfinishSessionを直接呼ぶとスタールクロージャになるため、
    //   refで残り時間を管理して時間切れを検知する
    timerRef.current = setInterval(() => {
      remainingSecondsRef.current -= 1;
      setRemainingSeconds(remainingSecondsRef.current);

      if (remainingSecondsRef.current <= 0) {
        stopTimer();
        // タイマー終了はフラグ経由でuseEffectから処理する
      }
    }, 1000);

    return () => stopTimer();
  }, []);

  // タイマーが0になったらセッションを終了する
  useEffect(() => {
    if (remainingSeconds <= 0) {
      finishSession();
    }
  }, [remainingSeconds]);

  // バックグラウンド中の経過時間をタイマーに反映する
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // バックグラウンド移行時刻を記録する
        backgroundedAtRef.current = Date.now();
      } else if (nextState === 'active' && backgroundedAtRef.current !== null) {
        // フォアグラウンド復帰時に差分を残り時間から引く
        const elapsedMs = Date.now() - backgroundedAtRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        backgroundedAtRef.current = null;

        remainingSecondsRef.current = Math.max(0, remainingSecondsRef.current - elapsedSec);
        setRemainingSeconds(remainingSecondsRef.current);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Androidのバックボタンで中断できないようにする
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleExit();
        return true;
      });
      return () => subscription.remove();
    }, [hasAnswered])
  );

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  /** 回答を記録する */
  function handleAnswer(isCorrect: boolean) {
    const answerSeconds = (Date.now() - questionStartRef.current) / 1000;
    if (questions[currentIndex]) {
      resultsRef.current.push({
        questionId: questions[currentIndex].id,
        isCorrect,
        answerSeconds,
      });
    }
    setHasAnswered(true);
  }

  /** 次の問題へ進む */
  function handleNext() {
    setHasAnswered(false);
    questionStartRef.current = Date.now();

    // 全問解いたらシャッフルして最初に戻る
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  /** セッションを終了してDBに保存し結果画面へ遷移する */
  async function finishSession() {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    stopTimer();

    // refから経過時間を取得することでスタールクロージャを避ける
    const elapsed = durationSeconds - remainingSecondsRef.current;
    try {
      const session = await saveStudySession(elapsed, resultsRef.current);
      navigation.replace('SessionResult', { sessionId: session.id });
    } catch (error) {
      // 保存失敗時はエラーを表示してホームへ戻る
      Alert.alert('エラー', `結果の保存に失敗しました: ${String(error)}`, [
        { text: 'ホームへ戻る', onPress: () => navigation.navigate('Home') },
      ]);
    }
  }

  /** 途中終了の確認ダイアログ */
  function handleExit() {
    Alert.alert('学習を終了しますか？', '今回の結果は保存されます。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '終了する',
        style: 'destructive',
        onPress: () => finishSession(),
      },
    ]);
  }

  /** 残り時間を MM:SS 形式にフォーマットする */
  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.timer, { color: colors.textPrimary }, remainingSeconds <= 30 && styles.timerWarning]}>
          {formatTime(remainingSeconds)}
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>{resultsRef.current.length}問回答済み</Text>
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: colors.buttonSecondary }]}
            onPress={handleExit}
          >
            <Text style={[styles.exitButtonText, { color: colors.textSecondary }]}>終了</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 問題表示エリア */}
      <View style={styles.questionArea}>
        {currentQuestion?.type === 'multiple_choice' && (
          <MultipleChoiceQuestionView
            key={currentQuestion.id + currentIndex}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        )}
        {currentQuestion?.type === 'formula' && (
          <FormulaQuestionView
            key={currentQuestion.id + currentIndex}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        )}
      </View>

      {/* 次の問題ボタン（回答後に表示） */}
      {hasAnswered && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>次の問題 →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timer: { fontSize: 36, fontWeight: '700' },
  timerWarning: { color: '#FF3B30' },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  progressText: { fontSize: 12 },
  exitButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  exitButtonText: { fontSize: 14 },

  questionArea: { flex: 1 },

  nextButton: {
    margin: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
