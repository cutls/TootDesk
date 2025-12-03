import { Image } from 'expo-image'
import React from 'react'
import { TouchableOpacity } from 'react-native'

interface Props {
	src: string | null
	size: number
	onPress?: () => void
}
export default function Avatar({ src, size, onPress }: Props) {
	const hasOnPress = typeof onPress === 'function'
	const localImage = require('../assets/images/icon.png')
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={hasOnPress ? 0.7 : 1} style={{ width: size, height: size, borderRadius: size / 5, overflow: 'hidden' }}>
			<Image source={src ? { uri: src } : localImage} style={{ width: size, height: size }} />
		</TouchableOpacity>
	)
}
