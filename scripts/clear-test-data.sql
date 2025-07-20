-- StudyLog Next - テストデータクリア（本番環境準備用）
-- 本番デプロイ前にテストデータを削除します

-- ⚠️ 注意: このスクリプトは全データを削除します
-- 本番環境で実行する前に、必要なデータがないことを確認してください

-- 1. フィードバックテーブルのクリア
DELETE FROM feedbacks;
TRUNCATE TABLE feedbacks RESTART IDENTITY CASCADE;

-- 2. 学習記録テーブルのクリア  
DELETE FROM study_records;
TRUNCATE TABLE study_records RESTART IDENTITY CASCADE;

-- 3. 確認用クエリ（実行後に確認）
SELECT 'study_records' as table_name, COUNT(*) as record_count FROM study_records
UNION ALL
SELECT 'feedbacks' as table_name, COUNT(*) as record_count FROM feedbacks;

-- 4. テーブル構造の確認（削除されていないことを確認）
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('study_records', 'feedbacks')
ORDER BY table_name, ordinal_position; 