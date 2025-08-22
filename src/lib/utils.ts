
/**
 * 日時を日本時間で表示用フォーマットで返す
 * @param dateStr 日時の文字列
 * @returns 日本時間のフォーマット済み文字列
 */
export const formatDateTimeToJST = (dateStr: string): string => {
  // 日付のみの形式（YYYY-MM-DD）をチェック
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
  
  if (dateOnlyPattern.test(dateStr)) {
    // 日付のみの場合は日付のみを表示
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tokyo'
    })
  }
  
  // ISO形式の日時文字列の場合は時刻も表示
  const date = new Date(dateStr)
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo'
  })
}

/**
 * 日時を日本時間で日付のみ表示用フォーマットで返す
 * @param dateStr 日時の文字列
 * @returns 日本時間の日付フォーマット済み文字列
 */
export const formatDateToJST = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Tokyo'
  })
}

