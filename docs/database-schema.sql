-- ==========================================
-- studylog-next - データベーススキーマ設計
-- ==========================================
-- 作成日: 2025年1月27日
-- 要件定義書に基づくテーブル設計

-- ==========================================
-- 1. 学習記録テーブル (study_records)
-- ==========================================

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

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX idx_study_records_date ON study_records(date);
CREATE INDEX idx_study_records_subject ON study_records(subject);
CREATE INDEX idx_study_records_created_at ON study_records(created_at);
CREATE INDEX idx_study_records_date_subject ON study_records(date, subject);

-- ==========================================
-- 2. フィードバックテーブル (feedbacks)
-- ==========================================

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

-- テーブルとカラムのコメント
COMMENT ON TABLE feedbacks IS '学習記録に対するフィードバック（応援・コメント）を保存するテーブル';
COMMENT ON COLUMN feedbacks.id IS 'フィードバックの一意識別子';
COMMENT ON COLUMN feedbacks.record_id IS '対応する学習記録のID';
COMMENT ON COLUMN feedbacks.sender_type IS 'フィードバック送信者の種別（parent=保護者、teacher=指導者）';
COMMENT ON COLUMN feedbacks.reaction_type IS 'リアクションの種別（clap=👏すごい、thumbs=👍いいね、muscle=💪頑張って）';
COMMENT ON COLUMN feedbacks.message IS 'コメント内容（最大500文字）';
COMMENT ON COLUMN feedbacks.created_at IS '作成日時';

-- インデックス作成
CREATE INDEX idx_feedbacks_record_id ON feedbacks(record_id);
CREATE INDEX idx_feedbacks_sender_type ON feedbacks(sender_type);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

-- ==========================================
-- 3. 自動更新トリガー
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
CREATE TRIGGER update_study_records_updated_at 
    BEFORE UPDATE ON study_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Row Level Security (RLS) ポリシー
-- ==========================================

-- study_recordsテーブルのRLS有効化
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

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
-- 5. サンプルデータ投入
-- ==========================================

-- 学習記録のサンプルデータ
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

-- ==========================================
-- 6. 便利なビューの作成
-- ==========================================

-- 学習記録とフィードバックを結合したビュー
CREATE VIEW study_records_with_feedback AS
SELECT 
    sr.id,
    sr.date,
    sr.subject,
    sr.questions_total,
    sr.questions_correct,
    ROUND((sr.questions_correct::NUMERIC / sr.questions_total::NUMERIC) * 100, 1) as accuracy_rate,
    sr.emotion,
    sr.comment,
    sr.created_at,
    COALESCE(f.feedback_count, 0) as feedback_count,
    COALESCE(f.latest_feedback, NULL) as latest_feedback
FROM study_records sr
LEFT JOIN (
    SELECT 
        record_id,
        COUNT(*) as feedback_count,
        MAX(created_at) as latest_feedback
    FROM feedbacks 
    GROUP BY record_id
) f ON sr.id = f.record_id
ORDER BY sr.created_at DESC;

-- 科目別統計ビュー
CREATE VIEW subject_statistics AS
SELECT 
    subject,
    COUNT(*) as total_sessions,
    SUM(questions_total) as total_questions,
    SUM(questions_correct) as total_correct,
    ROUND(AVG((questions_correct::NUMERIC / questions_total::NUMERIC) * 100), 1) as avg_accuracy_rate,
    COUNT(CASE WHEN emotion = 'good' THEN 1 END) as good_sessions,
    COUNT(CASE WHEN emotion = 'normal' THEN 1 END) as normal_sessions,
    COUNT(CASE WHEN emotion = 'hard' THEN 1 END) as hard_sessions
FROM study_records 
GROUP BY subject
ORDER BY subject;

-- 日別統計ビュー
CREATE VIEW daily_statistics AS
SELECT 
    date,
    COUNT(*) as sessions_count,
    COUNT(DISTINCT subject) as subjects_studied,
    SUM(questions_total) as total_questions,
    SUM(questions_correct) as total_correct,
    ROUND(AVG((questions_correct::NUMERIC / questions_total::NUMERIC) * 100), 1) as avg_accuracy_rate
FROM study_records 
GROUP BY date
ORDER BY date DESC;

-- ==========================================
-- 7. 便利な関数
-- ==========================================

-- 継続日数を計算する関数
CREATE OR REPLACE FUNCTION get_study_streak()
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date DATE;
    check_date DATE := CURRENT_DATE;
BEGIN
    -- 今日から遡って連続学習日数をカウント
    LOOP
        SELECT COUNT(*) INTO current_date
        FROM study_records 
        WHERE date = check_date;
        
        IF current_date > 0 THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- 科目別正答率を取得する関数
CREATE OR REPLACE FUNCTION get_subject_accuracy(subject_name VARCHAR(20))
RETURNS NUMERIC AS $$
DECLARE
    accuracy NUMERIC;
BEGIN
    SELECT ROUND(AVG((questions_correct::NUMERIC / questions_total::NUMERIC) * 100), 1)
    INTO accuracy
    FROM study_records 
    WHERE subject = subject_name;
    
    RETURN COALESCE(accuracy, 0);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- スキーマ作成完了
-- ==========================================

-- 作成したテーブルの確認
SELECT 
    table_name,
    table_comment
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('study_records', 'feedbacks');

-- 作成したビューの確認  
SELECT 
    table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'; 

ALTER TABLE study_records 
ADD COLUMN study_date DATE,
ADD COLUMN content_type VARCHAR(20) CHECK (content_type IN ('class', 'homework')),
ADD COLUMN attempt_number INTEGER DEFAULT 1; 