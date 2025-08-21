-- 生徒IDフィールドを既存テーブルに追加するマイグレーション

-- 1. study_recordsテーブルに生徒IDを追加
ALTER TABLE study_records 
ADD COLUMN student_id VARCHAR(20);

-- 2. feedbacksテーブルに生徒IDを追加
ALTER TABLE feedbacks 
ADD COLUMN student_id VARCHAR(20);

-- 3. reflectionsテーブルに生徒IDを追加  
ALTER TABLE reflections 
ADD COLUMN student_id VARCHAR(20);

-- 4. generated_messagesテーブルに生徒IDを追加（存在する場合）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_messages') THEN
        ALTER TABLE generated_messages ADD COLUMN student_id VARCHAR(20);
    END IF;
END $$;

-- 5. 既存データに仮の生徒IDを設定（テスト用）
UPDATE study_records SET student_id = '11111111' WHERE student_id IS NULL;
UPDATE feedbacks SET student_id = '11111111' WHERE student_id IS NULL;
UPDATE reflections SET student_id = '11111111' WHERE student_id IS NULL;

-- 6. 既存のgenerated_messagesにも適用（存在する場合）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_messages') THEN
        UPDATE generated_messages SET student_id = '11111111' WHERE student_id IS NULL;
    END IF;
END $$;

-- 7. NOT NULL制約を追加
ALTER TABLE study_records ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE feedbacks ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE reflections ALTER COLUMN student_id SET NOT NULL;

-- 8. generated_messagesにもNOT NULL制約（存在する場合）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_messages') THEN
        ALTER TABLE generated_messages ALTER COLUMN student_id SET NOT NULL;
    END IF;
END $$;

-- 9. インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_study_records_student_id ON study_records(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id ON feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_reflections_student_id ON reflections(student_id);

-- 10. generated_messagesにもインデックス（存在する場合）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_generated_messages_student_id ON generated_messages(student_id);
    END IF;
END $$;

-- 11. 複合インデックスも追加
CREATE INDEX IF NOT EXISTS idx_study_records_student_date ON study_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_study_records_student_subject ON study_records(student_id, subject);

-- 12. ビューを更新（生徒ID対応）
CREATE OR REPLACE VIEW study_history_view AS
SELECT 
    sr.id,
    sr.student_id,
    sr.date as record_date,
    sr.study_date,
    sr.subject,
    sr.content_type,
    sr.attempt_number,
    sr.questions_total,
    sr.questions_correct,
    sr.emotion,
    sr.comment,
    sr.created_at,
    ROUND((sr.questions_correct::DECIMAL / sr.questions_total) * 100, 0) as accuracy,
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
        WHERE prev.student_id = sr.student_id
        AND prev.subject = sr.subject 
        AND prev.study_date = sr.study_date 
        AND prev.content_type = sr.content_type
        AND prev.attempt_number <= sr.attempt_number
    ) as history_json
FROM study_records sr;

-- 13. 関数も更新（生徒ID対応）
CREATE OR REPLACE FUNCTION get_subject_progress(
    p_student_id VARCHAR(20),
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
    improvement INTEGER
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
    WHERE sr.student_id = p_student_id
    AND sr.subject = p_subject 
    AND sr.study_date = p_study_date 
    AND sr.content_type = p_content_type
    ORDER BY sr.attempt_number;
END;
$$ LANGUAGE plpgsql;

-- 14. 連続日数カウント関数（生徒ID対応）
CREATE OR REPLACE FUNCTION get_study_streak(p_student_id VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    streak_count INTEGER := 0;
    check_date DATE;
BEGIN
    -- 今日から遡って連続日数をカウント
    FOR check_date IN 
        SELECT generate_series(current_date, current_date - INTERVAL '30 days', '-1 day'::interval)::date
    LOOP
        -- その日に学習記録があるかチェック
        IF EXISTS (
            SELECT 1 FROM study_records 
            WHERE student_id = p_student_id 
            AND date = check_date
        ) THEN
            streak_count := streak_count + 1;
        ELSE
            -- 連続が途切れたら終了
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- 15. RLS（Row Level Security）ポリシーの更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Everyone can access study_records" ON study_records;
DROP POLICY IF EXISTS "Everyone can access feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Everyone can access reflections" ON reflections;

-- 新しいポリシー（生徒IDベース - 現時点では全アクセス許可）
CREATE POLICY "Everyone can access study_records" ON study_records
    FOR ALL USING (true);

CREATE POLICY "Everyone can access feedbacks" ON feedbacks  
    FOR ALL USING (true);

CREATE POLICY "Everyone can access reflections" ON reflections
    FOR ALL USING (true);

-- 16. generated_messagesのポリシーも更新（存在する場合）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_messages') THEN
        DROP POLICY IF EXISTS "Everyone can access generated_messages" ON generated_messages;
        CREATE POLICY "Everyone can access generated_messages" ON generated_messages
            FOR ALL USING (true);
    END IF;
END $$;