import * as Localization from 'expo-localization'
import { I18n } from 'i18n-js'
import en from '../i18n/en.json'
const i18n = new I18n({ en })
i18n.locale = Localization.getLocales()[0].languageCode
i18n.missingTranslation.register('jaFallback',(i18n, scope, options) => scope.toString())
i18n.missingTranslation.register('enFallback',(i18n, scope, options) => i18n.translations.en[scope.toString()])
i18n.missingBehavior = 'enFallback'

export default i18n