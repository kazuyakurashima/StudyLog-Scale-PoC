# Supabase設定ガイド

このドキュメントでは、studylog-nextアプリのSupabaseプロジェクトの設定手順を説明します。

## 📋 設定手順

### 1. Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New project」をクリック
3. プロジェクト名: `studylog-next`
4. データベースパスワードを設定
5. リージョンを選択（推奨: Northeast Asia (Tokyo) - ap-northeast-1）
6. プロジェクトの作成を待つ（約2分）

### 2. 環境変数の設定

1. プロジェクトダッシュボードで「Settings」→「API」に移動
2. 以下の情報をコピー：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

3. プロジェクトルートに `.env.local` ファイルを作成：

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**: 
- `service_role` キーは使用しないでください
- `.env.local` ファイルはGitにコミットしないでください

### 3. テーブル作成

Supabaseダッシュボードの「SQL Editor」で以下のSQLを実行してください：

#### 3.1 学習記録テーブル

```sql
-- 学習記録テーブルの作成
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

-- コメント追加
COMMENT ON TABLE study_records IS '学習記録を保存するテーブル';
COMMENT ON COLUMN study_records.subject IS '科目（適性、国語、算数、理科、社会）';
COMMENT ON COLUMN study_records.emotion IS '学習時の感情（good=よくできた、normal=普通、hard=難しかった）';
```

#### 3.2 フィードバックテーブル

```sql
-- フィードバックテーブルの作成
CREATE TABLE feedbacks (
  id BIGSERIAL PRIMARY KEY,
  record_id BIGINT NOT NULL REFERENCES study_records(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  reaction_type VARCHAR(10) CHECK (reaction_type IN ('clap', 'thumbs', 'muscle')),
  message TEXT CHECK (LENGTH(message) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT feedback_content_check CHECK (
    (reaction_type IS NOT NULL AND message IS NULL) OR
    (reaction_type IS NULL AND message IS NOT NULL) OR
    (reaction_type IS NOT NULL AND message IS NOT NULL)
  )
);

-- コメント追加
COMMENT ON TABLE feedbacks IS '学習記録に対するフィードバックを保存するテーブル';
COMMENT ON COLUMN feedbacks.sender_type IS 'フィードバック送信者（parent=保護者、teacher=指導者）';
COMMENT ON COLUMN feedbacks.reaction_type IS 'リアクション（clap=👏、thumbs=👍、muscle=💪）';
```

#### 3.3 インデックス作成

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_study_records_date ON study_records(date);
CREATE INDEX idx_study_records_subject ON study_records(subject);
CREATE INDEX idx_study_records_created_at ON study_records(created_at);
CREATE INDEX idx_study_records_date_subject ON study_records(date, subject);

CREATE INDEX idx_feedbacks_record_id ON feedbacks(record_id);
CREATE INDEX idx_feedbacks_sender_type ON feedbacks(sender_type);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);
```

#### 3.4 更新トリガー

```sql
-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_study_records_updated_at 
    BEFORE UPDATE ON study_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### 3.5 Row Level Security (RLS)

```sql
-- RLS有効化
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 公開アクセス許可（シンプル認証のため）
CREATE POLICY "public_can_read_study_records" 
ON study_records FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_can_insert_study_records" 
ON study_records FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "public_can_update_study_records" 
ON study_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_can_read_feedbacks" 
ON feedbacks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_can_insert_feedbacks" 
ON feedbacks FOR INSERT TO anon, authenticated WITH CHECK (true);
```

#### 3.6 サンプルデータ投入

```sql
-- テスト用サンプルデータ
INSERT INTO study_records (date, subject, questions_total, questions_correct, emotion, comment) VALUES
('2025-01-27', 'japanese', 20, 18, 'good', '漢字が難しかったけど頑張った'),
('2025-01-27', 'math', 15, 12, 'normal', '計算問題は得意だった'),
('2025-01-26', 'science', 25, 20, 'good', '実験の問題が面白かった'),
('2025-01-26', 'social', 30, 24, 'hard', '地理が難しい'),
('2025-01-25', 'aptitude', 40, 35, 'good', '集中して解けた');

-- フィードバックのサンプルデータ
INSERT INTO feedbacks (record_id, sender_type, reaction_type, message) VALUES
(1, 'parent', 'clap', 'よく頑張ったね！漢字の練習の成果が出てるよ'),
(1, 'teacher', 'thumbs', '順調だね。この調子で続けよう'),
(2, 'parent', 'muscle', '計算力がついてきた！'),
(3, 'teacher', 'clap', '実験問題の理解が深まってる'),
(4, 'parent', NULL, '地理は覚えることが多いけど、一緒に地図を見ながら覚えよう');
```

### 4. 設定確認

1. アプリケーションを起動: `npm run dev`
2. ブラウザで `http://localhost:5173` にアクセス
3. コンソールでエラーがないことを確認
4. 学習記録の投稿をテスト

### 5. トラブルシューティング

#### 環境変数エラー
```
⚠️ Supabase環境変数が設定されていません
```
→ `.env.local` ファイルが正しく作成され、正しい値が設定されているか確認

#### 接続エラー
```
Failed to fetch
```
→ Supabaseプロジェクトが正常に起動しているか、URLが正しいか確認

#### RLSエラー
```
Row Level Security policy violated
```
→ RLSポリシーが正しく設定されているか確認

### 6. 次のステップ

1. studylog-nextアプリケーションからのデータ操作実装
2. リアルタイム機能の実装
3. 進捗表示機能の実装
4. フィードバック機能の実装

---

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 