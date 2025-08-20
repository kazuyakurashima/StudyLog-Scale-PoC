-- 既存のテーブル一覧を確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('study_records', 'feedbacks', 'reflections');

-- 各テーブルの構造を確認
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('study_records', 'feedbacks', 'reflections')
ORDER BY table_name, ordinal_position;

-- RLSの状況を確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('study_records', 'feedbacks', 'reflections');

-- 既存のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('study_records', 'feedbacks', 'reflections');
