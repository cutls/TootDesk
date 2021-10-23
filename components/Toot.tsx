import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Platform, Image, Dimensions, ActionSheetIOS } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import HTML, { extendDefaultRenderer, HTMLContentModel } from 'react-native-render-html'
import * as WebBrowser from 'expo-web-browser'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import Card from './Card'
import moment from 'moment-timezone'
import 'moment/locale/ja'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
moment.locale('ja')
moment.tz.setDefault('Asia/Tokyo')
const deviceWidth = Dimensions.get('window').width
interface FromTimelineToToot {
	toot: M.Toot
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
	statusPost: (action: 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete', id: string, changeStatus: React.Dispatch<any>) => void
	deletable: boolean
	reply: (id: string, acct: string) => void
	navigation: StackNavigationProp<ParamList, any>
	acctId: string
}

const renderers = {
	img: extendDefaultRenderer('img', {
		contentModel: HTMLContentModel.mixed,
	}),
}

export default (props: FromTimelineToToot) => {
	const { toot: rawToot, imgModalTrigger, statusPost, reply, navigation, acctId, deletable } = props
	const toot = rawToot.reblog ? rawToot.reblog : rawToot
	let topComponent: null | JSX.Element = null
	const [boosted, setBoosted] = useState({ is: rawToot.reblogged, ct: rawToot.reblogs_count })
	const [faved, setFaved] = useState({ is: toot.favourited, ct: toot.favourites_count })

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
					<Image source={{ uri: mid.url }} style={{ width: (deviceWidth - 80) / media.length, height: 50, borderWidth: 1 }} />
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
	const actionSheet = (id: string) => {
		if(!deletable) return navigation.navigate('Toot', { acctId, id: toot.id, notification: false })
		const options = ['詳細', '削除', 'キャンセル']
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				destructiveButtonIndex: 1,
				cancelButtonIndex: 2
			},
			(buttonIndex) => {
				if (buttonIndex === 0) return navigation.navigate('Toot', { acctId, id: toot.id, notification: false })
				if (buttonIndex === 1) return statusPost('delete', id, setFaved )
			})
	}
	return (
		<View style={styles.container}>
			{topComponent}
			<View style={styles.horizonal}>
				<TouchableOpacity style={styles.center} onPress={() => navigation.navigate('AccountDetails', { acctId, id: toot.account.id, notification: false })}>
					<Image source={{ uri: toot.account.avatar }} style={{ width: 50, height: 50, borderRadius: 5 }} />
					<Text style={{ color: '#9a9da1', fontSize: 12 }}>{moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}</Text>
					<MaterialIcons name={visiIcon} style={{ marginTop: 5 }} />

				</TouchableOpacity>
				<View style={{ width: '100%', marginLeft: 10 }}>
					<View style={[styles.horizonal, styles.sameHeight]}>
						<AccountName account={toot.account} />
						{toot.account.locked ? <MaterialIcons name="lock" style={{ color: '#a80000', marginLeft: 5 }} /> : null}
					</View>
					<View style={[styles.horizonal, styles.sameHeight]}>
						<Text numberOfLines={1} style={{ color: '#9a9da1', fontSize: 12 }}>@{toot.account.acct} {moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').format('\'YY年M月D日 HH:mm:ss')}</Text>
					</View>
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
						<MaterialIcons name="reply" size={27} style={styles.actionIcon} color="#9a9da1" onPress={() => reply(toot.id, toot.account.acct)} />
						<Text style={styles.actionCounter}>{toot.replies_count}</Text>
						<MaterialCommunityIcons name="twitter-retweet" size={27} style={styles.actionIcon} color={boosted.is ? '#03a9f4' : '#9a9da1'} onPress={() => statusPost(boosted.is ? 'unboost' : 'boost', rawToot.id, setBoosted)} />
						<Text style={styles.actionCounter}>{boosted.ct}</Text>
						<MaterialIcons name="star" size={27} style={styles.actionIcon} color={faved.is ? '#fbc02d' : '#9a9da1'} onPress={() => statusPost(faved.is ? 'unfav' : 'fav', toot.id, setFaved)} />
						<Text style={styles.actionCounter}>{faved.ct}</Text>
						<MaterialIcons name="more-vert" size={27} style={styles.actionIcon} onPress={() => actionSheet(toot.id)} color="#9a9da1" />
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
		alignItems: 'center'
	},
	actionIcon: {
		marginHorizontal: 20,
	},
	actionCounter: {
		color: '#9a9da1'
	}
})
