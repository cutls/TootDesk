import type { ButtonProps, HostProps } from '@expo/ui/swift-ui'
import type React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { Button } from './Button'

interface Props extends ButtonProps {
	style?: HostProps['style']
	color?: string
	isPrimary?: boolean
}
export function CustomedButton({ isPrimary, color, ...props }: Props) {
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	return (
		<Button variant={isPrimary ? 'borderedProminent' : 'bordered'} onPress={props.onPress} style={[styles.btn, props.style]}>
			<View style={{ justifyContent: 'center', height: 40 }}>
				<Text style={[{ width: width - 65, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: isPrimary ? 'white' : color }]}>{props.children}</Text>
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
