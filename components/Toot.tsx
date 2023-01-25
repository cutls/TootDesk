import React, { useContext, useMemo, useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Platform, Image, Dimensions, ActionSheetIOS, useWindowDimensions, findNodeHandle, useColorScheme } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons'
import * as api from '../utils/api'
import * as WebBrowser from 'expo-web-browser'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import Card from './Card'
import moment from 'moment-timezone'
import 'moment/locale/ja'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { BlurView } from 'expo-blur'
import * as S from '../interfaces/Storage'
import * as storage from '../utils/storage'
import { statusPost } from '../utils/changeStatus'
import Poll from './Poll'
import { LoadingContext } from '../utils/context/loading'
import { commonStyle } from '../utils/styles'
import { ImageModalContext } from '../utils/context/imageModal'
import { SetConfigContext } from '../utils/context/config'
import { translate } from '../utils/tootAction'
import { mb2xCount, stripTags } from '../utils/stringUtil'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed,
	}),
}
moment.locale('ja')
moment.tz.setDefault('Asia/Tokyo')
interface FromTimelineToToot {
	toot: M.Toot
	deletable: boolean
	txtAction: (id: string, insertText: string, type: 'reply' | 'edit') => void
	navigation: StackNavigationProp<ParamList, any>
	acctId: string
	width: number
	tlId: number
}
const hasApp = (item: any): item is M.App => item && item.name
export default (props: FromTimelineToToot) => {
	const { toot: rawToot, txtAction, navigation, acctId, deletable, width, tlId } = props
	const styles = createStyle(width)
	const toot = rawToot.reblog ? rawToot.reblog : rawToot
	let topComponent: null | JSX.Element = null
	const [boosted, setBoosted] = useState({ is: rawToot.reblogged, ct: toot.reblogs_count })
	const [faved, setFaved] = useState({ is: toot.favourited, ct: toot.favourites_count })
	const [isCwShow, setIsCwShow] = useState(false)
	const [translatedToot, setTranslatedToot] = useState('')
	const { setLoading } = useContext(LoadingContext)
	const { setImageModal } = useContext(ImageModalContext)
	const { config } = useContext(SetConfigContext)
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const imgModalTrigger = (url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })
	const showMedia = (media: M.Attachment[], isSensitive: boolean) => {
		const ret = [] as JSX.Element[]
		const mediaUrl = [] as string[]
		for (const mid of media) {
			mediaUrl.push(mid.url)
		}
		let i = 0
		for (const mid of media) {
			let cloneI = parseInt(i.toString())
			ret.push(
				isSensitive ?
					<TouchableOpacity onPress={() => imgModalTrigger(mediaUrl, cloneI, true)} key={`${mid.id} ${tlId}`} >
						<Image source={{ uri: mid.preview_url }} style={{ width: (width - 80) / media.length, height: config.imageHeight, borderWidth: 1 }} />
						<BlurView intensity={40} style={{ position: 'absolute', width: (width - 80) / media.length, height: config.imageHeight }} />
					</TouchableOpacity >
					: <TouchableOpacity onPress={() => imgModalTrigger(mediaUrl, cloneI, true)} key={`${mid.id} ${tlId}`}>
						<Image source={{ uri: mid.preview_url }} style={{ width: (width - 80) / media.length, height: config.imageHeight, borderWidth: 1 }} />
					</TouchableOpacity>
			)
			i++
		}
		return ret
	}
	if (rawToot.reblog) {
		topComponent = (
			<TouchableOpacity style={[styles.horizonal, styles.sameHeight]} onPress={() => navigation.navigate('AccountDetails', { acctId, id: rawToot.account.id, notification: false })}>
				<FontAwesome name="retweet" size={27} style={{ color: '#2b90d9' }} />
				<Image source={{ uri: config.showGif ? rawToot.account.avatar : rawToot.account.avatar_static }} style={{ width: 22, height: 22, marginHorizontal: 3, borderRadius: 5 }} />
				<AccountName account={rawToot.account} width={width} />
			</TouchableOpacity>
		)
	}
	if (rawToot.customPinned) {
		topComponent = (
			<View style={styles.horizonal}>
				<MaterialIcons name="push-pin" size={20} color={isDark ? 'white' : 'black'} />
				<Text>ピン留めされた投稿</Text>
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
	const [anchor, setAnchor] = React.useState<undefined | number>(undefined)
	const actionSheet = (id: string) => {
		if (!deletable) return navigation.navigate('Toot', { acctId, id: toot.id, notification: false })
		const pinToggleNotation = toot.pinned ? 'ピン留め解除' : 'ピン留め'
		const options = ['詳細', '削除', pinToggleNotation, '編集', 'キャンセル']
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				destructiveButtonIndex: 1,
				cancelButtonIndex: 4,
				anchor
			},
			(buttonIndex) => {
				if (buttonIndex === 0) return navigation.navigate('Toot', { acctId, id: toot.id, notification: false })
				if (buttonIndex === 1) return statusPost('delete', id, acctId)
				if (buttonIndex === 2) return statusPost(toot.pinned ? 'unpin' : 'pin', id, acctId)
				if (buttonIndex === 3) return txtAction(id, acctId, 'edit')
			}
		)
	}
	const TootContent = React.memo(({ content, emojis, source }: { content: string, emojis: M.Emoji[], source?: 'translate' }) => {
		return <HTML
			source={{ html: emojify(content, emojis, false, config.showGif) }}
			tagsStyles={{ p: { margin: 0, color: txtColor }, a: { color: '#8c8dff' } }}
			customHTMLElementModels={renderers}
			classesStyles={{ invisible: { fontSize: 0.01 } }}
			renderersProps={{
				a: {
					onPress: async (e, href) => linkHandler(href),
				},
			}}
			contentWidth={width - 50}
		/>
	})
	const linkHandler = async (href: string) => {
		// https://2m.cutls.com/@Cutls
		const tagDetector = href.match(/\/tags\/(.+)/)
		const acctDetector = href.match(/https:\/\/(.+)\/@(.+)/)
		if (tagDetector) {
			const tag = tagDetector[1]
			navigation.navigate('TimelineOnly', { timeline: { type: 'hashtag', acct: acctId, activated: true, key: `glance at tag${tag}`, acctName: ``, timelineData: { target: tag } } })
		} else if (acctDetector) {
			const acctNotation = `${acctDetector[2]}@${acctDetector[1]}`
			try {
				setLoading('アカウントを検索しています')
				const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
				const { domain, at } = acct
				const data = await api.getV2Search(domain, at, { q: acctNotation, resolve: true })
				setLoading('')
				// { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
				if (!data.accounts.length) throw 'アカウントが見つかりませんでした'
				navigation.navigate('AccountDetails', { at, domain, notification: false, acctId, id: data.accounts[0].id })
			} catch (e) {
				setLoading('')
				await WebBrowser.openBrowserAsync(href)
			}
		} else {
			await WebBrowser.openBrowserAsync(href)
		}
	}
	if (tlId >= 0 && toot.filtered?.length) {
		return <TouchableOpacity style={styles.container} onPress={() => actionSheet(toot.id)}>
			<Text>フィルターされました{toot.filtered?.map((t) => t.filter.title).join(',')}</Text>
		</TouchableOpacity>
	}
	const appData = hasApp(toot.application) ? toot.application : null
	const plainContent = stripTags(toot.content)
	const tootLength = mb2xCount(plainContent)
	const tootLines = toot.content.split(/(<br\s?\/?>|<p>)/).length - 2
	const tooLong = tootLength > config.autoFoldLetters || tootLines > config.autoFoldLines
	const autoFold = !toot.spoiler_text && tooLong
	const afSpoiler = autoFold ? `(${tootLength} B|${tootLines}行): ${plainContent.slice(0, 12)}…` : null
	return (
		<View style={styles.container}>
			{topComponent}
			<View style={styles.horizonal}>
				<TouchableOpacity style={styles.center} onPress={() => navigation.navigate('AccountDetails', { acctId, id: toot.account.id, notification: false })}>
					<Image source={{ uri: config.showGif ? toot.account.avatar : toot.account.avatar_static }} style={{ width: 50, height: 50, borderRadius: 5 }} />
					{config.useRelativeTime && <Text style={{ color: '#9a9da1', fontSize: 12 }}>{moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}</Text>}
					<View style={[commonStyle.horizonal, { marginTop: 5 }]}>
						<MaterialIcons name={visiIcon} />
						{toot.edited_at && <MaterialIcons name="create" />}
					</View>
				</TouchableOpacity>
				<View style={{ width: '100%', marginLeft: 10 }}>
					<View style={[styles.horizonal, styles.sameHeight]}>
						<AccountName account={toot.account} width={width} />
						{toot.account.locked ? <MaterialIcons name="lock" style={{ color: '#a80000', marginLeft: 5 }} /> : null}
					</View>
					<View style={[styles.horizonal, styles.sameHeight]}>
						<Text numberOfLines={1} style={{ color: '#9a9da1', fontSize: 12 }}>
							@{toot.account.acct} {config.useAbsoluteTime && moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').format("'YY年M月D日 HH:mm:ss")}
							{config.showVia && !!appData && appData.name}
						</Text>
					</View>
					{(!!toot.spoiler_text || autoFold) && <View style={commonStyle.horizonal}>
						<Text style={{ marginTop: 15, marginRight: 5 }}>{toot.spoiler_text || afSpoiler}</Text>
						<TouchableOpacity onPress={() => setIsCwShow(!isCwShow)} style={styles.cwBtn}>
							<Text>{isCwShow ? '隠す' : (autoFold ? '全文' : '見る')}</Text>
						</TouchableOpacity>
					</View>}
					{(!toot.spoiler_text && !autoFold) || isCwShow ? <TootContent
						content={toot.content}
						emojis={toot.emojis}
					/> : null}
					{toot.language && toot.language !== 'ja' &&
						<>
							<TouchableOpacity onPress={async () => setTranslatedToot(await translate(acctId, toot.id))} style={{ marginVertical: 10 }}>
								<Text style={isDark ? commonStyle.linkDark : commonStyle.link}>翻訳({toot.language})</Text>
							</TouchableOpacity>
							<TootContent
								content={translatedToot}
								emojis={toot.emojis}
								source="translate"
							/>
						</>}
					{toot.card ? <Card card={toot.card} width={width} /> : null}
					{toot.poll && <Poll poll={toot.poll} acctId={acctId} />}
					<View style={styles.horizonal}>{toot.media_attachments ? showMedia(toot.media_attachments, toot.sensitive) : null}</View>
					<View style={styles.actionsContainer}>
						<MaterialIcons name="reply" size={config.actionBtnSize} style={styles.actionIcon} color="#9a9da1" onPress={() => txtAction(toot.id, toot.account.acct, 'reply')} />
						{config.showReactedCount && <Text style={styles.actionCounter}>{toot.replies_count}</Text>}
						<FontAwesome
							name="retweet"
							size={config.actionBtnSize}
							style={styles.actionIcon}
							color={boosted.is ? '#03a9f4' : '#9a9da1'}
							onPress={() => statusPost(boosted.is ? 'unboost' : 'boost', rawToot.id, acctId, setBoosted)}
						/>
						{config.showReactedCount && <Text style={styles.actionCounter}>{boosted.ct}</Text>}
						<MaterialIcons
							name="star"
							size={config.actionBtnSize}
							style={styles.actionIcon}
							color={faved.is ? '#fbc02d' : '#9a9da1'}
							onPress={() => statusPost(faved.is ? 'unfav' : 'fav', toot.id, acctId, setFaved)}
						/>
						{config.showReactedCount && <Text style={styles.actionCounter}>{faved.ct}</Text>}
						<MaterialIcons name="more-vert" size={config.actionBtnSize} style={styles.actionIcon} ref={(c: any) => setAnchor(findNodeHandle(c) || undefined)} onPress={() => actionSheet(toot.id)} color="#9a9da1" />
					</View>
				</View>
			</View>
		</View>
	)
}
function createStyle(deviceWidth: number) {
	return StyleSheet.create({
		container: {
			marginVertical: 5,
			paddingHorizontal: 5,
			width: deviceWidth - 65,
			borderBottomColor: '#eee',
			borderBottomWidth: 1
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
			marginVertical: 5,
			alignContent: 'center',
			justifyContent: 'center',
			alignItems: 'center',
		},
		actionIcon: {
			marginHorizontal: 20,
		},
		actionCounter: {
			color: '#9a9da1',
		},
		cwBtn: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: `#aaa`,
			padding: 10,
			borderRadius: 5,
			marginVertical: 5,
			width: 50,
		}
	})
}