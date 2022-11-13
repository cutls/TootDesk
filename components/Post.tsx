import React, { useState } from 'react'
import { Dimensions, StyleSheet, TextInput, Text, Image, ActionSheetIOS, useColorScheme } from 'react-native'
import { TouchableOpacity, View, Button } from '../components/Themed'
import { MaterialIcons } from '@expo/vector-icons'
import EmojiModal from '../components/modal/SelectCustomEmoji'
import { IState } from '../interfaces/ParamList'
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

interface FromRootToPost {
	show: boolean
	acct: string
	tooting: (a: boolean) => void
	text: string
	setText: IState<string>
	replyId: string
	setReplyId: IState<string>
}
const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('screen').height
export default (props: FromRootToPost) => {
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const { acct, tooting } = props
	const { show, text, setText, replyId, setReplyId } = props
	const [nsfw, setNsfw] = useState(false)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [loading, setLoading] = useState(false)
	const [showCW, setShowCW] = useState(false)
	const [CWText, setCWText] = useState('' as string)
	const [vis, setVis] = useState('public' as IVisTxt)
	const [accountTxt, setAccountTxt] = useState('' as string)
	const [account, setAccount] = useState('' as string)
	const [accountListTxt, setAccountListTxt] = useState([] as string[])
	const [accountList, setAccountList] = useState([] as string[])
	const [uploaded, setUploaded] = useState([] as M.Media[])
	const [keyboardHeight] = useKeyboard()
	const [inputHeight, setInputHeight] = React.useState(0)
	const addHeight = (uploaded.length ? 50 : 0) + (showCW ? 40 : 0)
	const postArea = (inputHeight > 70 ? inputHeight - 70 : 0) + (isIPhoneX ? 270 : 250) + addHeight
	const postAvoid = keyboardHeight + postArea
	type IVisIcon = 'public' | 'lock-open' | 'lock' | 'mail'
	type IVisTxt = 'public' | 'unlisted' | 'private' | 'direct'
	const visList = ['public', 'unlisted', 'private', 'direct'] as IVisTxt[]
	const visTxt = ['公開', '未収載', '非公開', 'ダイレクト']
	const getVisicon = (vis: IVisTxt): IVisIcon => {
		if (vis === 'public') return 'public'
		if (vis === 'unlisted') return 'lock-open'
		if (vis === 'private') return 'lock'
		if (vis === 'direct') return 'mail'
		return 'public'
	}
	const selectVis = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: visTxt
			},
			(buttonIndex) => {
				const vis = visList[buttonIndex]
				setVis(vis)
			}
		)
	const actionSheet = () =>
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: accountListTxt
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
			if (a.id === acct) {
				setAccount(a.id)
				setAccountTxt(a.acct)
			}
		}
		setAccountList(item)
		setAccountListTxt(itemTxt)
	}
	if (!accountList.length) init()
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
		setUploaded(cl)
		return cl
	}
	const closeToot = () => {
		tooting(false)
		setText('')
		setReplyId('')
		setNsfw(false)
		setUploaded([])
		setVis('public')
	}
	const post = async () => {
		try {
			setLoading(true)
			const param: R.Status = {
				status: text,
				media_ids: uploaded.map((e) => e.id),
				visibility: vis,
				sensitive: nsfw,
				spoiler_text: showCW ? CWText : '',
				in_reply_to_id: replyId
			}
			const acct = (await storage.getCertainItem('accounts', 'id', account)) as S.Account
			await api.postV1Statuses(acct.domain, acct.at, param)
			setLoading(false)
			closeToot()
		} catch (e) {
			setLoading(false)
		}
	}
	return (
		<View style={[styles.container, { bottom: show ? 0 : 0 - deviceHeight, height: postAvoid }]}>
			<Button title="" icon="close" onPress={() => closeToot()} color="transparent" borderLess={true} textColor={isDark ? 'white' : 'black'} style={styles.closeBtn} />
			{isEmojiOpen ? <EmojiModal setSelectCustomEmoji={setIsEmojiOpen} callback={emojiModal} acct={acct} /> : null}
			<Text>{text.length}</Text>
			<TextInput multiline numberOfLines={5} style={[styles.textarea, { height: inputHeight }]} placeholder="何か書いてください" onContentSizeChange={(event) => {
				setInputHeight(event.nativeEvent.contentSize.height)
			}}
				value={text}
				onChangeText={(text) => setText(text)} />
			{showCW ? <TextInput numberOfLines={1} style={[styles.cwArea]} placeholder="警告文" value={CWText} onChangeText={(text) => setCWText(text)} /> : null}
			<View style={styles.horizonal}>
				<TouchableOpacity onPress={() => actionSheet()}>
					<Text>{accountTxt}</Text>
				</TouchableOpacity>
				<Button title="トゥート" icon="create" onPress={() => post()} style={{ width: (deviceWidth / 2) - 20 }} loading={loading || uploading} />
			</View>
			{uploaded.length ? <View style={{ height: 50 }}>
				<FlatList data={uploaded} horizontal={true} renderItem={({ item, index }) => uploadedImage(item)} />
			</View> : null}
			{replyId ? <Text>返信モード</Text> : null}
			<View style={styles.action}>
				<TouchableOpacity onPress={() => setNsfw(!nsfw)}>
					<MaterialIcons name={nsfw ? `visibility` : `visibility-off`} size={20} style={[styles.icon, { color: nsfw ? `#f0b000` : isDark ? 'white' : `black` }]} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setShowCW(!showCW)}>
					<Text style={[styles.icon, { fontSize: 18 }]}>CW</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => selectVis()}>
					<MaterialIcons name={getVisicon(vis)} size={20} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => upload.pickImage(setUploading, upCb, acct)}>
					<MaterialIcons name="attach-file" size={20} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setIsEmojiOpen(true)}>
					<MaterialIcons name="insert-emoticon" size={20} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<MaterialIcons name="more-vert" size={20} style={styles.icon} />
				</TouchableOpacity>
			</View>
			<View style={{ height: (keyboardHeight > 100 ? keyboardHeight - addHeight : 0) }} />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		width: deviceWidth,
		backgroundColor: 'white',
		padding: 20
	},
	icon: {
		marginHorizontal: 15,
	},
	textarea: {
		marginVertical: 10,
		borderWidth: 1,
		borderRadius: 5,
		width: deviceWidth - 40,
		textAlignVertical: 'top',
		padding: 5,
		minHeight: 70,
		maxHeight: deviceHeight - 200
	},
	cwArea: {
		marginVertical: 10,
		borderWidth: 1,
		borderRadius: 5,
		width: deviceWidth - 40,
		textAlignVertical: 'top',
		padding: 5,
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
	}
})