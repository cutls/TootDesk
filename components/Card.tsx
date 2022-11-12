import * as M from '../interfaces/MastodonApiReturns'
import React, { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Dimensions, Image } from 'react-native'
import { Text, TouchableOpacity } from './Themed'
const deviceWidth = Dimensions.get('window').width
interface FromTootToCard {
	card: M.Card
}

export default (props: FromTootToCard) => {
	const { card } = props
    if(!card) return null
	return (
		<TouchableOpacity style={{ borderWidth: 1, borderRadius: 10, padding: 5 }} onPress={async () => await WebBrowser.openBrowserAsync(card.url)}>
			<Text>{card.title}</Text>
			<Text numberOfLines={3}>{card.description}</Text>
			{card.image ? <Image source={{ uri: card.image }} style={{ width: deviceWidth - 87, height: 50 }} /> : null}
		</TouchableOpacity>
	)
}
