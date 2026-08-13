export const EMPTY_PROFILE = {
  name: '',
  birthDate: '',
  birthTime: '',
  gender: '',
  calendarType: 'solar',
}

export function formatGender(gender) {
  if (gender === 'male') return '남성'
  if (gender === 'female') return '여성'
  return ''
}

export function formatMeta(profile) {
  return [
    profile.birthDate,
    profile.birthTime,
    formatGender(profile.gender),
    profile.calendarType === 'lunar' ? '음력' : '양력',
  ]
    .filter(Boolean)
    .join(' · ')
}

export function formatReadingDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function profileFromRow(row, fallbackName = '') {
  return {
    name: row?.name ?? fallbackName ?? '',
    birthDate: row?.birth_date ?? '',
    birthTime: row?.birth_time ? String(row.birth_time).slice(0, 5) : '',
    gender: row?.gender ?? '',
    calendarType: row?.calendar_type ?? 'solar',
  }
}

export function isProfileComplete(profile) {
  return Boolean(
    profile.name?.trim() &&
      profile.birthDate &&
      profile.gender &&
      profile.calendarType,
  )
}
