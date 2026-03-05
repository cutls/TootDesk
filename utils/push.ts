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
					token = (await Notifications.getDevicePushTokenAsync()).data
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
			const prepareRaw = await fetch(`https://${pushDomain}/v2/prepare`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					domain: acct.domain,
					token,
					platform: 'ios'
				})
			})
			const prepare = await prepareRaw.json()
			if (!prepare.success) {
				console.log('prepare error')
				Alert.alert(t('login.push.pushNotificationFailed'))
				return false
			}
			await fetch(`https://${acct.domain}/api/v1/push/subscription`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${acct.accessToken}`,
					'content-type': 'application/json'
				}
			})
			const param = {
				subscription: prepare.data.subscription,
				data: {
					alerts: {
						poll: true,
						follow: true,
						favourite: true,
						reblog: true,
						mention: true
					}
				}
			}
			const postRaw = await fetch(`https://${acct.domain}/api/v1/push/subscription`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${acct.accessToken}`,
					'content-type': 'application/json'
				},
				body: JSON.stringify(param)
			})
			const post = await postRaw.json()
			if (!postRaw.ok) {
				Alert.alert(t('login.push.pushNotificationFailed'))
				return false
			}
			await fetch(`https://${pushDomain}/v2/subscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: prepare.data.id,
					serverKey: post.server_key
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
export const pushDebug = async () => {
	const { status: existingStatus } = await Notifications.getPermissionsAsync()
	let finalStatus = existingStatus
	if (existingStatus !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync()
		finalStatus = status
	}
	if (finalStatus !== 'granted') {
		Alert.alert('login.push.pushNotificationDenied')
		return null
	}
	let token: string
	try {
		token = (await Notifications.getDevicePushTokenAsync()).data
		console.log(token)
		if (!token) {
			Alert.alert('login.push.pushNotificationFailed')
			return null
		}
		return token
	} catch (e) {
		Alert.alert('login.push.pushNotificationFailed')
		return null
	}
}
