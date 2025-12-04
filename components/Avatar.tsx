import { Image } from 'expo-image'
import { SymbolView } from 'expo-symbols'
import React from 'react'
import { TouchableOpacity } from 'react-native'

interface Props {
	src: string | null
	fallback?: 'appIcon' | 'mastodon' | 'misskey' | 'pleroma' | 'question'
	size: number
	onPress?: () => void
}
export default function Avatar({ src, size, fallback, onPress }: Props) {
	const hasOnPress = typeof onPress === 'function'
	if (fallback === 'question') {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={hasOnPress ? 0.7 : 1} style={{ width: size, height: size, borderRadius: size / 5, overflow: 'hidden' }}>
				<SymbolView name="questionmark.app.dashed" type="monochrome" size={size} />
			</TouchableOpacity>
		)
	}
	const appIcon = require('../assets/images/icon.png')
	const mastodon = require('../assets/images/sns/mastodon.svg')
	const misskey = require('../assets/images/sns/misskey.png')
	const pleroma = require('../assets/images/sns/pleroma.svg')
	const localImage = fallback === 'mastodon' ? mastodon : fallback === 'misskey' ? misskey : fallback === 'pleroma' ? pleroma : appIcon
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={hasOnPress ? 0.7 : 1} style={{ width: size, height: size, borderRadius: size / 5, overflow: 'hidden' }}>
			<Image source={src ? { uri: src } : localImage} style={{ width: size, height: size }} contentFit="contain" />
		</TouchableOpacity>
	)
}
