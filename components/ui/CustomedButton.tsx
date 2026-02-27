import { useWindowSize } from '@/hooks/useWindowSize'
import type { ButtonProps, HostProps } from '@expo/ui/swift-ui'
import { SymbolView } from 'expo-symbols'
import type React from 'react'
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native'
import { Text } from '../themed/Text'
import { ButtonSwiftUI } from './Button'

interface Props extends ButtonProps {
	style?: HostProps['style']
	color?: string
	isPrimary?: boolean
	width?: number
	isGlass?: boolean
	isLoading?: boolean
}
export function CustomedButton({ isPrimary, color, width: requestedWidth, isLoading, systemImage, ...props }: Props) {
	const { width: screenWidth } = useWindowSize()
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const width = requestedWidth || screenWidth
	const styles = createStyles({ width })
	const useVariantNotGlass = isPrimary ? 'borderedProminent' : 'bordered'
	const useVariantGlass = isPrimary ? 'glassProminent' : 'glass'
	const variant = props.isGlass ? useVariantGlass : useVariantNotGlass

	return (
		<ButtonSwiftUI variant={variant} disabled={isLoading} onPress={() => (isLoading || !props.onPress) ? {} : props.onPress()} color={isPrimary ? color : undefined} style={[styles.btn, props.style]}>
			<View style={{ justifyContent: 'center', height: 40, flexDirection: 'row', alignItems: 'center', width: width - 65 }}>
				{systemImage && !isLoading && <SymbolView name={systemImage} type="monochrome" tintColor={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} size={20} style={{ marginRight: 5 }} />}
				{isLoading && <ActivityIndicator size="small" color={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} style={{ width: width - 65 }} />}
				{!isLoading && <Text style={[{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black' }]}>{props.children}</Text>}
			</View>
		</ButtonSwiftUI>
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
