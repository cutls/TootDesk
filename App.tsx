import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'

//import screens
import Root from './screens/Root'
import AccountManager from './screens/AccountManager'
import AccountDetails from './screens/AccountDetails'
import Toot from './screens/Toot'
import TimelineOnly from './screens/TimelineOnly'
const Stack = createStackNavigator()
const LinkingConfiguration = {
	prefixes: [Linking.makeUrl('/')],
	config: {
		screens: {
			Root: '',
			AccountManager: 'account',
			AccountDetails: 'account_details',
			Toot: 'toot'
		},
	},
}
export default function App() {
	React.useEffect(() => {
		const subscription = Notifications.addNotificationResponseReceivedListener(response => {
			const data = response.notification.request.content.data
			console.log(data)
			// if you got toot notif
			if (data.type !== 'follow') Linking.openURL(Linking.createURL('toot') + `?at=${data.access_token}&notfId=${data.notification_id}&notification=true&domain=${data.domain}`)
			if (data.type === 'follow') Linking.openURL(Linking.createURL('account_details') + `?at=${data.access_token}&notfId=${data.notification_id}&notification=true&domain=${data.domain}`)

		})
		return () => subscription.remove()
	}, [])
	return (
		<NavigationContainer linking={LinkingConfiguration}>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Root" component={Root} />
				<Stack.Screen name="AccountManager" component={AccountManager} options={{ headerShown: true, title: 'アカウント管理' }} />
				<Stack.Screen name="Toot" component={Toot} options={{ headerShown: true, title: 'トゥート詳細' }} />
				<Stack.Screen name="AccountDetails" component={AccountDetails} options={{ presentation: 'modal' }} />
				<Stack.Screen name="TimelineOnly" component={TimelineOnly} options={{ presentation: 'modal' }} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}
