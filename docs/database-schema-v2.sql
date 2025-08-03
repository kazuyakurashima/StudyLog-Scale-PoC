-- StudyLog Next - 拡張データベーススキーマ v2.0
-- 学習実施日、授業/宿題種別、履歴追跡機能対応

-- 1. 既存テーブルを拡張（study_records）
-- 既存のstudy_recordsテーブルにカラムを追加

-- まず新しいカラムを追加
ALTER TABLE study_records 
ADD COLUMN study_date DATE, -- 実際に学習した内容の実施日（例：7月21日の授業内容）
ADD COLUMN content_type VARCHAR(20) CHECK (content_type IN ('class', 'homework')), -- 授業 or 宿題
ADD COLUMN attempt_number INTEGER DEFAULT 1; -- 何回目の挑戦か

-- 既存データの互換性のためのデフォルト値設定
UPDATE study_records 
SET study_date = date, 
    content_type = 'class', 
    attempt_number = 1 
WHERE study_date IS NULL;

-- NOT NULL制約を追加
ALTER TABLE study_records 
ALTER COLUMN study_date SET NOT NULL,
ALTER COLUMN content_type SET NOT NULL,
ALTER COLUMN attempt_number SET NOT NULL;

-- 2. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_study_records_study_date ON study_records(study_date);
CREATE INDEX IF NOT EXISTS idx_study_records_content_type ON study_records(content_type);
CREATE INDEX IF NOT EXISTS idx_study_records_subject_study_date ON study_records(subject, study_date);

-- 3. 履歴追跡のための複合インデックス
CREATE INDEX IF NOT EXISTS idx_study_records_history ON study_records(subject, study_date, content_type, attempt_number);

-- 4. feedbacksテーブルも若干調整（より詳細な情報表示のため）
-- 既存のfeedbacksテーブルはそのまま使用可能

-- 5. 学習履歴を効率的に取得するためのビュー
CREATE OR REPLACE VIEW study_history_view AS
SELECT 
    sr.id,
    sr.date as record_date, -- 記録をつけた日
    sr.study_date, -- 学習内容の実施日
    sr.subject,
    sr.content_type,
    sr.attempt_number,
    sr.questions_total,
    sr.questions_correct,
    sr.emotion,
    sr.comment,
    sr.created_at,
    -- 正答率の計算
    ROUND((sr.questions_correct::DECIMAL / sr.questions_total) * 100, 0) as accuracy,
    -- 同じ学習内容の履歴情報
    (
        SELECT json_agg(
            json_build_object(
                'attempt', prev.attempt_number,
                'correct', prev.questions_correct,
                'total', prev.questions_total,
                'accuracy', ROUND((prev.questions_correct::DECIMAL / prev.questions_total) * 100, 0),
                'date', prev.date,
                'emotion', prev.emotion
            ) ORDER BY prev.attempt_number
        )
        FROM study_records prev 
        WHERE prev.subject = sr.subject 
        AND prev.study_date = sr.study_date 
        AND prev.content_type = sr.content_type
        AND prev.attempt_number <= sr.attempt_number
    ) as history_json
FROM study_records sr;

