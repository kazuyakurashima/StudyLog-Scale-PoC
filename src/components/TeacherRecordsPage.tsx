"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord, Feedback } from '../lib/supabase'

// 拡張された記録タイプ（学生名含む）
interface ExtendedStudyRecord extends StudyRecord {
  student_name: string
}

// 統合記録タイプ（学習記録とフィードバック記録を統合）
interface UnifiedRecord {
  id: string
  type: 'study' | 'feedback'
  date: string
  student_name: string
  // 学習記録用フィールド
  subject?: string
  content_type?: string
  study_date?: string
  attempt_number?: number
  questions_total?: number
  questions_correct?: number
  emotion?: string
  comment?: string
  // フィードバック記録用フィールド
  record_id?: number
  sender_type?: 'parent' | 'teacher'
  reaction_type?: string
  message?: string
}

type SortField = 'date' | 'student_name' | 'subject' | 'accuracy' | 'type'
type SortDirection = 'asc' | 'desc'

export default function TeacherRecordsPage() {
  const [records, setRecords] = useState<UnifiedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // ソート状態
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // フィルター状態
  const [studentFilter, setStudentFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'study' | 'feedback'>('all')

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      
      // 学習記録を取得
      const { data: studyData, error: studyError } = await supabase
        .from('study_records')
        .select('*')
        .order('date', { ascending: false })

      if (studyError) throw studyError

      // フィードバック記録を取得
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbackError) throw feedbackError

      // 学習記録を統合記録形式に変換
      const studyRecords: UnifiedRecord[] = (studyData || []).map(record => ({
        id: `study_${record.id}`,
        type: 'study' as const,
        date: record.date,
        student_name: record.student_id || '不明',
        subject: record.subject,
        content_type: record.content_type,
        study_date: record.study_date,
        attempt_number: record.attempt_number,
        questions_total: record.questions_total,
        questions_correct: record.questions_correct,
        emotion: record.emotion,
        comment: record.comment
      }))

      // フィードバック記録を統合記録形式に変換
      const feedbackRecords: UnifiedRecord[] = (feedbackData || []).map(feedback => ({
        id: `feedback_${feedback.id}`,
        type: 'feedback' as const,
        date: feedback.created_at,
        student_name: feedback.student_id || '不明',
        record_id: feedback.record_id,
        sender_type: feedback.sender_type,
        reaction_type: feedback.reaction_type,
        message: feedback.message
      }))

      // 全記録を統合して日付でソート
      const allRecords = [...studyRecords, ...feedbackRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setRecords(allRecords)
    } catch (error) {
      console.error('記録取得エラー:', error)
      setError('記録の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ソート処理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // フィルターとソートを適用
  const filteredAndSortedRecords = records
    .filter(record => {
      if (studentFilter && !record.student_name.toLowerCase().includes(studentFilter.toLowerCase())) {
        return false
      }
      if (recordTypeFilter !== 'all' && record.type !== recordTypeFilter) {
        return false
      }
      if (subjectFilter && record.subject !== subjectFilter) {
        return false
      }
      if (dateFilter) {
        const recordDate = record.type === 'study' ? record.study_date : record.date.split('T')[0]
        if (!recordDate?.includes(dateFilter)) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      if (sortField === 'accuracy') {
        aValue = a.type === 'study' && a.questions_total 
          ? (a.questions_correct! / a.questions_total) * 100 
          : -1
        bValue = b.type === 'study' && b.questions_total 
          ? (b.questions_correct! / b.questions_total) * 100 
          : -1
      } else if (sortField === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else if (sortField === 'student_name') {
        aValue = a.student_name
        bValue = b.student_name
      } else if (sortField === 'subject') {
        aValue = a.subject || ''
        bValue = b.subject || ''
      } else if (sortField === 'type') {
        aValue = a.type
        bValue = b.type
      } else {
        aValue = 0
        bValue = 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const getSubjectLabel = (subject: string) => {
    const subjects: Record<string, string> = {
      aptitude: '適性',
      japanese: '国語',
      math: '算数',
      science: '理科',
      social: '社会'
    }
    return subjects[subject] || subject
  }

  const getContentTypeLabel = (contentType: string) => {
    return contentType === 'class' ? '授業' : '宿題'
  }

  const getEmotionLabel = (emotion: string) => {
    const emotions: Record<string, string> = {
      good: '😊',
      normal: '😐',
      hard: '😞'
    }
    return emotions[emotion] || emotion
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const uniqueStudents = [...new Set(records.map(r => r.student_name))].sort()
  const uniqueSubjects = [...new Set(records.filter(r => r.subject).map(r => r.subject!))].sort()

  // CSV エクスポート機能
  const exportToCSV = () => {
    const headers = [
      '記録日時',
      'タイプ',
      '学生名',
      '科目',
      '種別',
      '学習実施日',
      '挑戦回数',
      '問題数',
      '正解数',
      '正答率',
      '気持ち/反応',
      'コメント'
    ]
    
    const csvData = filteredAndSortedRecords.map(record => [
      new Date(record.date).toLocaleString('ja-JP'),
      record.type === 'study' ? '学習記録' : '保護者記録',
      record.student_name,
      record.subject ? getSubjectLabel(record.subject) : '',
      record.content_type ? getContentTypeLabel(record.content_type) : 
        record.sender_type ? (record.sender_type === 'parent' ? '保護者' : '指導者') : '',
      record.study_date ? new Date(record.study_date).toLocaleDateString('ja-JP') : '',
      record.attempt_number || '',
      record.questions_total || '',
      record.questions_correct || '',
      record.questions_total && record.questions_correct !== undefined ? 
        Math.round((record.questions_correct / record.questions_total) * 100) + '%' : '',
      record.emotion ? 
        (record.emotion === 'good' ? 'よくできた' : record.emotion === 'normal' ? '普通' : '難しかった') :
        record.reaction_type ? 
          (record.reaction_type === 'clap' ? '拍手' : 
           record.reaction_type === 'thumbs' ? 'いいね' : 
           record.reaction_type === 'muscle' ? 'がんばれ' : '反応') : '',
      record.comment || record.message || ''
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `全記録_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg text-slate-600">記録を読み込んでいます...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg text-red-600">{error}</p>
            <button
              onClick={fetchRecords}
              className="mt-4 harmonious-button-primary"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="harmonious-header-1">📊 学習記録管理</h1>
          <p className="harmonious-text-lg">全学生の学習記録・保護者フィードバックを一覧・管理できます</p>
        </div>

        {/* フィルター */}
        <div className="harmonious-card mb-6">
          <h2 className="harmonious-header-3 mb-4">🔍 フィルター・検索</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                学生名で検索
              </label>
              <input
                type="text"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="学生名を入力..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                記録タイプで絞り込み
              </label>
              <select
                value={recordTypeFilter}
                onChange={(e) => setRecordTypeFilter(e.target.value as 'all' | 'study' | 'feedback')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全ての記録</option>
                <option value="study">学習記録</option>
                <option value="feedback">保護者記録</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                科目で絞り込み
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={recordTypeFilter === 'feedback'}
              >
                <option value="">全ての科目</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>
                    {getSubjectLabel(subject)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                日付で絞り込み
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-sm text-slate-600">
              {filteredAndSortedRecords.length} 件の記録を表示中（全 {records.length} 件）
              {filteredAndSortedRecords.length !== records.length && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  フィルター適用中
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStudentFilter('')
                  setSubjectFilter('')
                  setDateFilter('')
                  setRecordTypeFilter('all')
                }}
                className="harmonious-button-secondary text-sm"
              >
                フィルターをクリア
              </button>
              <button
                onClick={fetchRecords}
                className="harmonious-button-secondary text-sm"
              >
                🔄 更新
              </button>
              {filteredAndSortedRecords.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="harmonious-button-primary text-sm"
                >
                  📊 CSV出力
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 記録テーブル */}
        <div className="harmonious-card">
          <h2 className="harmonious-header-3 mb-4">📋 記録一覧（学習記録・保護者記録）</h2>
          
          {filteredAndSortedRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg text-slate-600">表示する記録がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1400px]">
                <thead className="bg-slate-50">
                  <tr className="border-b-2 border-slate-200">
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-slate-100 transition-colors font-semibold text-slate-700 whitespace-nowrap"
                      onClick={() => handleSort('date')}
                    >
                      記録日時 {getSortIcon('date')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-slate-100 transition-colors font-semibold text-slate-700 whitespace-nowrap"
                      onClick={() => handleSort('type')}
                    >
                      タイプ {getSortIcon('type')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-slate-100 transition-colors font-semibold text-slate-700 whitespace-nowrap"
                      onClick={() => handleSort('student_name')}
                    >
                      学生名 {getSortIcon('student_name')}
                    </th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-slate-100 transition-colors font-semibold text-slate-700 whitespace-nowrap"
                      onClick={() => handleSort('subject')}
                    >
                      科目 {getSortIcon('subject')}
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">種別</th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">学習実施日</th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">挑戦回数</th>
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-slate-100 transition-colors font-semibold text-slate-700 whitespace-nowrap"
                      onClick={() => handleSort('accuracy')}
                    >
                      成績 {getSortIcon('accuracy')}
                    </th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">気持ち/反応</th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">コメント</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        record.type === 'feedback' ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(record.date).toLocaleDateString('ja-JP')}
                          </div>
                          <div className="text-slate-500">
                            {new Date(record.date).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          record.type === 'study' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.type === 'study' ? '学習記録' : '保護者記録'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-blue-700">
                          {record.student_name}
                        </span>
                      </td>
                      <td className="p-3">
                        {record.subject ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {getSubjectLabel(record.subject)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.content_type ? (
                          <span className={`px-2 py-1 rounded text-sm ${
                            record.content_type === 'class' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {getContentTypeLabel(record.content_type)}
                          </span>
                        ) : record.sender_type ? (
                          <span className={`px-2 py-1 rounded text-sm ${
                            record.sender_type === 'parent' 
                              ? 'bg-pink-100 text-pink-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {record.sender_type === 'parent' ? '保護者' : '指導者'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {record.study_date ? (
                          new Date(record.study_date).toLocaleDateString('ja-JP')
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.attempt_number ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                            {record.attempt_number}回目
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.questions_total && record.questions_correct !== undefined ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {record.questions_correct}/{record.questions_total}
                            </div>
                            <div className={`text-xs ${
                              (record.questions_correct / record.questions_total) * 100 >= 80
                                ? 'text-green-600'
                                : (record.questions_correct / record.questions_total) * 100 >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {Math.round((record.questions_correct / record.questions_total) * 100)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-lg">
                        {record.emotion ? (
                          getEmotionLabel(record.emotion)
                        ) : record.reaction_type ? (
                          <span className="text-2xl">
                            {record.reaction_type === 'clap' ? '👏' : 
                             record.reaction_type === 'thumbs' ? '👍' : 
                             record.reaction_type === 'muscle' ? '💪' : '❤️'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        {(record.comment || record.message) ? (
                          <div className="text-sm text-slate-600 truncate" title={record.comment || record.message}>
                            {record.comment || record.message}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        {filteredAndSortedRecords.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {filteredAndSortedRecords.length}
              </div>
              <div className="harmonious-metrics-label">総記録数</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {filteredAndSortedRecords.filter(r => r.type === 'study').length}
              </div>
              <div className="harmonious-metrics-label">学習記録</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {filteredAndSortedRecords.filter(r => r.type === 'feedback').length}
              </div>
              <div className="harmonious-metrics-label">保護者記録</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {uniqueStudents.length}
              </div>
              <div className="harmonious-metrics-label">学生数</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {(() => {
                  const studyRecords = filteredAndSortedRecords.filter(r => 
                    r.type === 'study' && r.questions_total && r.questions_correct !== undefined
                  )
                  if (studyRecords.length === 0) return '-'
                  return Math.round(
                    studyRecords.reduce((sum, record) => 
                      sum + (record.questions_correct! / record.questions_total!) * 100, 0
                    ) / studyRecords.length
                  ) + '%'
                })()} 
              </div>
              <div className="harmonious-metrics-label">平均正答率</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}