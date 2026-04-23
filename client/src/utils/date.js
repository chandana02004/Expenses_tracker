import useStore from '@/store/useStore'

const LANG_LOCALE = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR' }

function getLocale() {
  const language = useStore.getState().language ?? 'en'
  return LANG_LOCALE[language] ?? 'en-US'
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-')
  return new Date(year, month - 1).toLocaleDateString(getLocale(), {
    month: 'short',
    year: 'numeric',
  })
}
