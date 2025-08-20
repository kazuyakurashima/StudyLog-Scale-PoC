-- オリジナルスキーマに基づくテーブル作成とRLS設定
-- timestamp without time zone 対応版

-- Feedbacks テーブル (オリジナル構造に対応)
create table if not exists public.feedbacks (
  id serial not null,
  record_id integer not null,
  sender_type text not null check (sender_type in ('parent', 'teacher')),
  reaction_type text null check (reaction_type in ('clap', 'thumbs', 'muscle')),
  message text null,
  created_at timestamp without time zone null default now(),
  constraint feedbacks_pkey primary key (id)
) tablespace pg_default;

-- Reflections テーブル (オリジナルスキーマ)
create table if not exists public.reflections (
  id serial not null,
  date date not null,
  reflection_content text not null,
  improvement_points text null,
  teacher_comment text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint reflections_pkey primary key (id)
) tablespace pg_default;

-- インデックス作成
create index if not exists idx_feedbacks_record_id on public.feedbacks using btree (record_id) tablespace pg_default;
create index if not exists idx_reflections_date on public.reflections using btree (date) tablespace pg_default;

-- Reflections テーブル用の更新トリガー関数
create or replace function update_reflection_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Reflections テーブル用のトリガー
drop trigger if exists trigger_reflections_updated_at on public.reflections;
create trigger trigger_reflections_updated_at
  before update on public.reflections
  for each row
  execute function update_reflection_updated_at();

-- RLS有効化
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "public_access" ON feedbacks;
DROP POLICY IF EXISTS "public_access" ON reflections;
DROP POLICY IF EXISTS "Enable all access for feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Enable all access for reflections" ON reflections;

-- 全ユーザーアクセス許可ポリシー (オリジナルスキーマ対応)
CREATE POLICY "public_access" ON feedbacks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
