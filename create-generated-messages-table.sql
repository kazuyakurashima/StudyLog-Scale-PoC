-- 生成された応援メッセージをキャッシュするテーブル
CREATE TABLE IF NOT EXISTS public.generated_messages (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES study_records(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'teacher')),
  messages JSONB NOT NULL, -- 生成されたメッセージ配列をJSONとして保存
  generated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  -- 同一の学習記録に対して同一の送信者タイプのメッセージは1つまで
  UNIQUE(record_id, sender_type)
);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_generated_messages_record_id ON public.generated_messages(record_id);
CREATE INDEX IF NOT EXISTS idx_generated_messages_sender_type ON public.generated_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_generated_messages_generated_at ON public.generated_messages(generated_at);

-- RLS (Row Level Security) 設定
ALTER TABLE public.generated_messages ENABLE ROW LEVEL SECURITY;

-- 全ユーザーアクセス許可ポリシー
CREATE POLICY "Enable all access for generated_messages" ON public.generated_messages
  FOR ALL USING (true) WITH CHECK (true);

-- コメント追加
COMMENT ON TABLE public.generated_messages IS '学習記録に対して生成された個別最適化応援メッセージのキャッシュテーブル';
COMMENT ON COLUMN public.generated_messages.record_id IS '対象の学習記録ID';
COMMENT ON COLUMN public.generated_messages.sender_type IS 'メッセージ送信者タイプ（parent: 保護者, teacher: 先生）';
COMMENT ON COLUMN public.generated_messages.messages IS '生成されたメッセージ配列（JSON形式）';
COMMENT ON COLUMN public.generated_messages.generated_at IS 'メッセージが生成された日時';