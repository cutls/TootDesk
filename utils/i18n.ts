import * as Localization from 'expo-localization'
import { Dict, I18n } from 'i18n-js'
import en from '../i18n/en.json'
const i18n = new I18n({ en })
const replacer = (scope: string, options: Dict) => {
    for (const [key, value] of Object.entries(options)) {
        const keyReg = new RegExp(`%{${key}}`, 'g')
        scope = scope.replace(keyReg, value)
    }
    return scope
}
const langCode = Localization.getLocales()[0].languageCode
i18n.locale = langCode
i18n.missingTranslation.register('jaFallback',(i18n, scope, options) => replacer(scope.toString(), options))
i18n.missingTranslation.register('enFallback',(i18n, scope, options) => replacer(i18n.translations.en[scope.toString()], options))
i18n.missingBehavior = langCode === 'ja' ? 'jaFallback' : 'enFallback'

export default i18n