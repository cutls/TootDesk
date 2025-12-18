import { Image } from 'expo-image'
import { SymbolView } from 'expo-symbols'
import React from 'react'
import { PlatformColor, TouchableOpacity, type ViewStyle } from 'react-native'

interface Props {
	src: string | null
	color?: string | null
	fallback?: 'appIcon' | 'mastodon' | 'misskey' | 'pleroma' | 'question'
	size: number
	onPress?: () => void
}
export default function Avatar({ src, size, fallback, color, onPress }: Props) {
	const hasOnPress = typeof onPress === 'function'
	const border: ViewStyle = color ? { borderWidth: 2, borderColor: PlatformColor(`system${color.charAt(0).toUpperCase() + color.slice(1)}`) } : { }
	const boxWidth = size + 5
	if (fallback === 'question') {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={hasOnPress ? 0.7 : 1} style={[{ width: boxWidth, height: boxWidth, borderRadius: boxWidth / 5, overflow: 'hidden', padding: 0.5 }, border]}>
				<SymbolView name="questionmark.app.dashed" type="monochrome" size={size} />
			</TouchableOpacity>
		)
	}
	const appIcon = require('../assets/images/icon.png')
	const mastodon = require('../assets/images/sns/mastodon.svg')
	const misskey = require('../assets/images/sns/misskey.png')
	const pleroma = require('../assets/images/sns/pleroma.svg')
	const localImage = fallback === 'mastodon' ? mastodon : fallback === 'misskey' ? misskey : fallback === 'pleroma' ? pleroma : appIcon
	if (!color) return <Image source={src ? { uri: src } : localImage} style={{ width: size, height: size, borderRadius: size / 5 }} contentFit="contain" />
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={hasOnPress ? 0.7 : 1} style={[[{ width: boxWidth, height: boxWidth, borderRadius: boxWidth / 5, overflow: 'hidden', padding: 0.5 }, border]]}>
			<Image source={src ? { uri: src } : localImage} style={{ width: size, height: size }} contentFit="contain" />
		</TouchableOpacity>
	)
}
