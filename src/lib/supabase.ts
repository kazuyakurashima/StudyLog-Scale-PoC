import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Supabase環境変数が設定されていません。\n' +
    '.env.localファイルに以下を設定してください：\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'Supabaseダッシュボードで値を確認してください：\n' +
    'https://supabase.com/dashboard -> Your Project -> Settings -> API'
  )
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface StudyRecord {
  id: number
  date: string // 記録をつけた日
  study_date: string // 学習内容の実施日
  subject: 'aptitude' | 'japanese' | 'math' | 'science' | 'social'
  content_type: 'class' | 'homework' // 授業 or 宿題
  attempt_number: number // 何回目の挑戦か
  questions_total: number
  questions_correct: number
  emotion: 'good' | 'normal' | 'hard'
  comment?: string
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: number
  record_id: number
  sender_type: 'parent' | 'teacher'
  reaction_type?: 'clap' | 'thumbs' | 'muscle'
  message?: string
  created_at: string
}

export interface Reflection {
  id: number
  date: string
  reflection_content: string
  improvement_points?: string
  teacher_comment?: string
  created_at: string
  updated_at: string
}

export interface GeneratedMessage {
  id: number
  record_id: number
  sender_type: 'parent' | 'teacher'
  messages: Array<{
    message: string
    emoji: string
    type: 'encouraging' | 'specific_praise' | 'motivational' | 'loving' | 'instructional'
    source?: 'ai' | 'fallback'
  }>
  generated_at: string
  created_at: string
}

// Database tables type definition
export interface Database {
  public: {
    Tables: {
      study_records: {
        Row: StudyRecord
        Insert: Omit<StudyRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StudyRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      feedbacks: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'created_at'>
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>>
      }
      reflections: {
        Row: Reflection
        Insert: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Reflection, 'id' | 'created_at' | 'updated_at'>>
      }
      generated_messages: {
        Row: GeneratedMessage
        Insert: Omit<GeneratedMessage, 'id' | 'created_at'>
        Update: Partial<Omit<GeneratedMessage, 'id' | 'created_at'>>
      }
    }
  }
}

// 型安全なSupabaseクライアント
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey) 