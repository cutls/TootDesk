import React, { useState } from 'react'
import { Dimensions, StyleSheet, TextInput, Text, KeyboardAvoidingView, ScrollView, ActionSheetIOS } from 'react-native'
import { TouchableOpacity, View, Button } from '../components/Themed'
import { MaterialIcons } from '@expo/vector-icons'
import EmojiPicker from 'rn-emoji-keyboard'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import { useKeyboard } from '../utils/keyboard'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'

interface FromRootToPost {
	accountIndex: number
	tooting: (a: boolean) => void
}
const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('screen').height
export default (props: FromRootToPost) => {
	const { accountIndex, tooting } = props
	const [test, setText] = useState('')
	const [nsfw, setNsfw] = useState(false)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [vis, setVis] = useState('public' as IVisTxt)
	const [accountTxt, setAccountTxt] = useState('' as string)
	const [account, setAccount] = useState('' as string)
	const [accountListTxt, setAccountListTxt] = useState([] as string[])
	const [accountList, setAccountList] = useState([] as string[])
	const [keyboardHeight] = useKeyboard()
	const [inputHeight, setInputHeight] = React.useState(0)
	const postArea = keyboardHeight + (inputHeight > 70 ? inputHeight - 70 : 0) + (isIPhoneX ? 320 : 300)
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
		for (let acct of accts) {
			item.push(acct.id)
			itemTxt.push(acct.acct)
		}
		setAccount(item[0])
		setAccountTxt(itemTxt[0])
		setAccountList(item)
		setAccountListTxt(itemTxt)
	}
	if (!accountList.length) init()
	return (
		<View style={[styles.container, { top: deviceHeight - postArea, height: postArea }]}>
			<Button title="閉じる" icon="close" onPress={() => tooting(false)} color="transparent" textColor="black" />
			<TextInput multiline numberOfLines={5} style={[styles.textarea, { height: inputHeight }]} placeholder="何か書いてください" onContentSizeChange={(event) => {
				setInputHeight(event.nativeEvent.contentSize.height)
			}} />
			<View style={styles.horizonal}>
				<TouchableOpacity onPress={() => actionSheet()} style={{ paddingHorizontal: 10 }}>
					<Text>{accountTxt}</Text>
				</TouchableOpacity>
				<Button title="トゥート" icon="create" onPress={() => true} style={{ width: (deviceWidth / 2) - 20 }} />
			</View>
			<View style={styles.action}>
				<TouchableOpacity onPress={() => setNsfw(!nsfw)}>
					<MaterialIcons name={nsfw ? `visibility` : `visibility-off`} size={30} style={[styles.icon, { color: nsfw ? `#f0b000` : `black` }]} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<Text style={[styles.icon, { fontSize: 20 }]}>CW</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => selectVis()}>
					<MaterialIcons name={getVisicon(vis)} size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<MaterialIcons name="attach-file" size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<MaterialIcons name="insert-emoticon" size={30} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => true}>
					<MaterialIcons name="more-vert" size={30} style={styles.icon} />
				</TouchableOpacity>
			</View>
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
const pickerSelectStyles = StyleSheet.create({
	inputIOS: {
		fontSize: 16,
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: '#789',
		borderRadius: 4,
		color: '#789',
		paddingRight: 30, // to ensure the text is never behind the icon
		width: deviceWidth - 40
	},
	inputAndroid: {
		fontSize: 16,
		paddingHorizontal: 10,
		paddingVertical: 1,
		borderWidth: 0.5,
		borderColor: '#789',
		borderRadius: 8,
		color: 'black',
		paddingRight: 30, // to ensure the text is never behind the icon
		width: deviceWidth - 40,
		backgroundColor: '#eee',
	}
})
