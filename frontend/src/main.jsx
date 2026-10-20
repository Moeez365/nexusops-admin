import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const ICON_FONT_DESCRIPTOR = '24px "Material Symbols Outlined"'

async function waitForGoogleIcons() {
  const root = document.documentElement

  if (!('fonts' in document)) {
    root.classList.add('icons-loaded')
    return
  }

  try {
    const iconStylesheet = document.getElementById('google-material-symbols')
    if (iconStylesheet && !iconStylesheet.sheet) {
      await new Promise((resolve) => {
        iconStylesheet.addEventListener('load', resolve, { once: true })
        iconStylesheet.addEventListener('error', resolve, { once: true })
      })
    }

    const loadedFaces = await document.fonts.load(ICON_FONT_DESCRIPTOR, 'home')
    await document.fonts.ready

    if (
      loadedFaces.length > 0 ||
      document.fonts.check(ICON_FONT_DESCRIPTOR, 'home')
    ) {
      root.classList.add('icons-loaded')
      return
    }

    const handleFontLoaded = () => {
      if (document.fonts.check(ICON_FONT_DESCRIPTOR, 'home')) {
        root.classList.add('icons-loaded')
        document.fonts.removeEventListener('loadingdone', handleFontLoaded)
      }
    }

    document.fonts.addEventListener('loadingdone', handleFontLoaded)
  } catch {
    // Keep icons hidden if the Google icon font fails to load.
    alert("Icons failed to load because of some problem")
  }
}

waitForGoogleIcons()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
