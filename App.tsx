/**
 * アプリのルートコンポーネント
 * DB初期化とナビゲーション設定を担当する
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initDatabase } from './src/db/database';
import { RootStackParamList } from './src/types/navigation';
import HomeScreen from './src/screens/HomeScreen';
import TimerSetupScreen from './src/screens/TimerSetupScreen';
import StudySessionScreen from './src/screens/StudySessionScreen';
import SessionResultScreen from './src/screens/SessionResultScreen';
import StatsScreen from './src/screens/StatsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // アプリ起動時にDBを初期化する
    initDatabase()
      .then(() => setDbReady(true))
      .catch((error) => setDbError(String(error)));
  }, []);

  if (!dbReady && !dbError) {
    return (
      <View style={styles.center}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>起動エラー: {dbError}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'vocabu-timer' }}
        />
        <Stack.Screen
          name="TimerSetup"
          component={TimerSetupScreen}
          options={{ title: '学習時間の設定' }}
        />
        <Stack.Screen
          name="StudySession"
          component={StudySessionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SessionResult"
          component={SessionResultScreen}
          options={{ title: '結果', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: '統計' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red' },
});
