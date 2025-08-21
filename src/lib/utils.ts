
/**
 * UTC時間を日本時間（JST）に変換して表示用フォーマットで返す
 * @param dateStr UTC時間の文字列
 * @returns 日本時間のフォーマット済み文字列
 */
export const formatDateTimeToJST = (dateStr: string): string => {
  const date = new Date(dateStr)
  // UTC時間を日本時間（JST）に変換
  const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  return jstDate.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * UTC時間を日本時間（JST）に変換して日付のみ表示用フォーマットで返す
 * @param dateStr UTC時間の文字列
 * @returns 日本時間の日付フォーマット済み文字列
 */
export const formatDateToJST = (dateStr: string): string => {
  const date = new Date(dateStr)
  // UTC時間を日本時間（JST）に変換
  const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  return jstDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

