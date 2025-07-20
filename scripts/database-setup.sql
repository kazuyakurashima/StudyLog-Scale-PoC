-- ==========================================
-- studylog-next - データベース作成スクリプト
-- ==========================================
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください
-- https://supabase.com/dashboard -> Your Project -> SQL Editor

-- ==========================================
-- 1. 学習記録テーブル (study_records)
-- ==========================================

-- 学習記録テーブルの作成
CREATE TABLE IF NOT EXISTS study_records (
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

-- テーブルとカラムのコメント
COMMENT ON TABLE study_records IS '学習記録を保存するテーブル';
COMMENT ON COLUMN study_records.id IS '学習記録の一意識別子';
COMMENT ON COLUMN study_records.date IS '学習した日付';
COMMENT ON COLUMN study_records.subject IS '科目（適性、国語、算数、理科、社会）';
COMMENT ON COLUMN study_records.questions_total IS '問題総数（1-100）';
COMMENT ON COLUMN study_records.questions_correct IS '正答数';
COMMENT ON COLUMN study_records.emotion IS '学習時の感情（good=よくできた、normal=普通、hard=難しかった）';
COMMENT ON COLUMN study_records.comment IS '一言コメント（最大300文字）';
COMMENT ON COLUMN study_records.created_at IS '作成日時';
COMMENT ON COLUMN study_records.updated_at IS '更新日時';

-- ==========================================
-- 2. フィードバックテーブル (feedbacks)
-- ==========================================

-- フィードバックテーブルの作成
CREATE TABLE IF NOT EXISTS feedbacks (
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

-- テーブルとカラムのコメント
COMMENT ON TABLE feedbacks IS '学習記録に対するフィードバック（応援・コメント）を保存するテーブル';
COMMENT ON COLUMN feedbacks.id IS 'フィードバックの一意識別子';
COMMENT ON COLUMN feedbacks.record_id IS '対応する学習記録のID';
COMMENT ON COLUMN feedbacks.sender_type IS 'フィードバック送信者の種別（parent=保護者、teacher=指導者）';
COMMENT ON COLUMN feedbacks.reaction_type IS 'リアクションの種別（clap=👏すごい、thumbs=👍いいね、muscle=💪頑張って）';
COMMENT ON COLUMN feedbacks.message IS 'コメント内容（最大500文字）';
COMMENT ON COLUMN feedbacks.created_at IS '作成日時';

-- ==========================================
-- 3. インデックス作成（パフォーマンス最適化）
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(date);
CREATE INDEX IF NOT EXISTS idx_study_records_subject ON study_records(subject);
CREATE INDEX IF NOT EXISTS idx_study_records_created_at ON study_records(created_at);
CREATE INDEX IF NOT EXISTS idx_study_records_date_subject ON study_records(date, subject);

CREATE INDEX IF NOT EXISTS idx_feedbacks_record_id ON feedbacks(record_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_sender_type ON feedbacks(sender_type);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- ==========================================
-- 4. 自動更新トリガー
-- ==========================================

-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- study_recordsテーブルの更新日時自動更新トリガー
DROP TRIGGER IF EXISTS update_study_records_updated_at ON study_records;
CREATE TRIGGER update_study_records_updated_at 
    BEFORE UPDATE ON study_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. Row Level Security (RLS) ポリシー
-- ==========================================

-- study_recordsテーブルのRLS有効化
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（再実行対応）
DROP POLICY IF EXISTS "public_can_read_study_records" ON study_records;
DROP POLICY IF EXISTS "public_can_insert_study_records" ON study_records;
DROP POLICY IF EXISTS "public_can_update_study_records" ON study_records;

-- 全ユーザーが学習記録を読み取り可能（シンプル認証のため）
CREATE POLICY "public_can_read_study_records" 
ON study_records FOR SELECT 
TO anon, authenticated 
USING (true);

-- 全ユーザーが学習記録を挿入可能
CREATE POLICY "public_can_insert_study_records" 
ON study_records FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 全ユーザーが学習記録を更新可能
CREATE POLICY "public_can_update_study_records" 
ON study_records FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- feedbacksテーブルのRLS有効化
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（再実行対応）
DROP POLICY IF EXISTS "public_can_read_feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "public_can_insert_feedbacks" ON feedbacks;

-- 全ユーザーがフィードバックを読み取り可能
CREATE POLICY "public_can_read_feedbacks" 
ON feedbacks FOR SELECT 
TO anon, authenticated 
USING (true);

-- 全ユーザーがフィードバックを挿入可能
CREATE POLICY "public_can_insert_feedbacks" 
ON feedbacks FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- ==========================================
-- 6. サンプルデータ投入
-- ==========================================

-- 既存のサンプルデータを削除（再実行対応）
DELETE FROM feedbacks WHERE record_id IN (
  SELECT id FROM study_records WHERE comment LIKE '%テストデータ%' OR comment = '漢字が難しかったけど頑張った'
);
DELETE FROM study_records WHERE comment LIKE '%テストデータ%' OR comment = '漢字が難しかったけど頑張った';

-- 学習記録のサンプルデータ
INSERT INTO study_records (date, subject, questions_total, questions_correct, emotion, comment) VALUES
('2025-01-27', 'japanese', 20, 18, 'good', '漢字が難しかったけど頑張った'),
('2025-01-27', 'math', 15, 12, 'normal', '計算問題は得意だった'),
('2025-01-26', 'science', 25, 20, 'good', '実験の問題が面白かった'),
('2025-01-26', 'social', 30, 24, 'hard', '地理が難しい'),
('2025-01-25', 'aptitude', 40, 35, 'good', '集中して解けた');

-- フィードバックのサンプルデータ
INSERT INTO feedbacks (record_id, sender_type, reaction_type, message) VALUES
((SELECT id FROM study_records WHERE comment = '漢字が難しかったけど頑張った' LIMIT 1), 'parent', 'clap', 'よく頑張ったね！漢字の練習の成果が出てるよ'),
((SELECT id FROM study_records WHERE comment = '漢字が難しかったけど頑張った' LIMIT 1), 'teacher', 'thumbs', '順調だね。この調子で続けよう'),
((SELECT id FROM study_records WHERE comment = '計算問題は得意だった' LIMIT 1), 'parent', 'muscle', '計算力がついてきた！'),
((SELECT id FROM study_records WHERE comment = '実験の問題が面白かった' LIMIT 1), 'teacher', 'clap', '実験問題の理解が深まってる'),
((SELECT id FROM study_records WHERE comment = '地理が難しい' LIMIT 1), 'parent', NULL, '地理は覚えることが多いけど、一緒に地図を見ながら覚えよう');

-- ==========================================
-- 7. 作成結果の確認
-- ==========================================

-- 作成されたテーブルの確認
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('study_records', 'feedbacks')
ORDER BY tablename;

-- 投入されたサンプルデータの確認
SELECT 
    'study_records' as table_name,
    COUNT(*) as record_count
FROM study_records
UNION ALL
SELECT 
    'feedbacks' as table_name,
    COUNT(*) as record_count
FROM feedbacks;

-- 最新の学習記録とフィードバックを確認
SELECT 
    sr.id,
    sr.date,
    sr.subject,
    sr.questions_total,
    sr.questions_correct,
    ROUND((sr.questions_correct::NUMERIC / sr.questions_total::NUMERIC) * 100, 1) as accuracy_rate,
    sr.emotion,
    sr.comment,
    COUNT(f.id) as feedback_count
FROM study_records sr
LEFT JOIN feedbacks f ON sr.id = f.record_id
GROUP BY sr.id, sr.date, sr.subject, sr.questions_total, sr.questions_correct, sr.emotion, sr.comment
ORDER BY sr.created_at DESC;

-- ==========================================
-- セットアップ完了！
-- ==========================================

SELECT '🎉 データベースセットアップが完了しました！' as message; 