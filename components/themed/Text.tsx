import type React from 'react'
import { Text as DefaultText, useColorScheme } from 'react-native'

export function Text({ style, ...props }: React.ComponentProps<typeof DefaultText>) {
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	return <DefaultText style={[{ color: isDark ? 'white' : 'black' }, style]} {...props} />
}
