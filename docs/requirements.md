# Studyログ - 学習管理アプリ要件定義書

## プロジェクト概要

小学6年生の夏期講習学習管理を目的とした、シンプルな学習記録・共有アプリケーション

**対象ユーザー**: 小学6年生（生徒）、保護者、指導者  
**使用期間**: 2025年7月21日〜8月6日（17日間）  
**開発期間**: 1日  
**技術スタック**: React + TypeScript + Tailwind CSS + Supabase  
**プロジェクト名**: studylog-next

## 機能要件

### 1. 学習記録機能（生徒用）- 最優先

#### 学習記録入力画面
- **科目選択**: ドロップダウンまたはボタン選択（適性、国語、算数、理科、社会）
- **問題数入力**: 数値入力フィールド（1-100の範囲）
- **正答数入力**: 数値入力フィールド（問題数以下の制限）
- **感情評価**: 3つのアイコンボタン
  - 😊 よくできた
  - 😐 普通
  - 😞 難しかった
- **コメント入力**: テキストエリア（任意、300文字以内）
- **保存ボタン**: 入力内容をデータベースに保存

#### 入力フォームの仕様
```
今日の学習記録

科目: [ドロップダウン: 適性/国語/算数/理科/社会]
問題数: [____] 問
正答数: [____] 問
今日の気持ち: [😊] [😐] [😞]
一言コメント（任意）:
[テキストエリア]

[保存する]
```

### 2. 進捗表示機能 - 重要

#### 学習状況ダッシュボード
- **今日の記録**: 本日入力した全科目の一覧表示
- **継続日数カウンター**: 「頑張り日数: X/17日」の大きな表示
- **科目別累積正答率**: 
  - 科目ごとの正答率を横棒グラフで表示
  - 例: 国語 85% ████████▌
  - 例: 算数 70% ███████
- **最近の感情推移**: 直近5日間の感情アイコン履歴

#### ダッシュボードレイアウト
```
継続日数: 7/17日 🔥

今日の記録:
- 国語: 20問中18問正解 😊
- 算数: 15問中12問正解 😐

科目別成績:
国語 ████████▌ 85%
算数 ███████   70%
理科 ██████    60%
社会 ████████  80%

最近の調子: 😊😐😊😊😞
```

### 3. フィードバック機能 - 重要

#### 応援・フィードバック画面（保護者・指導者用）
- **アイコンリアクション**: ワンクリックで応援
  - 👏 すごい！
  - 👍 いいね！
  - 💪 頑張って！
- **コメント機能**: 簡単なメッセージ送信
- **フィードバック履歴**: 過去の応援履歴表示

#### フィードバック画面レイアウト
```
りたかくんの今日の学習

国語: 20問中18問正解 😊
「漢字が難しかったけど頑張った」

応援する: [👏] [👍] [💪]

コメント:
[テキストエリア]
[送信]

これまでの応援:
- お母さん: 👏 よく頑張ったね！
- 先生: 👍 順調だね
```

### 4. ユーザー切り替え機能

#### シンプル認証
- **3つのボタン**: 生徒/保護者/指導者
- **パスワード不要**: ボタンクリックで役割切り替え
- **画面表示**: 現在の役割を画面上部に表示

```
[生徒として見る] [保護者として見る] [指導者として見る]

現在: 生徒モード
```

## 非機能要件

### レスポンシブ対応
- **生徒用**: iPad縦持ち最適化（768px幅）
- **保護者用**: スマートフォン対応（375px幅）
- **共通**: タッチ操作しやすい大きなボタン（44px以上）

### データ管理
- **リアルタイム更新**: Supabaseのリアルタイム機能使用
- **データ永続化**: ブラウザリロード後もデータ保持
- **バックアップ**: Supabaseによる自動バックアップ

### パフォーマンス
- **高速表示**: 3秒以内の画面表示
- **軽量**: 不要なライブラリは使用しない
- **オフライン対応**: 不要（常時オンライン前提）

## 技術仕様

### フロントエンド
```json
{
  "framework": "React 19",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "state": "useState",
  "build": "Vite"
}
```

### バックエンド
```json
{
  "database": "Supabase PostgreSQL",
  "auth": "Custom simple auth",
  "realtime": "Supabase real-time",
  "hosting": "Vercel"
}
```

### データベーススキーマ
```sql
-- 学習記録
study_records (
  id: serial,
  date: date,
  subject: varchar(10),
  questions_total: integer,
  questions_correct: integer,
  emotion: varchar(10), -- 'good', 'normal', 'hard'
  comment: text,
  created_at: timestamp
);

-- フィードバック
feedbacks (
  id: serial,
  record_id: integer,
  sender_type: varchar(20), -- 'parent', 'teacher'
  reaction_type: varchar(10), -- 'clap', 'thumbs', 'muscle'
  message: text,
  created_at: timestamp
);
```

## UI/UXガイドライン

