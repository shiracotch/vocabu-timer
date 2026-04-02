/**
 * ライト・ダークモード用カラーパレット
 * 各画面・コンポーネントで getColors(colorScheme) を呼んで使用する
 */
import { ColorSchemeName } from 'react-native';

export type AppColors = {
  /** 画面背景 */
  background: string;
  /** カード・モーダル背景 */
  surface: string;
  /** やや異なるサブ背景（変数欄・数字ボタンなど） */
  surfaceSubtle: string;
  /** メインテキスト */
  textPrimary: string;
  /** セカンダリテキスト */
  textSecondary: string;
  /** ラベル・ヒント用テキスト */
  textTertiary: string;
  /** 非常に薄いテキスト（法的リンクなど） */
  textMuted: string;
  /** ボーダー */
  border: string;
  /** 仕切り線 */
  divider: string;
  /** クリア・バックスペースなどのセカンダリボタン背景 */
  buttonSecondary: string;
  /** 計算式問題の変数ボタン背景 */
  varButtonBg: string;
  /** 正解時の背景 */
  successBg: string;
  /** 不正解時の背景 */
  errorBg: string;
};

const light: AppColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceSubtle: '#f8f8f8',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textMuted: '#aaaaaa',
  border: '#e0e0e0',
  divider: '#eeeeee',
  buttonSecondary: '#f0f0f0',
  varButtonBg: '#EAF2FD',
  successBg: '#f0fdf4',
  errorBg: '#fff5f5',
};

const dark: AppColors = {
  background: '#1c1c1e',
  surface: '#2c2c2e',
  surfaceSubtle: '#3a3a3c',
  textPrimary: '#f0f0f0',
  textSecondary: '#aeaeb2',
  textTertiary: '#8e8e93',
  textMuted: '#636366',
  border: '#48484a',
  divider: '#48484a',
  buttonSecondary: '#3a3a3c',
  varButtonBg: '#1a2e4a',
  successBg: '#0d2e15',
  errorBg: '#2e0d0d',
};

/** カラースキームに応じたカラーセットを返す */
export function getColors(scheme: ColorSchemeName): AppColors {
  return scheme === 'dark' ? dark : light;
}
