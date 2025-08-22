"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord } from '../lib/supabase'

// 拡張された記録タイプ（学生名含む）
interface ExtendedStudyRecord extends StudyRecord {
  student_name: string
}

type SortField = 'date' | 'student_name' | 'subject' | 'accuracy'
type SortDirection = 'asc' | 'desc'

export default function TeacherRecordsPage() {
  const [records, setRecords] = useState<ExtendedStudyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // ソート状態
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // フィルター状態
  const [studentFilter, setStudentFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      
      // 指導者モード: 全学生の学習記録を取得（これは正常な動作）
      const { data, error } = await supabase
        .from('study_records')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      // データを整形（student_idをstudent_nameとして使用）
      const formattedRecords: ExtendedStudyRecord[] = (data || []).map(record => ({
        ...record,
        student_name: record.student_id || '不明'
      }))

      setRecords(formattedRecords)
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
      if (subjectFilter && record.subject !== subjectFilter) {
        return false
      }
      if (dateFilter && !record.study_date.includes(dateFilter)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      if (sortField === 'accuracy') {
        aValue = (a.questions_correct / a.questions_total) * 100
        bValue = (b.questions_correct / b.questions_total) * 100
      } else if (sortField === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else if (sortField === 'student_name') {
        aValue = a.student_name
        bValue = b.student_name
      } else if (sortField === 'subject') {
        aValue = a.subject
        bValue = b.subject
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
  const uniqueSubjects = [...new Set(records.map(r => r.subject))].sort()

  // CSV エクスポート機能
  const exportToCSV = () => {
    const headers = [
      '記録日時',
      '学生名',
      '科目',
      '種別',
      '学習実施日',
      '挑戦回数',
      '問題数',
      '正解数',
      '正答率',
      '気持ち',
      'コメント'
    ]
    
    const csvData = filteredAndSortedRecords.map(record => [
      new Date(record.date).toLocaleString('ja-JP'),
      record.student_name,
      getSubjectLabel(record.subject),
      getContentTypeLabel(record.content_type),
      new Date(record.study_date).toLocaleDateString('ja-JP'),
      record.attempt_number,
      record.questions_total,
      record.questions_correct,
      Math.round((record.questions_correct / record.questions_total) * 100) + '%',
      record.emotion === 'good' ? 'よくできた' : record.emotion === 'normal' ? '普通' : '難しかった',
      record.comment || ''
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `学習記録_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`)
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
          <p className="harmonious-text-lg">全学生の学習記録を一覧・管理できます</p>
        </div>

        {/* フィルター */}
        <div className="harmonious-card mb-6">
          <h2 className="harmonious-header-3 mb-4">🔍 フィルター・検索</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                科目で絞り込み
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <h2 className="harmonious-header-3 mb-4">📋 学習記録一覧</h2>
          
          {filteredAndSortedRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg text-slate-600">表示する記録がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1200px]">
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
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">気持ち</th>
                    <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">コメント</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
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
                        <span className="font-medium text-blue-700">
                          {record.student_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {getSubjectLabel(record.subject)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          record.content_type === 'class' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {getContentTypeLabel(record.content_type)}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {new Date(record.study_date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                          {record.attempt_number}回目
                        </span>
                      </td>
                      <td className="p-3">
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
                      </td>
                      <td className="p-3 text-lg">
                        {getEmotionLabel(record.emotion)}
                      </td>
                      <td className="p-3 max-w-xs">
                        {record.comment ? (
                          <div className="text-sm text-slate-600 truncate" title={record.comment}>
                            {record.comment}
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {filteredAndSortedRecords.length}
              </div>
              <div className="harmonious-metrics-label">総記録数</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {uniqueStudents.length}
              </div>
              <div className="harmonious-metrics-label">学生数</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {Math.round(
                  filteredAndSortedRecords.reduce((sum, record) => 
                    sum + (record.questions_correct / record.questions_total) * 100, 0
                  ) / filteredAndSortedRecords.length
                )}%
              </div>
              <div className="harmonious-metrics-label">平均正答率</div>
            </div>
            <div className="harmonious-metrics-card">
              <div className="harmonious-metrics-value">
                {Math.round(
                  filteredAndSortedRecords.filter(record => 
                    (record.questions_correct / record.questions_total) * 100 >= 80
                  ).length / filteredAndSortedRecords.length * 100
                )}%
              </div>
              <div className="harmonious-metrics-label">80%以上達成率</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}