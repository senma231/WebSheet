/**
 * 格式化日期
 * @param dateString ISO 8601格式的日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  // 今天内
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    if (diffMin < 1) {
      return '刚刚'
    } else if (diffMin < 60) {
      return `${diffMin}分钟前`
    } else {
      return `${diffHour}小时前`
    }
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `昨天 ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  }
  
  // 一周内
  if (diffDay < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${weekdays[date.getDay()]} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  }
  
  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  }
  
  // 其他情况
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
}

/**
 * 数字补零
 * @param num 数字
 * @returns 补零后的字符串
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

/**
 * 格式化相对时间
 * @param dateString ISO 8601格式的日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)
  
  if (diffSec < 60) {
    return '刚刚'
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`
  } else if (diffHour < 24) {
    return `${diffHour}小时前`
  } else if (diffDay < 30) {
    return `${diffDay}天前`
  } else if (diffMonth < 12) {
    return `${diffMonth}个月前`
  } else {
    return `${diffYear}年前`
  }
}
