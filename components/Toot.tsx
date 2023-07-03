import React, { memo, useContext, useState } from 'react'
import { StyleSheet, ActionSheetIOS, findNodeHandle, useColorScheme } from 'react-native'
import { Image } from 'expo-image'
import { Text, View } from './Themed'
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import Card from './Card'
import * as Localization from 'expo-localization'
import EmojiModal from '../components/modal/EmojiEnter'
const locale = Localization.getLocales()
const langCode = locale[0].languageCode
const isJa = langCode === 'ja'
import moment from 'moment-timezone'
import 'moment/locale/ja'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { BlurView } from 'expo-blur'
import * as S from '../interfaces/Storage'
import * as storage from '../utils/storage'
import { doReaction, statusPost } from '../utils/changeStatus'
import Poll from './Poll'
import { LoadingContext } from '../utils/context/loading'
import { commonStyle } from '../utils/styles'
import { ImageModalContext } from '../utils/context/imageModal'
import { SetConfigContext } from '../utils/context/config'
import { resolveAccount, resolveStatus, translate } from '../utils/tootAction'
import { mb2xCount, stripTags } from '../utils/stringUtil'
import i18n from '../utils/i18n'
import EmojiReaction from './EmojiReaction'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	}),
}
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
export default memo((props: FromTimelineToToot) => {
	const { toot: rawToot, txtAction, navigation, acctId, deletable, width, tlId } = props
	const styles = createStyle(width)
	const toot = rawToot.reblog ? rawToot.reblog : rawToot
	let topComponent: null | JSX.Element = null
	const [boosted, setBoosted] = useState({ is: rawToot.reblogged, ct: toot.reblogs_count })
	const [faved, setFaved] = useState({ is: toot.favourited, ct: toot.favourites_count })
	const [isPined, setIsPined] = useState(toot.pinned)
	const [isBookmarked, setIsBookmarked] = useState(toot.bookmarked)
	const [isCwShow, setIsCwShow] = useState(false)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [translatedToot, setTranslatedToot] = useState('')
	const { setLoading } = useContext(LoadingContext)
	const { config } = useContext(SetConfigContext)
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const imgModalTrigger = (url: string[], i: number, show: boolean) => navigation.push('ImageViewer', { url, i })
	const showMedia = (media: M.Attachment[], isSensitive: boolean) => {
		const ret = [] as JSX.Element[]
		const mediaUrl = [] as string[]
		const availableMedia = [] as string[]
		for (const mid of media) {
			const isMediaProxy = !!mid.url.match(/media_proxy/)
			mediaUrl.push(isMediaProxy ? (mid.remote_url || mid.url) : mid.url)
		}
		let i = 0
		for (const mid of media) {
			let cloneI = parseInt(i.toString())
			ret.push(
				mid.url.match(/media_proxy/) || !mid.preview_url ?
					<TouchableOpacity onPress={() => imgModalTrigger(mediaUrl, cloneI, true)} key={`${mid.id} ${tlId}`} >
						<Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{i18n.t('プレビューはありません')}</Text>
					</TouchableOpacity >
					:
					<TouchableOpacity onPress={() => imgModalTrigger(mediaUrl, cloneI, true)} key={`${mid.id} ${tlId}`} >
						<Image placeholder={mid.blurhash} source={isSensitive ? null : { uri: mid.preview_url }} style={{ width: (width - 80) / media.length, height: config.imageHeight, borderWidth: 1 }} />
					</TouchableOpacity >
			)
			i++
		}
		return ret
	}
	if (rawToot.reblog) {
		topComponent = (
			<TouchableOpacity style={[styles.horizonal, styles.sameHeight]} onPress={() => navigation.navigate('AccountDetails', { acctId, id: rawToot.account.id, url: rawToot.account.url, notification: false })}>
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
				<Text>{i18n.t('ピン留めされた投稿')}</Text>
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
	const [anchor, setAnchor] = useState<undefined | number>(undefined)
	const actionSheet = (id: string) => {
		if (acctId === 'noAuth') return navigation.navigate('Toot', { acctId, id: toot.id, notification: false, url: toot.url })
		const isMine = deletable
		const pinToggleNotation = i18n.t(isPined ? 'ピン留め解除' : 'ピン留め')
		const bkm = i18n.t(isBookmarked ? 'ブックマーク解除' : 'ブックマーク')
		const options = isMine ? [
			i18n.t('詳細'),
			bkm,
			i18n.t('削除'),
			pinToggleNotation,
			i18n.t('編集'),
			i18n.t('他のアカウントで詳細'),
			i18n.t('キャンセル')
		] : [i18n.t('詳細'), bkm, i18n.t('他のアカウントで詳細'), i18n.t('キャンセル')]
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				destructiveButtonIndex: isMine ? 2 : undefined,
				cancelButtonIndex: options.length - 1,
				anchor
			},
			(buttonIndex) => {
				if (buttonIndex === 0) return navigation.navigate('Toot', { acctId, id: toot.id, notification: false })
				if (buttonIndex === 1) return statusPost(isBookmarked ? 'unbookmark' : 'bookmark', id, acctId, () => setIsBookmarked(!isBookmarked), true, setLoading)
				if (isMine && buttonIndex === 2) return statusPost('delete', id, acctId, undefined, false, setLoading)
				if (isMine && buttonIndex === 3) return statusPost(isPined ? 'unpin' : 'pin', id, acctId, () => setIsPined(!isPined), true, setLoading)
				if (isMine && buttonIndex === 4) return txtAction(id, acctId, 'edit')
				if (buttonIndex === options.length - 2) return navigation.navigate('Toot', { acctId: 'noAuth', id: toot.id, notification: false, url: toot.url })
			}
		)
	}
	const TootContent = memo(({ content, emojis, source }: { content: string, emojis: M.Emoji[], source?: 'translate' }) => {
		return <HTML
			source={{ html: emojify(content, emojis, false, config.showGif) }}
			tagsStyles={{ p: { marginTop: 0, marginBottom: 5, color: txtColor, justifyContent: 'flex-start' }, a: { color: '#8c8dff' } }}
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
		const statusDetector = href.match(/https:\/\/(.+)\/@(.+)\/[0-9]+/)
		const acctDetector = href.match(/https:\/\/(.+)\/@(.+)/)
		if (acctId === 'noAuth') await WebBrowser.openBrowserAsync(href)
		if (tagDetector) {
			const tag = tagDetector[1]
			navigation.navigate('TimelineOnly', { timeline: { type: 'hashtag', acct: acctId, activated: true, key: `glance at tag${tag}`, acctName: ``, timelineData: { target: tag } } })
		} else if (statusDetector) {
			try {
				setLoading(i18n.t('投稿を検索しています'))
				const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
				const { domain, at } = acct
				const data = await resolveStatus(acctId, href)
				setLoading('')
				// { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
				if (!data) throw i18n.t('投稿が見つかりませんでした')
				navigation.navigate('Toot', { at, domain, notification: false, acctId, id: data.id })
			} catch (e) {
				setLoading('')
				await WebBrowser.openBrowserAsync(href)
			}
		} else if (acctDetector) {
			const acctNotation = `${acctDetector[2]}@${acctDetector[1]}`
			try {
				setLoading(i18n.t('アカウントを検索しています'))
				const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
				const { domain, at } = acct
				const data = await resolveAccount(acctId, acctNotation)
				setLoading('')
				// { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
				if (!data) throw i18n.t('アカウントが見つかりませんでした')
				navigation.navigate('AccountDetails', { at, domain, notification: false, acctId, id: data.id })
			} catch (e) {
				setLoading('')
				await WebBrowser.openBrowserAsync(href)
			}
		} else {
			await WebBrowser.openBrowserAsync(href)
		}
	}

	if (tlId >= 0 && toot.filtered?.length) {
		const isHidden = toot.filtered.filter((f) => f.filter.filter_action === 'hide').length
		if (isHidden > 0) return null
		return <TouchableOpacity style={styles.container} onPress={() => actionSheet(toot.id)}>
			<Text>{i18n.t('フィルターされました')}{toot.filtered?.map((t) => t.filter.title).join(',')}</Text>
		</TouchableOpacity>
	}
	const appData = hasApp(toot.application) ? toot.application : null
	const plainContent = stripTags(toot.content)
	const tootLength = mb2xCount(plainContent)
	const tootLines = toot.content.split(/(<br\s?\/?>|<p>)/).length - 2
	const tooLong = tootLength > config.autoFoldLetters || tootLines > config.autoFoldLines
	const autoFold = !toot.spoiler_text && tooLong
	const afSpoiler = autoFold ? `(${tootLength} B|${tootLines}行): ${plainContent.slice(0, 12)}…` : null
	const addReaction = (shortCode: string) => doReaction(true, shortCode, acctId, toot.id)
	return (
		<>
			{isEmojiOpen ? <EmojiModal setSelectCustomEmoji={setIsEmojiOpen} callback={addReaction} acct={acctId} /> : null}
			<View style={styles.container}>
				{topComponent}
				<View style={styles.horizonal}>
					<TouchableOpacity style={styles.center} onPress={() => navigation.navigate('AccountDetails', { acctId, id: toot.account.id, notification: false, url: toot.account.url })}>
						<Image source={{ uri: config.showGif ? toot.account.avatar : toot.account.avatar_static }} style={{ width: 50, height: 50, borderRadius: 5 }} />
						{config.useRelativeTime && isJa && <Text style={{ color: '#9a9da1', fontSize: 12 }}>{moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}</Text>}
						<View style={[commonStyle.horizonal, { marginTop: 5 }]}>
							<MaterialIcons name={visiIcon} color={isDark ? 'white' : 'black'} />
							{toot.edited_at && <MaterialIcons name="create" color={isDark ? 'white' : 'black'} />}
							{config.showLang && <Text style={{ color: '#9a9da1', fontSize: 12, marginLeft: 5 }}>{toot.language || '-'}</Text>}
						</View>
					</TouchableOpacity>
					<View style={{ width: '100%', marginLeft: 10 }}>
						<View style={[styles.horizonal, styles.sameHeight]}>
							<AccountName account={toot.account} width={width} />
							{toot.account.locked ? <MaterialIcons name="lock" style={{ color: '#a80000', marginLeft: 5 }} /> : null}
						</View>
						<View style={[styles.horizonal, styles.sameHeight, { justifyContent: 'space-between' }]}>
							<Text numberOfLines={1} style={{ color: '#9a9da1', fontSize: 12 }}>
								@{toot.account.acct}
							</Text>
							<Text numberOfLines={1} style={{ color: '#9a9da1', fontSize: 12 }}>
								{config.showVia && !!appData && appData.name}
								{config.useAbsoluteTime && moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').format(i18n.t("'YY年M月D日 HH:mm:ss"))}
								{config.useRelativeTime && !isJa && moment(toot.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}
							</Text>
						</View>
						{(!!toot.spoiler_text || autoFold) && <View style={commonStyle.horizonal}>
							<Text style={{ marginTop: 15, marginRight: 5 }}>{toot.spoiler_text || afSpoiler}</Text>
							<TouchableOpacity onPress={() => setIsCwShow(!isCwShow)} style={styles.cwBtn}>
								<Text>{isCwShow ? i18n.t('隠す') : (autoFold ? i18n.t('全文') : i18n.t('見る'))}</Text>
							</TouchableOpacity>
						</View>}
						{(!toot.spoiler_text && !autoFold) || isCwShow ? <TootContent
							content={toot.content}
							emojis={toot.emojis}
						/> : null}
						{toot.language && toot.language !== 'ja' &&
							<>
								<TouchableOpacity onPress={async () => setTranslatedToot(await translate(acctId, toot.id))} style={{ marginVertical: 10 }}>
									<Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{i18n.t('翻訳')}({toot.language})</Text>
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
						{!!toot.emoji_reactions && <EmojiReaction toot={toot} acctId={acctId} />}
						<View style={styles.actionsContainer}>
							<View style={styles.actionSet}>
								<MaterialIcons name="reply" size={config.actionBtnSize} style={styles.actionIcon} color="#9a9da1" onPress={() => txtAction(toot.id, toot.account.acct, 'reply')} />
								{config.showReactedCount && <Text style={styles.actionCounter}>{toot.replies_count}</Text>}
							</View>
							<View style={styles.actionSet}>
								<FontAwesome
									name="retweet"
									size={config.actionBtnSize}
									style={styles.actionIcon}
									color={boosted.is ? '#03a9f4' : '#9a9da1'}
									onPress={() => statusPost(boosted.is ? 'unboost' : 'boost', rawToot.id, acctId, setBoosted, false, setLoading)}
								/>
								{config.showReactedCount && <Text style={styles.actionCounter}>{boosted.ct}</Text>}
							</View>
							<View style={styles.actionSet}>
								<MaterialIcons
									name="star"
									size={config.actionBtnSize}
									style={styles.actionIcon}
									color={faved.is ? '#fbc02d' : '#9a9da1'}
									onPress={() => statusPost(faved.is ? 'unfav' : 'fav', toot.id, acctId, setFaved, false, setLoading)}
								/>
								{config.showReactedCount && <Text style={styles.actionCounter}>{faved.ct}</Text>}
							</View>
							<View style={styles.actionSet}>
								{!!toot.emoji_reactions && <MaterialIcons
									name="add"
									size={config.actionBtnSize}
									style={styles.actionIcon}
									color={toot.emoji_reactioned ? '#b8d1e3' : '#9a9da1'}
									onPress={() => !toot.emoji_reactioned ? setIsEmojiOpen(true) : doReaction(false, '', acctId, toot.id)}
								/>}
								{!!toot.emoji_reactions && config.showReactedCount && <Text style={styles.actionCounter}>{toot.emoji_reactions_count}</Text>}
							</View>
							<MaterialIcons name="more-vert" size={config.actionBtnSize} style={styles.actionIcon} ref={(c: any) => setAnchor(findNodeHandle(c) || undefined)} onPress={() => actionSheet(toot.id)} color="#9a9da1" />
						</View>
					</View>
				</View>
			</View>
		</>
	)
})
function createStyle(deviceWidth: number) {
	return StyleSheet.create({
		container: {
			marginVertical: 5,
			paddingHorizontal: 5,
			paddingRight: 65,
			width: deviceWidth,
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
			paddingRight: 100,
			paddingLeft: 60
		},
		actionSet: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			marginHorizontal: 20,
		},
		actionIcon: {
			marginRight: 5
		},
		actionCounter: {
			color: '#9a9da1',
			paddingTop: 5
		},
		cwBtn: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: `#aaa`,
			padding: 10,
			borderRadius: 5,
			marginVertical: 5,
			width: 60,
		}
	})
}