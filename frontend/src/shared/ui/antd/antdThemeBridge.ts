import type { ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import {
  getAdminDensity,
  getAdminLang,
  getAdminThemePreference,
  resolveAdminTheme,
  type AdminDensity,
  type AdminLang,
} from '../../../auth/uiPreferences'

function parseRemValue(raw: string, fallbackPx: number): number {
  const value = raw.trim()
  if (!value) return fallbackPx
  if (value.endsWith('rem')) {
    const rem = Number.parseFloat(value.slice(0, -3))
    if (!Number.isFinite(rem)) return fallbackPx
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    return rem * rootPx
  }
  const px = Number.parseFloat(value)
  return Number.isFinite(px) ? px : fallbackPx
}

function getCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return val || fallback
}

export type AntdUiSettings = {
  resolvedTheme: 'light' | 'dark'
  density: AdminDensity
  lang: AdminLang
}

export function readAntdUiSettings(): AntdUiSettings {
  return {
    resolvedTheme: resolveAdminTheme(getAdminThemePreference()),
    density: getAdminDensity(),
    lang: getAdminLang(),
  }
}

export function getAntdLocale(lang: AdminLang) {
  return lang === 'en' ? enUS : viVN
}

export function buildAntdThemeConfig(settings: AntdUiSettings): ThemeConfig {
  const fontFamily = getCssVar('--th-font-sans', "system-ui, 'Segoe UI', Roboto, Arial, sans-serif")
  const sizeSm = parseRemValue(getCssVar('--th-text-sm', '0.8125rem'), 13)
  const sizeMd = parseRemValue(getCssVar('--th-text-md', '0.875rem'), 14)
  const sizeLg = parseRemValue(getCssVar('--th-text-lg', '0.9375rem'), 15)
  const lineHeight = Number.parseFloat(getCssVar('--th-leading-normal', '1.5')) || 1.5
  const weightStrong = Number.parseFloat(getCssVar('--th-weight-semibold', '600')) || 600

  const isDark = settings.resolvedTheme === 'dark'

  return {
    token: {
      fontFamily,
      fontSize: sizeMd,
      fontSizeSM: sizeSm,
      fontSizeLG: sizeLg,
      lineHeight,
      fontWeightStrong: weightStrong,
      borderRadius: 10,
      colorPrimary: isDark ? '#38bdf8' : '#0369a1',
      colorInfo: isDark ? '#38bdf8' : '#0284c7',
      colorSuccess: isDark ? '#4ade80' : '#16a34a',
      colorWarning: isDark ? '#facc15' : '#d97706',
      colorError: isDark ? '#fb7185' : '#dc2626',
      colorBgLayout: isDark ? '#0b1220' : '#f8fafc',
      colorBgContainer: isDark ? '#0f172a' : '#ffffff',
      colorBorder: isDark ? '#1e293b' : '#cbd5e1',
    },
    components: {
      Table: {
        headerBg: isDark ? '#111827' : '#f8fafc',
        headerColor: isDark ? '#e2e8f0' : '#0f172a',
        rowHoverBg: isDark ? '#172033' : '#f1f5f9',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
      },
      Input: {
        activeBorderColor: isDark ? '#38bdf8' : '#0ea5e9',
        hoverBorderColor: isDark ? '#38bdf8' : '#0ea5e9',
      },
      Select: {
        optionSelectedBg: isDark ? '#172033' : '#e0f2fe',
      },
      Pagination: {
        itemBg: isDark ? '#0f172a' : '#ffffff',
      },
    },
  }
}
