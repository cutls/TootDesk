import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import * as Linking from 'expo-linking'

//import screens
import Root from './screens/Root'
import AccountManager from './screens/AccountManager'
const Stack = createStackNavigator()
const LinkingConfiguration = {
	prefixes: [Linking.makeUrl('/')],
	config: {
	  screens: {
		Root: '',
		AccountManager: 'account',
	  },
	},
  }
export default function App() {
	return (
		<NavigationContainer linking={LinkingConfiguration}>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Root" component={Root} />
				<Stack.Screen name="AccountManager" component={AccountManager} options={{ headerShown: true, title: 'アカウント管理' }} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}
