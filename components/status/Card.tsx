import type { Entity } from '@cutls/megalodon'
import React from 'react'
import { PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Text } from '../themed/Text'

import { Image } from 'expo-image'
import { openBrowserAsync } from 'expo-web-browser'
interface IProps {
	card: Entity.Card
	columnWidth: number
}
export const Card = (props: IProps) => {
	const { card, columnWidth } = props
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const fontSize = 16
	return (
		<TouchableOpacity activeOpacity={0.7} onPress={() => openBrowserAsync(card.url)} style={{ display: 'flex', width: columnWidth, flexDirection: 'row', ...styles.container }}>
			<View style={{ display: 'flex', flexDirection: 'row' }}>
				<Image source={{ uri: card.image || '' }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} />
				<View style={{ flex: 0 }}>
					<Text numberOfLines={1} style={{ fontWeight: 'bold', fontSize: fontSize, width: columnWidth - 80 }}>
						{card.title}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: fontSize * 0.9, width: columnWidth - 80 }}>
						{card.description}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: fontSize * 0.8, color: PlatformColor('systemGray'), width: columnWidth - 80 }}>
						{card.provider_name}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 5,
		borderWidth: 1,
		borderColor: PlatformColor('systemGray3'),
		borderRadius: 8,
		marginTop: 5
	}
})
