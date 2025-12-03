import en from '@/locales/en.json'
import ja from '@/locales/ja.json'
import * as Localization from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ja: { translation: ja }
	},
	lng: Localization.getLocales()[0]?.languageTag, // 端末の言語設定を適用
	fallbackLng: 'en', // 言語が見つからない場合は英語にフォールバック
	interpolation: {
		escapeValue: false
	}
})
