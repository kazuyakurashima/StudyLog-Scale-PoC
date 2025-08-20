-- feedbacks テーブル作成
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

-- reflections テーブル作成
CREATE TABLE reflections (
  id BIGSERIAL PRIMARY KEY,
  record_id BIGINT NOT NULL REFERENCES study_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 全ユーザーアクセス許可ポリシー
CREATE POLICY "public_access" ON study_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON feedbacks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
