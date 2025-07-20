import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数を読み込む（Node.js環境用）
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  console.log('🚀 データベースセットアップを開始します...')
  console.log('📍 Supabase URL:', supabaseUrl)

  try {
    // 1. 学習記録テーブルの作成
    console.log('\n📊 1. 学習記録テーブルを作成中...')
    const { error: studyRecordsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS study_records (
          id BIGSERIAL PRIMARY KEY,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          subject VARCHAR(20) NOT NULL CHECK (subject IN ('aptitude', 'japanese', 'math', 'science', 'social')),
          questions_total INTEGER NOT NULL CHECK (questions_total >= 1 AND questions_total <= 100),
          questions_correct INTEGER NOT NULL CHECK (questions_correct >= 0),
          emotion VARCHAR(10) NOT NULL CHECK (emotion IN ('good', 'normal', 'hard')),
          comment TEXT CHECK (LENGTH(comment) <= 300),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT valid_correct_answers CHECK (questions_correct <= questions_total)
        );
        
        COMMENT ON TABLE study_records IS '学習記録を保存するテーブル';
        COMMENT ON COLUMN study_records.subject IS '科目（適性、国語、算数、理科、社会）';
        COMMENT ON COLUMN study_records.emotion IS '学習時の感情（good=よくできた、normal=普通、hard=難しかった）';
      `
    })

    if (studyRecordsError) {
      console.error('❌ 学習記録テーブル作成エラー:', studyRecordsError)
    } else {
      console.log('✅ 学習記録テーブル作成完了')
    }

    // 2. フィードバックテーブルの作成
    console.log('\n💬 2. フィードバックテーブルを作成中...')
    const { error: feedbacksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS feedbacks (
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
        
        COMMENT ON TABLE feedbacks IS '学習記録に対するフィードバックを保存するテーブル';
        COMMENT ON COLUMN feedbacks.sender_type IS 'フィードバック送信者（parent=保護者、teacher=指導者）';
        COMMENT ON COLUMN feedbacks.reaction_type IS 'リアクション（clap=👏、thumbs=👍、muscle=💪）';
      `
    })

    if (feedbacksError) {
      console.error('❌ フィードバックテーブル作成エラー:', feedbacksError)
    } else {
      console.log('✅ フィードバックテーブル作成完了')
    }

    // 3. テーブル一覧を確認
    console.log('\n📋 3. 作成されたテーブルを確認中...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['study_records', 'feedbacks'])

    if (tablesError) {
      console.error('❌ テーブル確認エラー:', tablesError)
    } else {
      console.log('✅ 作成されたテーブル:', tables?.map(t => t.table_name) || [])
    }

    console.log('\n🎉 データベースセットアップが完了しました！')
    
  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error)
  }
}

// スクリプト実行
setupDatabase() 