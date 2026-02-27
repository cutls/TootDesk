import type { Account } from '@/entities/account'
import { confirmDialog, CONTINUE } from '@/utils/alert'
import * as Notifications from 'expo-notifications'
import { Alert } from 'react-native'

export const pushNotf = async (acct: Account, pushDomain: string, t: (s: string, o?: any) => string) => {
	async function registerForPushNotificationsAsync(pushDomain: string) {
		let token = ''
		try {
			if (!token) {
				const { status: existingStatus } = await Notifications.getPermissionsAsync()
				let finalStatus = existingStatus
				if (existingStatus !== 'granted') {
					const { status } = await Notifications.requestPermissionsAsync()
					finalStatus = status
				}
				if (finalStatus !== 'granted') {
					Alert.alert(t('login.push.pushNotificationDenied'))
					return false
				}
				try {
					token = (await Notifications.getExpoPushTokenAsync()).data
					console.log(token)
					if (!token) {
						Alert.alert(t('login.push.pushNotificationFailed'))
						return false
					}
				} catch (e) {
					Alert.alert(t('login.push.pushNotificationFailed'))
					return false
				}
			} else {
				Alert.alert(t('login.push.pushNotificationFailed'))
			}
			await fetch(`https://${pushDomain}/subscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					at: acct.accessToken,
					domain: acct.domain,
					token,
					platform: 'expo'
				})
			})
			Alert.alert(t('login.push.pushSubscribed'), t('login.push.pushSubscribedMessage'))
			return true
		} catch (e) {
			return false
		}
	}
	if (acct.pushNotification) {
		await registerForPushNotificationsAsync(acct.pushNotification)
		return acct.pushNotification
	} else {
		const a = await confirmDialog(t('login.push.dialogTitle'), t('login.push.dialogMessage', { domain: pushDomain }), CONTINUE, (s) => t(s))
		if (a === 1) {
			await registerForPushNotificationsAsync(pushDomain)
			return pushDomain
		} else {
			return null
		}
	}
}
