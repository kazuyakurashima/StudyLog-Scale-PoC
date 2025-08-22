-- study_recordsテーブルのdateカラムをDATEからTIMESTAMP WITH TIME ZONEに変更
-- 時刻情報を保持するための修正

-- 0. 依存するビューを一時的に削除
DROP VIEW IF EXISTS study_history_view;

-- 1. 新しいカラムを追加
ALTER TABLE study_records 
ADD COLUMN date_temp TIMESTAMP WITH TIME ZONE;

-- 2. 既存のdateデータを新しいカラムにコピー（日付のみのデータはそのまま）
UPDATE study_records 
SET date_temp = date::timestamp with time zone;

-- 3. 古いdateカラムを削除
ALTER TABLE study_records 
DROP COLUMN date;

-- 4. 新しいカラムの名前をdateに変更
ALTER TABLE study_records 
RENAME COLUMN date_temp TO date;

-- 5. NOT NULL制約を追加
ALTER TABLE study_records 
ALTER COLUMN date SET NOT NULL;

-- 6. デフォルト値を設定
ALTER TABLE study_records 
ALTER COLUMN date SET DEFAULT NOW();

-- 7. ビューを再作成
CREATE OR REPLACE VIEW study_history_view AS
SELECT 
    sr.id,
    sr.date as record_date, -- 記録をつけた日時（現在はTIMESTAMP WITH TIME ZONE）
    sr.study_date, -- 学習内容の実施日
    sr.subject,
    sr.content_type,
    sr.attempt_number,
    sr.questions_total,
    sr.questions_correct,
    sr.emotion,
    sr.comment,
    sr.created_at,
    sr.updated_at,
    COALESCE(f.feedback_count, 0) as feedback_count,
    COALESCE(f.latest_feedback, sr.created_at) as latest_activity
FROM study_records sr
LEFT JOIN (
    SELECT 
        record_id,
        COUNT(*) as feedback_count,
        MAX(created_at) as latest_feedback
    FROM feedbacks 
    GROUP BY record_id
) f ON sr.id = f.record_id
ORDER BY sr.date DESC, sr.created_at DESC;

-- 確認クエリ
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'study_records' AND column_name = 'date';