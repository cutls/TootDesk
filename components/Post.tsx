import React, { RefObject, useEffect, useRef, useState } from 'react'
import { StyleSheet, TextInput, ActionSheetIOS, useColorScheme, Modal, Pressable, useWindowDimensions, findNodeHandle, InputAccessoryView } from 'react-native'
import { Image } from 'expo-image'
import { TouchableOpacity, View, Button, Text } from '../components/Themed'
import { Octicons } from '@expo/vector-icons'
import EmojiModal from '../components/modal/SelectCustomEmoji'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as M from '../interfaces/MastodonApiReturns'
import * as R from '../interfaces/MastodonApiRequests'
import * as storage from '../utils/storage'
import * as Alert from '../utils/alert'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as upload from '../utils/upload'
import { useKeyboard } from '../utils/keyboard'
import { isIPhoneX } from '../utils/statusBar'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import i18n from '../utils/i18n'
import { suggest } from '../utils/tootAction'
import PostPoll from './PostPoll'
import { commonStyle } from '../utils/styles'
import moment from 'moment-timezone'
const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
interface FromRootToPost {
	show: boolean
	acct: string
	tooting: (a: boolean) => void
	insertText: string
	txtActionId: string
}
const isEmoji = (item: any): item is M.CustomEmoji => item.shortcode
const isAcct = (item: any): item is M.Account => item.acct
const isTag = (item: any): item is M.Tag => item.name

