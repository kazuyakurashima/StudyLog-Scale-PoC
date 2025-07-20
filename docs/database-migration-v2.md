# データベース拡張マイグレーション v2.0

## 📋 概要
学習記録システムを拡張して、以下の機能を追加します：
- **学習実施日の記録**（例：7月21日の授業内容）
- **授業/宿題の種別管理**
- **同一学習内容の履歴追跡**（1回目、2回目、3回目...）

## 🔧 実行手順

### 1. Supabaseダッシュボードにログイン
1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック

### 2. マイグレーションSQLの実行
以下のSQLを「New query」で実行してください：

```sql
-- StudyLog Next - データベース拡張 v2.0

-- 1. 既存テーブルにカラムを追加
ALTER TABLE study_records 
ADD COLUMN study_date DATE, -- 実際に学習した内容の実施日
ADD COLUMN content_type VARCHAR(20) CHECK (content_type IN ('class', 'homework')), -- 授業 or 宿題
ADD COLUMN attempt_number INTEGER DEFAULT 1; -- 何回目の挑戦か

-- 2. 既存データの互換性のためのデフォルト値設定
UPDATE study_records 
SET study_date = date, 
    content_type = 'class', 
    attempt_number = 1 
WHERE study_date IS NULL;

-- 3. NOT NULL制約を追加
ALTER TABLE study_records 
ALTER COLUMN study_date SET NOT NULL,
ALTER COLUMN content_type SET NOT NULL,
ALTER COLUMN attempt_number SET NOT NULL;

-- 4. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_study_records_study_date ON study_records(study_date);
CREATE INDEX IF NOT EXISTS idx_study_records_content_type ON study_records(content_type);
CREATE INDEX IF NOT EXISTS idx_study_records_history ON study_records(subject, study_date, content_type, attempt_number);
```

### 3. サンプルデータの追加（オプション）
テスト用に履歴データを追加したい場合：

```sql
-- 既存データをクリアして新しい形式のサンプルデータを挿入
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
```

## ✅ 確認方法

マイグレーション後、以下のクエリで正常に動作することを確認：

```sql
-- 新しいカラムが追加されているか確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_records' 
ORDER BY ordinal_position;

-- サンプルデータの確認
SELECT date, study_date, subject, content_type, attempt_number, 
       questions_correct, questions_total 
FROM study_records 
ORDER BY study_date, subject, content_type, attempt_number;
```

## 🚫 ロールバック（必要時）

問題が発生した場合の戻し方：

```sql
-- カラムを削除（注意：データが消えます）
ALTER TABLE study_records 
DROP COLUMN IF EXISTS study_date,
DROP COLUMN IF EXISTS content_type,
DROP COLUMN IF EXISTS attempt_number;

-- インデックスを削除
DROP INDEX IF EXISTS idx_study_records_study_date;
DROP INDEX IF EXISTS idx_study_records_content_type;
DROP INDEX IF EXISTS idx_study_records_history;
```

## 📝 完了後の作業

マイグレーション完了後、以下のファイルを更新する必要があります：
1. `src/lib/supabase.ts` - TypeScript型定義
2. `src/components/StudyRecordForm.tsx` - 入力フォーム
3. `src/components/Dashboard.tsx` - 表示ロジック
4. `src/components/FeedbackPage.tsx` - フィードバック表示

これらは自動的に更新されます。 