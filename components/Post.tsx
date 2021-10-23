import React, { useState } from 'react'
import { Dimensions, StyleSheet, TextInput, Text, Image, ActionSheetIOS, Alert } from 'react-native'
import { TouchableOpacity, View, Button } from '../components/Themed'
import { MaterialIcons } from '@expo/vector-icons'
import EmojiModal from '../components/modal/SelectCustomEmoji'
import * as M from '../interfaces/MastodonApiReturns'
import * as R from '../interfaces/MastodonApiRequests'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as upload from '../utils/upload'
import { useKeyboard } from '../utils/keyboard'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import { FlatList } from 'react-native-gesture-handler'

interface FromRootToPost {
	acct: string
	tooting: (a: boolean) => void
	text: string
	setText: React.Dispatch<React.SetStateAction<string>>
	replyId: string
	setReplyId: React.Dispatch<React.SetStateAction<string>>
}
const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('screen').height
export default (props: FromRootToPost) => {
	const { acct, tooting } = props
	const { text, setText, replyId, setReplyId } = props
	const [nsfw, setNsfw] = useState(false)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
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
	const postArea = (inputHeight > 70 ? inputHeight - 70 : 0) + (isIPhoneX ? 310 : 300) + addHeight
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
	const deleteImage = (id: string) => {
		Alert.alert(
			'画像を削除します',
			'この操作は取り消せません。',
			[
				{
					text: 'キャンセル',
					onPress: () => true,
					style: 'cancel',
				},
				{
					text: '削除',
					onPress: () => {
						const cl = uploaded
						let s = []
						for (const c of cl) if (c.id !== id) s.push(c)
						setUploaded(s)
					},
				},
			],
			{ cancelable: true }
		)
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
			closeToot()
		} catch (e) {

		}
	}
	return (
		<View style={[styles.container, { bottom: 0, height: postAvoid }]}>
			{isEmojiOpen ? <EmojiModal setSelectCustomEmoji={setIsEmojiOpen} callback={emojiModal} acct={acct} /> : null}
			<Button title="閉じる" icon="close" onPress={() => closeToot()} color="transparent" textColor="black" />
			<TextInput multiline numberOfLines={5} style={[styles.textarea, { height: inputHeight }]} placeholder="何か書いてください" onContentSizeChange={(event) => {
				setInputHeight(event.nativeEvent.contentSize.height)
			}}
				value={text}
				onChangeText={(text) => setText(text)} />
			<View style={styles.horizonal}>
				<TouchableOpacity onPress={() => actionSheet()} style={{ paddingHorizontal: 10 }}>
					<Text>{accountTxt}</Text>
				</TouchableOpacity>
				<Button title="トゥート" icon="create" onPress={() => post()} style={{ width: (deviceWidth / 2) - 20 }} />
			</View>
			{uploaded.length ? <View style={{ height: 50 }}>
				<FlatList data={uploaded} horizontal={true} renderItem={({ item, index }) => uploadedImage(item)} />
			</View> : null}
			{replyId ? <Text>返信モード</Text> : null}
			{showCW ? <TextInput numberOfLines={1} style={[styles.cwArea]} placeholder="警告文" value={CWText} onChangeText={(text) => setCWText(text)} /> : null}
			<View style={styles.action}>
				<TouchableOpacity onPress={() => setNsfw(!nsfw)}>
					<MaterialIcons name={nsfw ? `visibility` : `visibility-off`} size={30} style={[styles.icon, { color: nsfw ? `#f0b000` : `black` }]} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setShowCW(!showCW)}>
					<Text style={[styles.icon, { fontSize: 20 }]}>CW</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => selectVis()}>
					<MaterialIcons name={getVisicon(vis)} size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => upload.pickImage(setUploading, upCb, acct)}>
					<MaterialIcons name="attach-file" size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setIsEmojiOpen(true)}>
					<MaterialIcons name="insert-emoticon" size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<MaterialIcons name="more-vert" size={30} style={styles.icon} />
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
		height: 50,
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
		marginBottom: 100
	},
	horizonal: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-around'
	}
})