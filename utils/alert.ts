interface AlertButton {
    text?: string
    style?: 'default' | 'cancel' | 'destructive'
}
interface AlertButtonLegacy extends AlertButton {
    onPress?: (value?: string) => void
}
interface AlertOptions {
    /** @platform android */
    cancelable?: boolean
    /** @platform android */
    onDismiss?: () => void
}
import { Platform, Alert } from 'react-native'
import i18n from './i18n'

export const alert = (title: string, message?: string, buttons?: AlertButtonLegacy[], options?: AlertOptions) => {
    if (Platform.OS !== 'web') {
        Alert.alert(title, message, buttons, options)
    } else {
        if (buttons) {
            if (confirm(`${title} - ${message}`)) {
                const ok = buttons[1] ? buttons[1] : undefined
                if (!ok) return true
                if (typeof ok.onPress === 'function') ok.onPress()
            }
        } else {
            alert(`${title} - ${message}`)
        }
    }
}
export const UNSAVE: AlertButton[] = [{ text: i18n.t('キャンセル'), style: 'cancel' }, { text: i18n.t('続行'), style: 'destructive' }]
export const DELETE: AlertButton[] = [{ text: i18n.t('キャンセル'), style: 'cancel' }, { text: i18n.t('削除'), style: 'destructive' },]
export const promise = async (title: string, message: string, buttons: AlertButton[] | string[], options?: AlertOptions) => {
    return new Promise((resolve:  (value: number) => void, reject) => {
        const useButton = []
        for (let i = 0; i < buttons.length; i++) {
            const useIt = buttons[i]
            const target = typeof useIt === 'string' ? { text: useIt } : useIt
            const buttonExt: AlertButtonLegacy = target
            buttonExt.onPress = () => resolve(i)
            useButton.push(buttonExt)
        }
        Alert.alert(title, message, useButton, options)
    })
}