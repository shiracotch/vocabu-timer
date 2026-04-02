/**
 * 法的情報画面
 * プライバシーポリシーまたは利用規約をアプリ内テキストで表示する
 */
import React from 'react';
import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../types/navigation';
import { getColors } from '../theme/colors';

type LegalRouteProp = RouteProp<RootStackParamList, 'Legal'>;

/** プライバシーポリシー本文 */
const PRIVACY_POLICY = `最終更新日：2026年4月2日

vocabu-timer（以下「本アプリ」）は、AstralStudy が提供する基本情報技術者試験 科目A 対策アプリです。

■ 収集する情報
本アプリは個人を特定できる情報を一切収集しません。
学習セッションの結果（正答数・回答時間）はお使いの端末内にのみ保存され、外部サーバーへの送信は行いません。

■ 第三者へのデータ提供
収集したデータを第三者に販売・提供・開示することはありません。

■ データの保存場所
すべてのデータはお使いの端末のローカルストレージ（SQLite）に保存されます。アプリを削除するとデータも削除されます。

■ 広告・トラッキング
本アプリは広告を表示せず、行動トラッキングも行いません。

■ お問い合わせ
本ポリシーに関するお問い合わせは、App Store のサポートページよりご連絡ください。`;

/** 利用規約本文 */
const TERMS_OF_SERVICE = `最終更新日：2026年4月2日

本利用規約（以下「本規約」）は、AstralStudy が提供する vocabu-timer（以下「本アプリ」）の利用条件を定めるものです。

■ 利用条件
本アプリは個人の学習目的でのみ利用できます。

■ 禁止事項
以下の行為を禁止します。
・本アプリのリバースエンジニアリング・改ざん・再配布
・商業目的での利用
・法令または公序良俗に反する利用

■ 免責事項
本アプリに収録された問題は著作権に配慮した改変を加えた練習問題です。実際の試験問題の正確な再現を保証するものではありません。本アプリの利用により生じた損害について、開発者は責任を負いません。

■ 知的財産権
本アプリのコードおよびコンテンツに関する知的財産権は開発者に帰属します。

■ 規約の変更
本規約は予告なく変更される場合があります。変更後も本アプリを利用し続けた場合、変更に同意したものとみなします。

■ お問い合わせ
本規約に関するお問い合わせは、App Store のサポートページよりご連絡ください。`;

export default function LegalScreen() {
  const route = useRoute<LegalRouteProp>();
  const colors = getColors(useColorScheme());
  const { type } = route.params;

  const content = type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  body: { fontSize: 14, lineHeight: 22 },
});
