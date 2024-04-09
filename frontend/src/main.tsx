import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "./style.scss"
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from '../i18n'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n.use(initReactI18next).use(LanguageDetector).init({
  resources,
  fallbackLng: 'en'
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
