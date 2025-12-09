import { useColorScheme, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

export const RequestingFollowed = () => {
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const color = isDark ? 'white' : 'black'
	return (
		<View style={{ width: 24, height: 24 }}>
			<Svg fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<Path d="m16 3 4 4-4 4" />
				<Path d="M20 7H4" strokeDasharray="2 3" />
				<Path d="m8 21-4-4 4-4" />
				<Path d="M4 17h16" />
			</Svg>
		</View>
	)
}
