import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet, TextInput, Image, ActionSheetIOS, useColorScheme, Modal, Pressable, useWindowDimensions, findNodeHandle, Platform } from 'react-native'
import { TouchableOpacity, View, Button, Text } from '../components/Themed'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import EmojiModal from '../components/modal/SelectCustomEmoji'
import * as M from '../interfaces/MastodonApiReturns'
import * as R from '../interfaces/MastodonApiRequests'
import * as storage from '../utils/storage'
import * as Alert from '../utils/alert'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as upload from '../utils/upload'
import { useKeyboard } from '../utils/keyboard'
import { isIPhoneX } from '../utils/statusBar'
import { FlatList } from 'react-native-gesture-handler'
import RNDateTimePicker, { IOSNativeProps } from '@react-native-community/datetimepicker'
import moment from 'moment'
import { commonStyle } from '../utils/styles'

interface FromRootToPost {
	show: boolean
	acct: string
	tooting: (a: boolean) => void
	insertText: string
	txtActionId: string
}
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
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [showCW, setShowCW] = useState(false)
	const [showPoll, setShowPoll] = useState(false)
	const [poll1, setPoll1] = useState('')
	const [poll2, setPoll2] = useState('')
	const [poll3, setPoll3] = useState('')
	const [poll4, setPoll4] = useState('')
	const [multiplePoll, setMultiplePoll] = useState(false)
	const [hiddenPoll, setHiddenPoll] = useState(false)
	const [endPoll, setEndPoll] = useState(300)
	const [pollDeadline, setPollDeadline] = useState(moment().add('24', 'hour').toDate())
	const [CWText, setCWText] = useState('')
	const [vis, setVis] = useState<IVisTxt>('public')
	const [accountTxt, setAccountTxt] = useState('')
	const [account, setAccount] = useState('')
	const [acctObj, setAcctObj] = useState<S.Account | null>(null)
	const [accountListTxt, setAccountListTxt] = useState<string[]>([])
	const [accountList, setAccountList] = useState<string[]>([])
	const [uploaded, setUploaded] = useState<M.Media[]>([])
	const [keyboardHeight] = useKeyboard()
	const [inputHeight, setInputHeight] = useState(0)
	const [textLength, setTextLength] = useState(0)
	useEffect(() => setTextLength(text ? text.length : 0), [text])
	const addHeight = (uploaded.length ? 50 : 0) + (showCW ? 40 : 0) + (showPoll ? 250 : 0)
	const postArea = (inputHeight > 70 ? inputHeight - 70 : 0) + (isIPhoneX(width, height) ? 230 : 220) + addHeight + (tablet ? 50 : 0)
	const postAvoid = keyboardHeight + postArea
	type IVisIcon = 'public' | 'lock-open' | 'lock' | 'mail'
	type IVisTxt = 'public' | 'unlisted' | 'private' | 'direct'
	const visList = ['public', 'unlisted', 'private', 'direct'] as IVisTxt[]
	const visTxt = ['公開', '未収載', '非公開', 'ダイレクト', 'キャンセル']
	const getVisicon = (vis: IVisTxt): IVisIcon => {
		if (vis === 'public') return 'public'
		if (vis === 'unlisted') return 'lock-open'
		if (vis === 'private') return 'lock'
		if (vis === 'direct') return 'mail'
		return 'public'
	}
	const [anchorVis, setAnchorVis] = React.useState<null | number>(0)
	const [anchorAcct, setAnchorAcct] = React.useState<null | number>(0)
	const [anchorMore, setAnchorMore] = React.useState<null | number>(0)
	const [anchorEndPoll, setAnchorEndPoll] = React.useState<null | number>(0)
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
				options: ['投票', '時間指定投稿', 'キャンセル'],
				anchor: anchorMore || undefined,
				cancelButtonIndex: 2
			},
			(buttonIndex) => {
				if (buttonIndex === 0) setShowPoll(!showPoll)
				if (buttonIndex === 1) Alert.alert('coming soon')
			}
		)
	
		const endPollSet = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: ['5分', '30分', '1時間', '6時間', '1日', '3日', '7日', 'キャンセル'],
				anchor: anchorEndPoll || undefined,
				cancelButtonIndex: 7
			},
			(buttonIndex) => {
				if (buttonIndex === 0) setEndPoll(300)
				if (buttonIndex === 1) setEndPoll(1800)
				if (buttonIndex === 2) setEndPoll(3600)
				if (buttonIndex === 3) setEndPoll(21600)
				if (buttonIndex === 4) setEndPoll(86400)
				if (buttonIndex === 5) setEndPoll(86400 * 3)
				if (buttonIndex === 6) setEndPoll(86400 * 7)
			}
		)
	const actionSheet = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: accountListTxt,
				anchor: anchorAcct || undefined
			},
			(buttonIndex) => {
				const id = accountList[buttonIndex]
				const txt = accountListTxt[buttonIndex]
				setAccountTxt(txt)
				setAccount(id)
			}
		)
	const init = async () => {
		const accts = (await storage.getItem('accounts')) as S.Account[]
		const item = []
		const itemTxt = []
		for (let a of accts) {
			item.push(a.id)
			itemTxt.push(a.acct)
			console.log(a.acct, acct)
			if (a.acct === acct) {
				setAcctObj(a)
				setAccount(a.id)
				setAccountTxt(a.acct)
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
		const a = await Alert.promise('画像を削除します', 'この操作は取り消せません。', Alert.DELETE)
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
		Alert.alert('アップロードが完了しました', '確認できない場合は、一度トゥートエリアをタップしてキーボードを表示させると表示される場合があります')
		setUploaded(cl)
		return cl
	}
	const closeToot = () => {
		tooting(false)
		setText('')
		setNsfw(false)
		setLoading(false)
		setUploading(false)
		setUploaded([])
		setVis('public')
	}
	const post = async () => {
		const m = txtActionId.match(/^([^:]+):([^:]+)$/)
		try {
			setLoading(true)
			const param: R.Status = {
				status: text,
				media_ids: uploaded.map((e) => e.id),
				visibility: vis,
				sensitive: nsfw,
				spoiler_text: showCW ? CWText : '',
			}
			if (m && m[1] === 'reply') param.in_reply_to_id = m[1]
			if (!acctObj) return
			if (showPoll) {
				param.poll = {
					options: [poll1, poll2, poll3, poll4].filter((i) => !!i),
					expires_in: endPoll,
					multiple: multiplePoll,
					hide_totals: hiddenPoll
				}
			}
			if (m && m[1] === 'edit') {
				await api.putV1Statuses(acctObj.domain, acctObj.at, m[2], param)
			} else {
				await api.postV1Statuses(acctObj.domain, acctObj.at, param)
			}
			setLoading(false)
			closeToot()
		} catch (e: any) {
			Alert.alert('Error', e.toString())
			setLoading(false)
		}
	}
	return (
		<Modal visible={show} animationType="slide" transparent={true}>
			<Pressable onPress={() => closeToot()} style={styles.pressable}>
				<View style={[styles.container, { bottom: show ? 0 : 0 - height, height: postAvoid }]}>
					<Pressable>
						{isEmojiOpen ? <EmojiModal setSelectCustomEmoji={setIsEmojiOpen} callback={emojiModal} acct={account} /> : null}
						<Text>{textLength}</Text>
						<TextInput multiline numberOfLines={5} style={[styles.textarea, { height: inputHeight }]} placeholder="何か書いてください" onContentSizeChange={(event) => {
							setInputHeight(event.nativeEvent.contentSize.height)
						}}
							value={text}
							onChangeText={(text) => setText(text)} />
						{showCW ? <TextInput numberOfLines={1} style={[styles.cwArea]} placeholder="警告文" value={CWText} onChangeText={(text) => setCWText(text)} /> : null}
						<View style={styles.horizonal}>
							<TouchableOpacity onPress={() => actionSheet()}>
								<Text ref={(c: any) => setAnchorAcct(findNodeHandle(c))} >{accountTxt}</Text>
							</TouchableOpacity>
							<Button title="トゥート" icon="create" onPress={() => post()} style={{ width: (width / 2) - 20 }} loading={loading || uploading} />
						</View>
						<View style={{ height: uploaded.length ? 50 : 0 }}>
							<FlatList data={uploaded} horizontal={true} keyExtractor={(item) => item.id} renderItem={({ item, index }) => uploadedImage(item)} />
						</View>
						{txtActionId ? <Text>返信/編集モード</Text> : null}
						<View style={styles.action}>
							<TouchableOpacity onPress={() => setNsfw(!nsfw)}>
								<MaterialIcons name={nsfw ? `visibility` : `visibility-off`} size={20} style={[styles.icon, { color: nsfw ? `#f0b000` : isDark ? 'white' : `black` }]} />
							</TouchableOpacity>
							<TouchableOpacity onPress={() => setShowCW(!showCW)}>
								<Text style={[styles.icon, { fontSize: 18 }]}>CW</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={() => selectVis()}>
								<MaterialIcons name={getVisicon(vis)} size={20} style={styles.icon} ref={(c: any) => setAnchorVis(findNodeHandle(c))} />
							</TouchableOpacity>
							{account && <TouchableOpacity onPress={() => upload.pickImage(setUploading, upCb, account)}>
								<MaterialIcons name="attach-file" size={20} style={styles.icon} />
							</TouchableOpacity>}
							<TouchableOpacity onPress={() => setIsEmojiOpen(true)}>
								<MaterialIcons name="insert-emoticon" size={20} style={styles.icon} />
							</TouchableOpacity>
							<TouchableOpacity onPress={() => true}>
								<MaterialIcons name="more-vert" size={20} style={styles.icon} onPress={() => moreOption()}  ref={(c: any) => setAnchorMore(findNodeHandle(c))} />
							</TouchableOpacity>
						</View>
						{showPoll && <View>
							<TextInput style={[styles.pollArea]} placeholder="選択肢1" value={poll1} onChangeText={(text) => setPoll1(text)} />
							<TextInput style={[styles.pollArea]} placeholder="選択肢2" value={poll2} onChangeText={(text) => setPoll2(text)} />
							<TextInput style={[styles.pollArea]} placeholder="選択肢3(オプション)" value={poll3} onChangeText={(text) => setPoll3(text)} />
							<TextInput style={[styles.pollArea]} placeholder="選択肢4(オプション)" value={poll4} onChangeText={(text) => setPoll4(text)} />
							<View style={[commonStyle.horizonal, { marginBottom: 10, justifyContent: 'space-between', alignItems: 'center' }]}>
								<View>
									<MaterialCommunityIcons name={multiplePoll ? 'checkbox-multiple-marked-outline' : 'checkbox-marked-outline'} size={20} color={isDark ? 'white' : 'black'} onPress={() => setMultiplePoll(!multiplePoll)} />
								</View>
								<View>
									<TouchableOpacity onPress={() => endPollSet()} style={commonStyle.horizonal}>
										<MaterialIcons name="timer" size={18} style={styles.icon}  ref={(c: any) => setAnchorEndPoll(findNodeHandle(c))} />
										<Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{moment().add(endPoll, 'seconds').fromNow()}</Text>
									</TouchableOpacity>
								</View>
							</View>
							<View style={[commonStyle.horizonal, { justifyContent: 'space-between'}]}>
								<TouchableOpacity onPress={() => setHiddenPoll(!hiddenPoll)} style={commonStyle.horizonal}>
									<MaterialCommunityIcons name={hiddenPoll ? 'checkbox-marked-outline' : 'crop-square'} size={18} color={isDark ? 'white' : 'black'} />
									<Text>終了まで票数を隠す</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={() => setShowPoll(false)} style={commonStyle.horizonal}>
									<Text style={isDark ? commonStyle.linkDark : commonStyle.link}>投票を削除</Text>
								</TouchableOpacity>

							</View>
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
			marginTop: 20,
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
		}
	})
}