-- テーブルの存在確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%message%';

-- generated_messagesテーブルの構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'generated_messages'
ORDER BY ordinal_position;

-- テーブル内のデータ確認
SELECT COUNT(*) as total_records FROM public.generated_messages;

-- 最新の5件を確認
SELECT * FROM public.generated_messages 
ORDER BY created_at DESC 
LIMIT 5;
