import { useColorScheme, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

export const Followed = () => {
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const color = isDark ? 'white' : 'black'
	return (
		<View style={{ width: 24, height: 24 }}>
			<Svg fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<Path d="M6 8L2 12L6 16" />
				<Path d="M2 12H22" />
			</Svg>
		</View>
	)
}
