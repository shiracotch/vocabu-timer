/**
 * ローカル通知ユーティリティ
 * タイマー完了時の通知権限取得と通知発行を担当する
 */
import * as Notifications from 'expo-notifications';

// 通知の表示設定（フォアグラウンド時もバナーとサウンドで表示する）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知権限をリクエストする
 * 初回のみダイアログが表示される。拒否された場合は何もしない。
 */
export async function requestNotificationPermission(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

/**
 * タイマー完了通知を即時発行する
 * バックグラウンド復帰時に「時間切れ」を知らせるために使用する
 */
export async function sendTimerCompleteNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'タイマー終了',
        body: '学習セッションが終了しました。結果を確認しましょう！',
      },
      trigger: null, // 即時発行
    });
  } catch {
    // 通知失敗はサイレントに無視する（メイン機能に影響させない）
  }
}
