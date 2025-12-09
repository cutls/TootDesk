import type { ButtonProps, HostProps } from '@expo/ui/swift-ui'
import type React from 'react'
import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { Button } from './Button'

interface Props extends ButtonProps {
	style?: HostProps['style']
	color?: string
	isPrimary?: boolean
	width?: number
	isGlass?: boolean
}
export function CustomedButton({ isPrimary, color, width: requestedWidth, ...props }: Props) {
	const { width: screenWidth } = useWindowDimensions()
		const colorScheme = useColorScheme()
		const isDark = colorScheme === 'dark'
	const width = requestedWidth || screenWidth
	const styles = createStyles({ width })
	const useVariantNotGlass = isPrimary ? 'borderedProminent' : 'bordered'
	const useVariantGlass = isPrimary ? 'glassProminent' : 'glass'
	const variant = props.isGlass ? useVariantGlass : useVariantNotGlass

	return (
		<Button variant={variant} onPress={props.onPress} color={isPrimary ? color : undefined} style={[styles.btn, props.style]}>
			<View style={{ justifyContent: 'center', height: 40 }}>
				<Text style={[{ width: width - 65, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: isPrimary ? 'white' : (color ? color : isDark ? 'white' : 'black') }]}>{props.children}</Text>
			</View>
		</Button>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		btn: {
			height: 50,
			display: 'flex',
			justifyContent: 'center',
			alignContent: 'center',
			width: width - 40
		}
	})
