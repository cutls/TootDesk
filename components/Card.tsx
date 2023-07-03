import * as M from '../interfaces/MastodonApiReturns'
import React, { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Image } from 'expo-image'
import { Text, TouchableOpacity } from './Themed'
interface FromTootToCard {
	card: M.Card
	width: number
}

export default (props: FromTootToCard) => {
	const { card, width } = props
    if(!card) return null
	return (
		<TouchableOpacity style={{ borderWidth: 1, borderRadius: 10, padding: 5 }} onPress={async () => await WebBrowser.openBrowserAsync(card.url)}>
			<Text>{card.title}</Text>
			<Text numberOfLines={3}>{card.description}</Text>
			{card.image ? <Image source={{ uri: card.image }} style={{ width: width - 87, height: 50 }} /> : null}
		</TouchableOpacity>
	)
}
