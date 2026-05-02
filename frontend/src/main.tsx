import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { applyAdminUiPreferences, attachAdminThemeMediaListener } from './auth/uiPreferences'
import { appLogoUrl } from './branding/appLogo'
import './branding/appLogo.css'
import { AntdAppProvider } from './shared/ui/antd/AntdAppProvider'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

function applyAppFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = 'image/jpeg'
  link.href = href

  let apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (!apple) {
    apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    document.head.appendChild(apple)
  }
  apple.href = href
}

applyAppFavicon(appLogoUrl)
applyAdminUiPreferences()
attachAdminThemeMediaListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AntdAppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AntdAppProvider>
  </StrictMode>,
)
