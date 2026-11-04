import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

// Service Worker hanya untuk versi web (PWA).
// Di dalam APK (Capacitor) asset sudah dibundel, SW dimatikan agar tidak menyimpan versi lama.
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('KayaKu Service Worker Registered!', reg.scope))
      .catch((err) => console.log('Service Worker Failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