export default (props: FromRootToPost) => {
	const { width, height } = useWindowDimensions()
	const tablet = width > height ? height > 500 : width > 500
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const styles = createStyle(width, height, isDark)
	const { acct, tooting } = props
	const { show, txtActionId, insertText } = props
	const [nsfw, setNsfw] = useState(false)
	const [text, setText] = useState(insertText)
	const [maxLength, setMaxLength] = useState(500)
	const [maxMedia, setMaxMedia] = useState(4)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [showCW, setShowCW] = useState(false)
	const [showPoll, setShowPoll] = useState(false)
	const [date, setDate] = useState(moment().add(5, 'minutes').toDate())
	const [showScheduled, setShowScheduled] = useState(false)
	const txtAreaRef = useRef<TextInput>() as RefObject<TextInput>
	const [poll, setPoll] = useState<R.Status['poll'] | null>(null)
	const [CWText, setCWText] = useState('')
	const [vis, setVis] = useState<IVisTxt>('public')
	const [defaultVis, setDefaultVis] = useState<IVisTxt>('public')
	const [accountTxt, setAccountTxt] = useState('')
	const [account, setAccount] = useState('')
	const [acctObj, setAcctObj] = useState<S.Account | null>(null)
	const [accountListTxt, setAccountListTxt] = useState<string[]>([])
	const [accountList, setAccountList] = useState<string[]>([])
	const [uploaded, setUploaded] = useState<M.Media[]>([])
	const [selection, setSelection] = useState({ start: 0, end: 0 })
	const [suggested, setSuggested] = useState<M.CustomEmoji[] | M.Account[] | M.Search['hashtags']>([])
	const [deleteTxt, setDeleteTxt] = useState('')
	const [keyboardHeight] = useKeyboard()
	const [inputHeight, setInputHeight] = useState(0)
	const [textLength, setTextLength] = useState(0)
	useEffect(() => setTextLength(text ? text.length : 0), [text])
	const additional = (showPoll ? 220 : 0) + (showScheduled ? 60 : 0)+ (showCW ? 50 : 0)
	const postArea = (inputHeight > 70 ? inputHeight - 70 : 0) + (isIPhoneX(width, height) ? 230 : 220) + (tablet ? 105 : 0) - (txtAreaRef.current?.isFocused() ? 20 : 0) + additional
	const postAvoid = keyboardHeight + postArea
	type IVisIcon = 'globe' | 'unlock' | 'lock' | 'mail'
	type IVisTxt = 'public' | 'unlisted' | 'private' | 'direct'
	const visList = ['public', 'unlisted', 'private', 'direct'] as IVisTxt[]
	const visTxt = [i18n.t('公開'), i18n.t('未収載'), i18n.t('非公開'), i18n.t('ダイレクト'), i18n.t('キャンセル')]
	const getVisicon = (vis: IVisTxt): IVisIcon => {
		if (vis === 'public') return 'globe'
		if (vis === 'unlisted') return 'unlock'
		if (vis === 'private') return 'lock'
		if (vis === 'direct') return 'mail'
		return 'globe'
	}
	const [anchorVis, setAnchorVis] = useState<null | number>(0)
	const [anchorAcct, setAnchorAcct] = useState<null | number>(0)
	const [anchorMore, setAnchorMore] = useState<null | number>(0)
	const [suggestLoading, setSuggestLoading] = useState(false)
	useEffect(() => { setText(insertText) }, [insertText])
	const selectVis = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: visTxt,
				anchor: anchorVis || undefined,
				cancelButtonIndex: 4
			},
			(buttonIndex) => {
				const vis = visList[buttonIndex]
				setVis(vis)
			}
		)
	const moreOption = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: [i18n.t('投票'), i18n.t('時間指定投稿'), i18n.t('キャンセル')],
				anchor: anchorMore || undefined,
				cancelButtonIndex: 2
			},
			(buttonIndex) => {
				if (buttonIndex === 0) setShowPoll(!showPoll)
				if (buttonIndex === 1) setShowScheduled(!showScheduled)
			}
		)
	const actionSheet = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: accountListTxt,
				anchor: anchorAcct || undefined
			},
			async (buttonIndex) => {
				const id = accountList[buttonIndex]
				const txt = accountListTxt[buttonIndex]
				setAccountTxt(txt)
				setAccount(id)
				const acctObj = (await storage.getCertainItem('accounts', 'id', id)) as S.Account
				setAcctObj(acctObj)
				setMaxLength(acctObj.maxLetters || 500)
				setMaxMedia(acctObj.maxMedia || 4)
				setDefaultVis(acctObj.defaultVis || 'public')
				setVis(acctObj.defaultVis || 'public')
			}
		)
	const init = async () => {
		const accts = (await storage.getItem('accounts')) as S.Account[]
		const item = []
		const itemTxt = []
		for (let a of accts) {
			item.push(a.id)
			itemTxt.push(a.acct)
			if (a.acct === acct) {
				setAcctObj(a)
				setAccount(a.id)
				setAccountTxt(a.acct)
				setMaxLength(a.maxLetters || 500)
				setMaxMedia(a.maxMedia || 4)
				setDefaultVis(a.defaultVis || 'public')
				setVis(a.defaultVis || 'public')
			}
		}
		setAccountList(item)
		setAccountListTxt(itemTxt)
	}
	useEffect(() => { init() }, [show, acct])
	const emojiModal = (shortcode: string) => {
		if (!text) return setText(`:${shortcode}: `)
		const lastLetter = text[text.length - 1]
		setText(`${text}${lastLetter === ' ' ? '' : ' '}:${shortcode}: `)
	}
	const deleteImage = async (id: string) => {
		const a = await Alert.promise(i18n.t('画像を削除します'), i18n.t('この操作は取り消せません。'), Alert.DELETE)
		if (a === 1) {
			const cl = uploaded
			let s = []
			for (const c of cl) if (c.id !== id) s.push(c)
			setUploaded(s)
		}
	}
	const uploadedImage = (m: M.Media) => {
		const meta = m.meta.small
		const width = meta ? 50 * meta.aspect : 50
		return (
			<TouchableOpacity onPress={() => deleteImage(m.id)} style={{ height: 150 }}>
				<Image
					style={{ width, height: 50 }}
					source={{
						uri: m.preview_url,
					}}
				/>
			</TouchableOpacity>
		)
	}
	const upCb = (m: M.Media) => {
		const cl = uploaded
		cl.push(m)
		Alert.alert(i18n.t('アップロードが完了しました'), i18n.t('確認できない場合は、一度トゥートエリアをタップしてキーボードを表示させると表示される場合があります'))
		setUploaded(cl)
		return cl
	}
	const closeToot = async (force?: boolean) => {
		if (txtAreaRef.current?.isFocused() && !force) return txtAreaRef.current?.blur()
		if (!force && (text || uploaded.length)) {
			const alertPromise = await Alert.promise(i18n.t('変更を破棄'), i18n.t('未保存の変更があります'), [i18n.t('破棄して閉じる'), i18n.t('破棄せず閉じる'), i18n.t('キャンセル')] as string[])
			if (alertPromise === 2) return
			if (alertPromise === 1) return tooting(false)
		}
		tooting(false)
		setText('')
		setCWText('')
		setNsfw(false)
		setLoading(false)
		setUploading(false)
		setUploaded([])
		setVis(defaultVis)
		setShowPoll(false)
		setDate(moment().add(5, 'minutes').toDate())
		setShowScheduled(false)
	}
	const post = async () => {
		const m = txtActionId.match(/^([^:]+):([^:]+)$/)
		try {
			setLoading(true)
			if (loading) return
			const param: R.Status = {
				status: text,
				media_ids: uploaded.map((e) => e.id),
				visibility: vis,
				sensitive: nsfw,
				spoiler_text: showCW ? CWText : '',
			}
			if (m && m[1] === 'reply') param.in_reply_to_id = m[2]
			if (!acctObj) return
			if (showPoll) param.poll = poll || undefined
			if (showScheduled) param.scheduled_at = date.toISOString()
			if (m && m[1] === 'edit') {
				await api.putV1Statuses(acctObj.domain, acctObj.at, m[2], param)
			} else {
				await api.postV1Statuses(acctObj.domain, acctObj.at, param)
			}
			setLoading(false)
			closeToot(true)
		} catch (e: any) {
			Alert.alert('Error', e.toString())
			setLoading(false)
		}
	}
	const sSelect = (inputIt: string) => {
		const firstRaw = text.slice(0, selection.start) || ''
		const newReg = new RegExp(`${deleteTxt}.?\\s?$`)
		const first = firstRaw.replace(newReg, '')
		const end = text.slice(selection.start) || ''
		setText(`${first}${inputIt}${end ? '' : ' '}${end}`)
		setSuggested([])
	}
	const renderSuggest = (item: M.CustomEmoji | M.Account | M.Tag) => {
		if (isEmoji(item)) return <TouchableOpacity style={[commonStyle.horizonal, styles.sIT]} onPress={() => sSelect(`:${item.shortcode}:`)}><Image source={{ uri: item.url }} style={styles.sImg} /><Text style={styles.sTxt}>:{item.shortcode}:</Text></TouchableOpacity>
		if (isTag(item)) return <TouchableOpacity style={[commonStyle.horizonal, styles.sIT]} onPress={() => sSelect(`#${item.name}`)}><Text style={styles.sTxt}>#{item.name}</Text></TouchableOpacity>
		if (isAcct(item)) return <TouchableOpacity style={[commonStyle.horizonal, styles.sIT]} onPress={() => sSelect(`@${item.acct}`)}><Image source={{ uri: item.avatar }} style={styles.sImg} /><Text style={styles.sTxt}>@{item.acct}</Text></TouchableOpacity>
		return null
	}
	useEffect(() => {
		const main = async () => {
			setSuggestLoading(true)
			const data = await suggest(selection.start, text, acctObj?.id || '')
			setSuggested(data[0])
			setDeleteTxt(data[1])
			setSuggestLoading(false)
		}
		main()
	}, [selection])
	return (
		<Modal visible={show} animationType="slide" transparent={true}>
			<Pressable onPress={() => closeToot()} style={styles.pressable}>
				<View style={[styles.container, { bottom: show ? 0 : 0 - height, height: postAvoid }]}>
					<Pressable>
						{isEmojiOpen ? <EmojiModal setSelectCustomEmoji={setIsEmojiOpen} callback={emojiModal} acct={account} /> : null}
						<Text style={maxLength < textLength ? { color: 'red', fontWeight: 'bold' } : {}}>{textLength}</Text>
						<TextInput ref={txtAreaRef} multiline numberOfLines={5} style={[styles.textarea, { height: inputHeight }]} placeholder={i18n.t('何か書いてください')} onContentSizeChange={(event) => {
							setInputHeight(event.nativeEvent.contentSize.height)
						}}
							onSelectionChange={({ nativeEvent: { selection } }) => {
								setSelection(selection)
							}}
							value={text}
							onChangeText={(text) => setText(text)}
							inputAccessoryViewID="textAreaSuggest"
						/>
						{showCW ? <TextInput numberOfLines={1} style={[styles.cwArea]} placeholder={i18n.t('警告文')} value={CWText} onChangeText={(text) => setCWText(text)} /> : null}
						<View style={styles.horizonal}>
							<TouchableOpacity onPress={() => actionSheet()} style={{ width: (width / 2 - 20) }}>
								<Text ref={(c: any) => setAnchorAcct(findNodeHandle(c))} numberOfLines={1} >{accountTxt}</Text>
							</TouchableOpacity>
							<Button title={i18n.t('トゥート')} icon="paintbrush" onPress={() => !loading && post()} style={{ width: (width / 2) - 20 }} loading={loading || uploading} />
						</View>
						<View style={{ height: uploaded.length ? 50 : 0 }}>
							<FlatList data={uploaded} horizontal={true} keyExtractor={(item) => item.id} renderItem={({ item, index }) => uploadedImage(item)} />
						</View>
						<InputAccessoryView nativeID="textAreaSuggest" style={{ height: suggested.length ? 40 : 0, paddingTop: 10, backgroundColor: isDark ? 'black' : 'white' }}>
							<FlatList data={suggested as any} horizontal={true} renderItem={({ item }: any) => renderSuggest(item)} keyExtractor={(s) => s.id || s.shortcode} style={styles.sWrap} keyboardShouldPersistTaps="handled" />
						</InputAccessoryView>
						{txtActionId ? <Text>{i18n.t('返信/編集モード')}</Text> : null}
						<View style={[styles.action]}>
							<TouchableOpacity onPress={() => setNsfw(!nsfw)}>
								<Octicons name={nsfw ? `eye` : `eye-closed`} size={20} style={[styles.icon, { color: nsfw ? `#f0b000` : isDark ? 'white' : `black` }]} />
							</TouchableOpacity>
							<TouchableOpacity onPress={() => setShowCW(!showCW)}>
								<Text style={[styles.icon, { fontSize: 18 }]}>CW</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={() => selectVis()}>
								<Octicons name={getVisicon(vis)} size={20} style={styles.icon} ref={(c: any) => setAnchorVis(findNodeHandle(c))} />
							</TouchableOpacity>
							{account && <TouchableOpacity onPress={() =>
								maxMedia < uploaded.length ?
									Alert.alert('Error', i18n.t('メディアは最大%{t}枚までです', { t: maxMedia })) :
									upload.pickImage(setUploading, upCb, account)
							}>
								<Octicons name="file-symlink-file" size={20} style={styles.icon} />
							</TouchableOpacity>}
							<TouchableOpacity onPress={() => setIsEmojiOpen(true)}>
								<Octicons name="smiley" size={20} style={styles.icon} />
							</TouchableOpacity>
							<TouchableOpacity onPress={() => true}>
								<Octicons name="three-bars" size={20} style={styles.icon} onPress={() => moreOption()} ref={(c: any) => setAnchorMore(findNodeHandle(c))} />
							</TouchableOpacity>
						</View>
						{showPoll && <PostPoll setPoll={setPoll} setShowPoll={setShowPoll} />}
						{showScheduled && <View style={[commonStyle.horizonal, { justifyContent: 'flex-end', alignItems: 'center' }]}>
							<Text style={{ marginRight: 10 }}>{i18n.t('時間指定投稿')}</Text>
							<DateTimePicker
								testID="dateTimePicker"
								value={date}
								mode={'datetime' as any}
								is24Hour={true}
								onChange={(event, selectedDate) => {
									const currentDate = selectedDate
									if (currentDate) setDate(currentDate)
								}}
							/>
						</View>}
					</Pressable>
				</View>
			</Pressable>
		</Modal>
	)
}
function createStyle(deviceWidth: number, deviceHeight: number, isDark: boolean) {
	const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
	return StyleSheet.create({
		container: {
			position: 'absolute',
			width: deviceWidth,
			backgroundColor: isDark ? 'black' : 'white',
			padding: 20
		},
		icon: {
			marginHorizontal: 15,
			color: isDark ? 'white' : 'black'
		},
		textarea: {
			marginVertical: 10,
			borderWidth: 1,
			borderRadius: 5,
			width: deviceWidth - 40,
			textAlignVertical: 'top',
			padding: 5,
			minHeight: tablet ? 170 : 70,
			maxHeight: deviceHeight - 200,
			color: isDark ? 'white' : 'black',
			borderColor: isDark ? 'white' : 'black'
		},
		cwArea: {
			marginVertical: 10,
			borderWidth: 1,
			borderRadius: 5,
			width: deviceWidth - 40,
			textAlignVertical: 'top',
			padding: 5,
			color: isDark ? 'white' : 'black',
			borderColor: isDark ? 'white' : 'black'
		},
		pollArea: {
			marginVertical: 4,
			borderWidth: 1,
			borderRadius: 5,
			width: deviceWidth - 40,
			textAlignVertical: 'top',
			padding: 5,
			color: isDark ? 'white' : 'black',
			borderColor: isDark ? 'white' : 'black'
		},
		action: {
			height: 40,
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: 15,
		},
		horizonal: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			alignItems: 'center',
			justifyContent: 'space-around'
		},
		closeBtn: {
			position: 'absolute',
			right: 0,
			top: 0
		},
		pressable: {
			height: deviceHeight,
			width: deviceWidth,
			top: 0,
			left: 0,
			position: 'absolute',
		},
		sWrap: {
			height: 50,
			width: deviceWidth - 40,
			marginTop: 0,
			padding: 5
		},
		sIT: {
			height: 40,
			marginHorizontal: 5
		},
		sImg: {
			width: 20,
			height: 20
		},
		sTxt: {
			marginLeft: 5
		}
	})
}