/** Tùy chọn giao diện khu vực admin — lưu localStorage, áp dụng lên document.documentElement */

export const ADMIN_THEME_PREF_KEY = 'tunhuaerp_admin_theme_pref'
export const ADMIN_DENSITY_KEY = 'tunhuaerp_admin_density'
export const ADMIN_LANG_KEY = 'tunhuaerp_admin_lang'
export const UI_PREFERENCES_CHANGED_EVENT = 'th-ui-preferences-changed'

export type AdminThemePreference = 'light' | 'dark' | 'system'
export type AdminDensity = 'comfortable' | 'compact'
export type AdminLang = 'vi' | 'en'

const DEFAULT_THEME: AdminThemePreference = 'light'
const DEFAULT_DENSITY: AdminDensity = 'comfortable'
const DEFAULT_LANG: AdminLang = 'vi'

function notifyUiPreferenceChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(UI_PREFERENCES_CHANGED_EVENT))
}

export function getAdminThemePreference(): AdminThemePreference {
  try {
    const raw = localStorage.getItem(ADMIN_THEME_PREF_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

export function setAdminThemePreference(value: AdminThemePreference): void {
  try {
    localStorage.setItem(ADMIN_THEME_PREF_KEY, value)
  } catch {
    /* ignore */
  }
  notifyUiPreferenceChanged()
}

export function resolveAdminTheme(pref: AdminThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref === 'dark' ? 'dark' : 'light'
}

export function applyAdminThemeToDocument(): void {
  const resolved = resolveAdminTheme(getAdminThemePreference())
  document.documentElement.setAttribute('data-admin-theme', resolved)
  notifyUiPreferenceChanged()
}

export function getAdminDensity(): AdminDensity {
  try {
    const raw = localStorage.getItem(ADMIN_DENSITY_KEY)
    if (raw === 'comfortable' || raw === 'compact') return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_DENSITY
}

export function setAdminDensity(value: AdminDensity): void {
  try {
    localStorage.setItem(ADMIN_DENSITY_KEY, value)
  } catch {
    /* ignore */
  }
  notifyUiPreferenceChanged()
}

export function applyAdminDensityToDocument(): void {
  const d = getAdminDensity()
  document.documentElement.setAttribute('data-admin-density', d)
  notifyUiPreferenceChanged()
}

export function getAdminLang(): AdminLang {
  try {
    const raw = localStorage.getItem(ADMIN_LANG_KEY)
    if (raw === 'vi' || raw === 'en') return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG
}

export function setAdminLang(value: AdminLang): void {
  try {
    localStorage.setItem(ADMIN_LANG_KEY, value)
  } catch {
    /* ignore */
  }
  notifyUiPreferenceChanged()
}

export function applyAdminUiPreferences(): void {
  applyAdminThemeToDocument()
  applyAdminDensityToDocument()
}

let themeMediaListenerAttached = false

/** Gọi một lần khi khởi động app: khi chọn “Theo hệ thống”, cập nhật khi OS đổi sáng/tối */
export function attachAdminThemeMediaListener(): void {
  if (themeMediaListenerAttached || typeof window === 'undefined') return
  themeMediaListenerAttached = true
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (getAdminThemePreference() === 'system') {
      applyAdminThemeToDocument()
    }
  })
}
