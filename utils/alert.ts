interface AlertButton {
	text?: string
	style?: 'default' | 'cancel' | 'destructive'
	position?: 'neutral' | 'negative' | 'positive'
}
export interface AlertButtonLegacy extends AlertButton {
	onPress?: (value?: string) => void
}
interface AlertOptions {
	/** @platform android */
	cancelable?: boolean
	/** @platform android */
	onDismiss?: () => void
}
import { Alert } from 'react-native'

export const CONTINUE: AlertButton[] = [
	{ text: 'cancel', style: 'cancel', position: 'negative' },
	{ text: 'continue', style: 'destructive', position: 'positive' }
]
export const DELETE: AlertButton[] = [
	{ text: 'cancel', style: 'cancel', position: 'negative' },
	{ text: 'delete', style: 'destructive', position: 'positive' }
]
export const YESNO: AlertButton[] = [
	{ text: 'no', style: 'default', position: 'negative' },
	{ text: 'yes', style: 'cancel', position: 'positive' }
]
export const confirmDialog = async (title: string, message: string, buttons: AlertButton[] | string[], t: (s: string) => string, options?: AlertOptions) => {
	return new Promise((resolve: (value: number) => void, reject) => {
		const useButton = []
		for (let i = 0; i < buttons.length; i++) {
			const useIt = buttons[i]
			const target = typeof useIt === 'string' ? { text: t(useIt) } : { ...useIt, text: t(useIt.text || '') }
			const buttonExt: AlertButtonLegacy = target
			if (!buttonExt.position) {
				if (buttonExt.style === 'cancel') buttonExt.position = 'negative'
				else if (buttonExt.style === 'destructive') buttonExt.position = 'positive'
				else buttonExt.position = 'neutral'
			}
			buttonExt.onPress = () => resolve(i)
			useButton.push(buttonExt)
		}
		Alert.alert(title, message, useButton, options)
	})
}
