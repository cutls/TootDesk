import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Platform, Image, Dimensions } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import HTML, { extendDefaultRenderer, HTMLContentModel } from 'react-native-render-html'
import * as WebBrowser from 'expo-web-browser'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import Card from './Card'
const deviceWidth = Dimensions.get('window').width
interface FromTimelineToToot {
	toot: M.Toot
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
}

const renderers = {
	img: extendDefaultRenderer('img', {
		contentModel: HTMLContentModel.mixed,
	}),
}

export default (props: FromTimelineToToot) => {
	const { toot: rawToot, imgModalTrigger } = props
	const toot = rawToot.reblog ? rawToot.reblog : rawToot
	let topComponent: null | JSX.Element = null

	const showMedia = (media: any) => {
		const ret = [] as JSX.Element[]
		const mediaUrl = [] as string[]
		for (const mid of media) {
			mediaUrl.push(mid.url)
		}
		let i = 0
		for (const mid of media) {
			let cloneI = parseInt(i.toString())
			ret.push(
				<TouchableOpacity onPress={() => imgModalTrigger(mediaUrl, cloneI, true)} key={mid.id}>
					<Image source={{ uri: mid.url }} style={{ width: (deviceWidth - 50) / media.length, height: 50, borderWidth: 1 }} />
				</TouchableOpacity>
			)
			i++
		}
		return ret
	}
	if (rawToot.reblog) {
		topComponent = (
			<View style={[styles.horizonal, styles.sameHeight]}>
				<MaterialCommunityIcons name="twitter-retweet" size={27} style={{ color: '#2b90d9' }} />
				<Image source={{ uri: rawToot.account.avatar }} style={{ width: 22, height: 22, marginHorizontal: 3, borderRadius: 5 }} />
				<AccountName account={rawToot.account} />
			</View>
		)
	}
	let visiIcon = 'help' as 'help' | 'public' | 'lock-open' | 'lock' | 'mail'
	let btable = true
	switch (toot.visibility) {
		case 'public':
			visiIcon = 'public'
			break
		case 'unlisted':
			visiIcon = 'lock-open'
			break
		case 'private':
			btable = false
			visiIcon = 'lock'
			break
		case 'direct':
			btable = false
			visiIcon = 'mail'
			break
	}

	return (
		<View style={styles.container}>
			{topComponent}
			<View style={styles.horizonal}>
				<View style={styles.center}>
					<Image source={{ uri: toot.account.avatar }} style={{ width: 50, height: 50, borderRadius: 5 }} />
					<MaterialIcons name={visiIcon} style={{ marginTop: 5 }} />
				</View>
				<View style={{ width: '100%', marginLeft: 10 }}>
					<View style={[styles.horizonal, styles.sameHeight]}>
						<AccountName account={toot.account} />
						{toot.account.locked ? <MaterialIcons name="lock" style={{ color: '#a80000', marginLeft: 5 }} /> : null}
					</View>
					<Text style={{ color: '#9a9da1', fontSize: 12 }}>@{toot.account.acct}</Text>
					<HTML
						source={{ html: emojify(toot.content, toot.emojis) }}
						tagsStyles={{ p: { margin: 0 } }}
						renderers={renderers}
						contentWidth={deviceWidth - 50}
						onLinkPress={async (e, href) => await WebBrowser.openBrowserAsync(href)}
					/>
					{toot.card ? <Card card={toot.card} /> : null}
					<View style={styles.horizonal}>{toot.media_attachments ? showMedia(toot.media_attachments) : null}</View>
					<View style={styles.actionsContainer}>
						<MaterialIcons name="reply" size={27} style={styles.actionIcon} />
						<MaterialCommunityIcons name="twitter-retweet" size={27} style={styles.actionIcon} />
						<MaterialIcons name="star" size={27} style={styles.actionIcon} />
						<MaterialIcons name="more-vert" size={27} style={styles.actionIcon} />
					</View>
				</View>
			</View>
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		marginVertical: 5,
		paddingHorizontal: 5,
		width: deviceWidth - 65,
	},
	horizonal: {
		flexDirection: 'row',
	},
	sameHeight: {
		alignItems: 'center',
	},
	center: {
		alignItems: 'center',
	},
	actionsContainer: {
		width: '100%',
		flexDirection: 'row',

		alignContent: 'center',
		justifyContent: 'center',
	},
	actionIcon: {
		color: '#9a9da1',
		marginHorizontal: 20,
	},
})
