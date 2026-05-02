import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { App as AntdApp, ConfigProvider, theme } from 'antd'
import {
  ADMIN_DENSITY_KEY,
  ADMIN_LANG_KEY,
  ADMIN_THEME_PREF_KEY,
  UI_PREFERENCES_CHANGED_EVENT,
} from '../../../auth/uiPreferences'
import { buildAntdThemeConfig, getAntdLocale, readAntdUiSettings, type AntdUiSettings } from './antdThemeBridge'

function shouldRefreshFromStorage(event: StorageEvent): boolean {
  if (!event.key) return false
  return event.key === ADMIN_THEME_PREF_KEY || event.key === ADMIN_DENSITY_KEY || event.key === ADMIN_LANG_KEY
}

export function AntdAppProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AntdUiSettings>(() => readAntdUiSettings())

  useEffect(() => {
    const sync = () => setSettings(readAntdUiSettings())
    const onStorage = (event: StorageEvent) => {
      if (shouldRefreshFromStorage(event)) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(UI_PREFERENCES_CHANGED_EVENT, sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(UI_PREFERENCES_CHANGED_EVENT, sync)
    }
  }, [])

  const antdTheme = useMemo(() => {
    return {
      ...buildAntdThemeConfig(settings),
      algorithm: settings.resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }
  }, [settings])

  const locale = useMemo(() => getAntdLocale(settings.lang), [settings.lang])

  return (
    <ConfigProvider
      locale={locale}
      componentSize={settings.density === 'compact' ? 'small' : 'middle'}
      theme={antdTheme}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
