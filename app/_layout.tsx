import '@/utils/i18n'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'

export default function RootLayout() {
	const colorScheme = useColorScheme()

	return (
		<KeyboardProvider>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<Stack>
					<Stack.Screen name="index" options={{ headerShown: false }} />
				</Stack>
				<StatusBar style="auto" />
			</ThemeProvider>
		</KeyboardProvider>
	)
}
