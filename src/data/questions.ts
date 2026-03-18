/**
 * プリセット問題データ
 * 基本情報技術者試験 科目A の頻出テーマをもとに一部改変した問題
 */
import { Question } from '../types';

export const QUESTIONS: Question[] = [
  // ─── 4択問題 ──────────────────────────────────────────────────────────────

  {
    id: 'q001',
    type: 'multiple_choice',
    body: 'OSI参照モデルにおいて、IPアドレスを使ったルーティングを担当する層はどれか。',
    choices: [
      { id: 'q001a', text: 'データリンク層', isCorrect: false },
      { id: 'q001b', text: 'ネットワーク層', isCorrect: true },
      { id: 'q001c', text: 'トランスポート層', isCorrect: false },
      { id: 'q001d', text: 'セッション層', isCorrect: false },
    ],
    explanation:
      'ネットワーク層（第3層）はIPアドレスを使って異なるネットワーク間の経路制御（ルーティング）を行う。データリンク層はMACアドレス、トランスポート層はポート番号でエンドツーエンドの通信を担当する。',
  },

  {
    id: 'q002',
    type: 'multiple_choice',
    body: '関係データベースにおいて、別のテーブルの主キーを参照する列を何というか。',
    choices: [
      { id: 'q002a', text: '候補キー', isCorrect: false },
      { id: 'q002b', text: '代替キー', isCorrect: false },
      { id: 'q002c', text: '外部キー', isCorrect: true },
      { id: 'q002d', text: '複合キー', isCorrect: false },
    ],
    explanation:
      '外部キー（Foreign Key）は他のテーブルの主キーを参照する列で、テーブル間のリレーションシップを定義する。参照整合性制約により、外部キーには参照先に存在する値しか入れられない。',
  },

  {
    id: 'q003',
    type: 'multiple_choice',
    body: '公開鍵暗号方式の説明として適切なものはどれか。',
    choices: [
      { id: 'q003a', text: '暗号化と復号に同じ鍵を使う', isCorrect: false },
      { id: 'q003b', text: '公開鍵で暗号化し、対応する秘密鍵で復号する', isCorrect: true },
      { id: 'q003c', text: '秘密鍵で暗号化し、対応する公開鍵で復号する', isCorrect: false },
      { id: 'q003d', text: '鍵を使わずに暗号化する', isCorrect: false },
    ],
    explanation:
      '公開鍵暗号方式では、公開鍵（誰でも使える）で暗号化し、対応する秘密鍵（本人のみが持つ）でのみ復号できる。送信者は受信者の公開鍵で暗号化するため、秘密鍵を渡す必要がなく安全に通信できる。なお秘密鍵で署名・公開鍵で検証するのはデジタル署名の仕組み。',
  },

  {
    id: 'q004',
    type: 'multiple_choice',
    body: 'SQLのSELECT文でグループ化した結果に条件を指定するために使うキーワードはどれか。',
    choices: [
      { id: 'q004a', text: 'WHERE', isCorrect: false },
      { id: 'q004b', text: 'HAVING', isCorrect: true },
      { id: 'q004c', text: 'ORDER BY', isCorrect: false },
      { id: 'q004d', text: 'GROUP BY', isCorrect: false },
    ],
    explanation:
      'GROUP BYでグループ化した結果に対して条件を絞り込むにはHAVINGを使う。WHEREはグループ化前の行に対して条件を指定する。例：SELECT 部署, COUNT(*) FROM 社員 GROUP BY 部署 HAVING COUNT(*) >= 5',
  },

  {
    id: 'q005',
    type: 'multiple_choice',
    body: 'CPUのパイプライン処理の説明として正しいものはどれか。',
    choices: [
      { id: 'q005a', text: '複数のCPUコアが同時に異なる命令を実行する', isCorrect: false },
      { id: 'q005b', text: '1つの命令を複数の段階に分け、各段階を重ねて実行することで処理を高速化する', isCorrect: true },
      { id: 'q005c', text: 'キャッシュメモリを使って主記憶へのアクセスを減らす', isCorrect: false },
      { id: 'q005d', text: '命令の実行順序を変えてデータの依存関係を解消する', isCorrect: false },
    ],
    explanation:
      'パイプライン処理は命令をフェッチ・デコード・実行・ライトバックなどの段階に分け、各段階を並行して処理することでスループットを向上させる技術。流れ作業（ベルトコンベア）に例えられる。',
  },

  {
    id: 'q006',
    type: 'multiple_choice',
    body: 'ハッシュ関数の特性として正しいものはどれか。',
    choices: [
      { id: 'q006a', text: 'ハッシュ値から元のデータを復元できる', isCorrect: false },
      { id: 'q006b', text: '同じデータからは常に同じハッシュ値が得られる', isCorrect: true },
      { id: 'q006c', text: 'データの長さによってハッシュ値の長さが変わる', isCorrect: false },
      { id: 'q006d', text: '異なるデータから同じハッシュ値は絶対に生じない', isCorrect: false },
    ],
    explanation:
      'ハッシュ関数は同じ入力から必ず同じハッシュ値（一方向性）を生成するが、ハッシュ値から元データを復元することはできない（一方向性）。また異なる入力から同じハッシュ値が生じること（衝突）はゼロではないが、暗号学的ハッシュ関数はこれを極めて困難にしている。',
  },

  {
    id: 'q007',
    type: 'multiple_choice',
    body: 'SQLインジェクション攻撃への対策として最も適切なものはどれか。',
    choices: [
      { id: 'q007a', text: 'HTTPSを使って通信を暗号化する', isCorrect: false },
      { id: 'q007b', text: 'ファイアウォールでアクセスを制限する', isCorrect: false },
      { id: 'q007c', text: 'プレースホルダ（バインド変数）を使ってSQLを構築する', isCorrect: true },
      { id: 'q007d', text: 'ログイン試行回数を制限する', isCorrect: false },
    ],
    explanation:
      'SQLインジェクションはユーザー入力に悪意あるSQL文を埋め込む攻撃。プレースホルダ（バインド変数）を使うことで、入力値をSQLの命令として解釈させず、データとして扱うことができる。入力値のエスケープ処理も有効だが、プレースホルダの使用が最も確実な対策。',
  },

  {
    id: 'q008',
    type: 'multiple_choice',
    body: 'プロセスのデッドロックが発生する条件として誤っているものはどれか。',
    choices: [
      { id: 'q008a', text: '相互排他：資源は一度に1つのプロセスしか使用できない', isCorrect: false },
      { id: 'q008b', text: '占有と待機：資源を保持しながら別の資源を待つ', isCorrect: false },
      { id: 'q008c', text: 'プリエンプション：保持している資源を強制的に奪える', isCorrect: true },
      { id: 'q008d', text: '循環待機：プロセスが循環する形で資源を待ち合っている', isCorrect: false },
    ],
    explanation:
      'デッドロックの4条件は①相互排他②占有と待機③非プリエンプション（資源を強制的に奪えない）④循環待機。「プリエンプション（強制奪取できる）」はデッドロックを防ぐ条件であり、デッドロック発生条件ではない。',
  },

  // ─── 計算式問題 ────────────────────────────────────────────────────────────

  {
    id: 'q009',
    type: 'formula',
    body: 'あるシステムの平均故障間隔が x 時間、平均修復時間が y 時間であるとき、このシステムの稼働率を表す式を入力してください。',
    variables: [
      { name: 'x', label: '平均故障間隔（MTBF）' },
      { name: 'y', label: '平均修復時間（MTTR）' },
    ],
    correctFormula: 'x / (x + y)',
    explanation:
      '稼働率 = MTBF ÷ (MTBF + MTTR)。MTBFは平均故障間隔（Mean Time Between Failures）、MTTRは平均修復時間（Mean Time To Repair）。稼働率は0〜1の値をとり、1に近いほど信頼性が高い。',
  },

  {
    id: 'q010',
    type: 'formula',
    body: 'キャッシュメモリのヒット率が a、キャッシュアクセス時間が x ナノ秒、主記憶アクセス時間が y ナノ秒のとき、実効メモリアクセス時間（ナノ秒）を表す式を入力してください。',
    variables: [
      { name: 'a', label: 'キャッシュヒット率（0〜1）' },
      { name: 'x', label: 'キャッシュアクセス時間（ns）' },
      { name: 'y', label: '主記憶アクセス時間（ns）' },
    ],
    correctFormula: 'a * x + (1 - a) * y',
    explanation:
      '実効アクセス時間 = ヒット率 × キャッシュアクセス時間 + (1 - ヒット率) × 主記憶アクセス時間。ヒット時はキャッシュから、ミス時は主記憶からデータを取得する加重平均。ヒット率が高いほど実効アクセス時間は短くなる。',
  },

  {
    id: 'q011',
    type: 'formula',
    body: '稼働率 x の装置Aと稼働率 y の装置Bを並列に接続したシステム全体の稼働率を表す式を入力してください。',
    variables: [
      { name: 'x', label: '装置Aの稼働率（0〜1）' },
      { name: 'y', label: '装置Bの稼働率（0〜1）' },
    ],
    correctFormula: '1 - (1 - x) * (1 - y)',
    explanation:
      '並列システムの稼働率 = 1 - (1 - 装置Aの稼働率) × (1 - 装置Bの稼働率)。両方が故障する確率（(1-x)(1-y)）を全体から引いた値。どちらか一方が動いていればシステムが稼働するため、直列より稼働率が高くなる。',
  },
];