-- 6. 学習進捗統計のための便利関数
CREATE OR REPLACE FUNCTION get_subject_progress(
    p_subject VARCHAR(50),
    p_study_date DATE,
    p_content_type VARCHAR(20)
) 
RETURNS TABLE (
    attempt_number INTEGER,
    record_date DATE,
    questions_correct INTEGER,
    questions_total INTEGER,
    accuracy INTEGER,
    emotion VARCHAR(20),
    improvement INTEGER -- 前回からの改善ポイント
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.attempt_number,
        sr.date,
        sr.questions_correct,
        sr.questions_total,
        ROUND((sr.questions_correct::DECIMAL / sr.questions_total) * 100, 0)::INTEGER as accuracy,
        sr.emotion,
        COALESCE(
            ROUND((sr.questions_correct::DECIMAL / sr.questions_total) * 100, 0) - 
            LAG(ROUND((sr.questions_correct::DECIMAL / sr.questions_total) * 100, 0)) 
            OVER (ORDER BY sr.attempt_number), 
            0
        )::INTEGER as improvement
    FROM study_records sr
    WHERE sr.subject = p_subject 
    AND sr.study_date = p_study_date 
    AND sr.content_type = p_content_type
    ORDER BY sr.attempt_number;
END;
$$ LANGUAGE plpgsql;

-- 7. サンプルデータの挿入（拡張版）
-- 既存データをクリアして新しい形式で挿入
DELETE FROM study_records;

-- 7月21日実施の算数授業の学習履歴例
INSERT INTO study_records (
    date, study_date, subject, content_type, attempt_number,
    questions_total, questions_correct, emotion, comment
) VALUES 
-- 7月21日の算数授業を7月21日に復習
('2024-07-21', '2024-07-21', 'math', 'class', 1, 10, 3, 'hard', '計算問題が難しかった'),

-- 7月21日の算数授業を7月22日に再挑戦
('2024-07-22', '2024-07-21', 'math', 'class', 2, 10, 7, 'good', '昨日より理解できた！'),

-- 7月21日の算数宿題を7月22日に実施
('2024-07-22', '2024-07-21', 'math', 'homework', 1, 8, 4, 'normal', '宿題もやってみた'),

-- 7月21日の算数授業を7月30日に再々挑戦
('2024-07-30', '2024-07-21', 'math', 'class', 3, 10, 10, 'good', '完璧にできた！'),

-- 他の科目のサンプルデータ
('2024-07-22', '2024-07-22', 'japanese', 'class', 1, 15, 12, 'good', '漢字の読み書き'),
('2024-07-23', '2024-07-22', 'japanese', 'homework', 1, 12, 8, 'normal', '漢字の宿題'),
('2024-07-23', '2024-07-23', 'science', 'class', 1, 20, 18, 'good', '理科の実験が楽しかった'),
('2024-07-24', '2024-07-23', 'science', 'class', 2, 20, 20, 'good', '理科の復習完璧！');

-- 8. フィードバック用のサンプルデータも追加
INSERT INTO feedbacks (record_id, sender_type, reaction_type, message) VALUES
((SELECT id FROM study_records WHERE date = '2024-07-22' AND study_date = '2024-07-21' AND content_type = 'class' LIMIT 1), 'parent', 'clap', '昨日より上達してる！すごいね！'),
((SELECT id FROM study_records WHERE date = '2024-07-30' AND study_date = '2024-07-21' AND content_type = 'class' LIMIT 1), 'teacher', 'muscle', '完璧な復習です。努力の成果が出ていますね！'),
((SELECT id FROM study_records WHERE date = '2024-07-24' AND study_date = '2024-07-23' AND content_type = 'class' LIMIT 1), 'parent', 'thumbs', '理科が得意になってきたね！');

-- 9. 便利なクエリ例（コメント）
/*
-- 今日の学習記録を取得（履歴付き）
SELECT * FROM study_history_view WHERE record_date = CURRENT_DATE;

-- 特定の学習内容の進捗を取得
SELECT * FROM get_subject_progress('math', '2024-07-21', 'class');

-- 科目別の最新の挑戦回数
SELECT 
    subject,
    study_date,
    content_type,
    MAX(attempt_number) as max_attempts,
    MAX(CASE WHEN attempt_number = (SELECT MAX(attempt_number) FROM study_records sr2 
                                   WHERE sr2.subject = sr.subject 
                                   AND sr2.study_date = sr.study_date 
                                   AND sr2.content_type = sr.content_type)
        THEN ROUND((questions_correct::DECIMAL / questions_total) * 100, 0) END) as latest_accuracy
FROM study_records sr
GROUP BY subject, study_date, content_type
ORDER BY study_date DESC;
*/

-- 10. 振り返り機能用テーブル
CREATE TABLE IF NOT EXISTS reflections (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL, -- 振り返り対象の日付
    reflection_content TEXT NOT NULL, -- 振り返り内容（生徒記入）
    improvement_points TEXT, -- 改善点（生徒記入）
    teacher_comment TEXT, -- 先生のコメント
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(date);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_reflection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reflections_updated_at
    BEFORE UPDATE ON reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_reflection_updated_at();

-- RLS有効化
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 振り返りデータにアクセス可能なポリシー
CREATE POLICY "Everyone can access reflections" ON reflections
    FOR ALL USING (true);

-- 11. 権限とセキュリティ（RLS Policy更新）
-- 既存のRLSポリシーは継続使用可能 