### カラーパレット
- **プライマリ**: Blue-500 (#3B82F6)
- **成功**: Green-500 (#10B981)
- **警告**: Yellow-500 (#F59E0B)
- **エラー**: Red-500 (#EF4444)
- **背景**: Gray-50 (#F9FAFB)

### タイポグラフィ
- **見出し**: text-2xl font-bold
- **本文**: text-base
- **小文字**: text-sm text-gray-600

### コンポーネント仕様

#### ボタン
```css
/* 基本ボタン */
.btn-primary {
  @apply bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-medium;
}

/* アイコンボタン（感情・応援用） */
.btn-icon {
  @apply text-4xl p-4 rounded-full hover:bg-gray-100 transition-colors;
}
```

#### 入力フィールド
```css
.input-field {
  @apply border border-gray-300 rounded-lg px-4 py-3 text-lg w-full;
}
```

#### カード
```css
.card {
  @apply bg-white rounded-lg shadow-sm p-6 mb-4;
}
```

## 画面遷移図

```
[ホーム画面]
├── [ユーザー選択] → [生徒モード] → [学習記録入力]
│                                  └── [進捗確認]
├── [保護者モード] → [進捗確認] → [フィードバック送信]
└── [指導者モード] → [進捗確認] → [フィードバック送信]
```

## 開発優先順位

### Phase 1 (最優先 - 4時間)
1. 学習記録入力画面
2. 基本的な進捗表示
3. Supabase連携

### Phase 2 (重要 - 3時間)
1. フィードバック機能
2. ユーザー切り替え
3. レスポンシブ対応

### Phase 3 (時間があれば - 1時間)
1. UI改善
2. アニメーション追加
3. エラーハンドリング

## 成功基準

### 機能面
- [ ] 学習記録が正常に保存・表示される
- [ ] 3つの役割で適切な画面表示ができる
- [ ] フィードバックがリアルタイムで反映される
- [ ] iPad・スマホで使いやすい操作性

### 品質面
- [ ] TypeScriptエラーがない
- [ ] レスポンシブデザインが適用されている
- [ ] 3秒以内の画面表示速度
- [ ] 直感的で分かりやすいUI

### 運用面
- [ ] 7月21日までにデプロイ完了
- [ ] 夏期講習17日間の継続使用可能
- [ ] データの正確な記録・集計

この要件定義書に基づいて、v0でのReactアプリケーション開発を開始してください。

## 📊 要件定義書に基づくテーブル設計完了

要件定義書を詳細に分析し、包括的なデータベーススキーマを設計しました。`docs/database-schema.sql`に完全なスキーマを作成しました。

### 🏗️ **設計のハイライト**

## 1️⃣ **学習記録テーブル (study_records)**
```sql
CREATE TABLE study_records (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject VARCHAR(20) NOT NULL CHECK (subject IN ('aptitude', 'japanese', 'math', 'science', 'social')),
  questions_total INTEGER NOT NULL CHECK (questions_total >= 1 AND questions_total <= 100),
  questions_correct INTEGER NOT NULL CHECK (questions_correct >= 0),
  emotion VARCHAR(10) NOT NULL CHECK (emotion IN ('good', 'normal', 'hard')),
  comment TEXT CHECK (LENGTH(comment) <= 300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_correct_answers CHECK (questions_correct <= questions_total)
);
```

**特徴:**
- ✅ 要件定義の5科目（適性、国語、算数、理科、社会）に対応
- ✅ 問題数1-100、正答数の制約
- ✅ 感情評価（good、normal、hard）
- ✅ コメント300文字制限

## 2️⃣ **フィードバックテーブル (feedbacks)**
```sql
CREATE TABLE feedbacks (
  id BIGSERIAL PRIMARY KEY,
  record_id BIGINT NOT NULL REFERENCES study_records(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  reaction_type VARCHAR(10) CHECK (reaction_type IN ('clap', 'thumbs', 'muscle')),
  message TEXT CHECK (LENGTH(message) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**特徴:**
- ✅ 保護者・指導者の区別
- ✅ 3種類のリアクション（👏👍💪）
- ✅ リアクションとメッセージの柔軟な組み合わせ

## 3️⃣ **追加機能**

### パフォーマンス最適化
- 📈 適切なインデックス設定
- 🔄 自動更新トリガー
- 📊 統計用ビュー作成

### データ分析サポート
- 📋 **study_records_with_feedback**: 学習記録とフィードバック結合
- 📈 **subject_statistics**: 科目別統計
- 📅 **daily_statistics**: 日別統計

### 便利な関数
- 🔥 **get_study_streak()**: 継続学習日数計算
- 📊 **get_subject_accuracy()**: 科目別正答率取得

## 4️⃣ **セキュリティ (RLS)**
```sql
-- シンプル認証に対応した公開アクセス許可
CREATE POLICY "public_can_read_study_records" 
ON study_records FOR SELECT TO anon, authenticated USING (true);
```

## 5️⃣ **サンプルデータ**
実際の使用例に基づいたテストデータを含めています。

### 📋 **次のステップ**
1. Supabaseプロジェクトが設定されたら、このスキーマを適用
2. studylog-nextアプリケーションからのデータ操作実装
3. リアルタイム機能の実装

このスキーマは要件定義書の全ての機能要件をサポートし、将来の拡張にも対応できる設計になっています！

---

## 📝 プロジェクト情報
- **プロジェクト名**: studylog-next
- **技術スタック**: React + TypeScript + Tailwind CSS + Supabase
- **対象ユーザー**: 小学6年生（生徒）、保護者、指導者
- **使用期間**: 2025年7月21日〜8月6日（17日間）