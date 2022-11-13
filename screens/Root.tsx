import React, { useState } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, SafeAreaView } from 'react-native'
import { TouchableOpacity, View } from '../components/Themed'
import Bottom from '../components/Bottom'
import Timeline from '../components/Timeline'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import * as storage from '../utils/storage'
import * as Alert from '../utils/alert'
import TimelineProps from '../interfaces/TimelineProps'
import * as Updates from 'expo-updates'
import { TopBtnContext, IFlatList } from '../utils/context/topBtn'
import { MaterialIcons } from '@expo/vector-icons'
import { ChangeTlContext } from '../utils/context/changeTl'
const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = statusBarHeight()
export default function App({ navigation }: StackScreenProps<ParamList, 'Root'>) {
	const [loading, setLoading] = useState<null | string>('Initializing')
	const [text, setText] = useState('' as string)
	const [replyId, setReplyId] = useState('' as string)
	const [inited, setInited] = useState(false)
	const [showToTop, setShowToTop] = useState(false)
	const [nowSelecting, setNowSelecting] = useState(0)
	const [timelines, setTimelines] = useState<TimelineProps[]>([])
	const [flatList, setFlatList] = useState<IFlatList>(undefined)
	const init = async () => {
		setInited(true)
		const tls = await storage.getItem('timelines')
		if (!tls) {
			return goToAccountManager()
		}
		setTimelines(tls)
		if (!__DEV__) {
			const update = await Updates.checkForUpdateAsync()
			if (update.isAvailable) {
				await Updates.fetchUpdateAsync()
				const a = await Alert.promise('追加データのダウンロード完了', '再起動して最新のTootDeskをお使いください。', [{ text: 'スキップ', style: 'cancel' }, { text: '再起動' },])
				if (a === 1) {
					Updates.reloadAsync()
				}
			}
		}

	}
	if (!inited) {
		init()
	}
	const [tooting, setTooting] = useState(false)
	const [newNotif, setNewNotif] = useState(false)
	const [imageModal, setImageModal] = useState({
		url: [''],
		i: 0,
		show: false,
	})
	const goToAccountManager = () => {
		navigation.replace('AccountManager')
	}
	const toSetTooting = (is: boolean) => {
		setTooting(is)
	}

	const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
	const changeTl = async (tl: number, requireSleep?: boolean) => {
		//alert(tl)
		const tls = await storage.getItem('timelines')
		setTimelines(tls)
		if (requireSleep) await sleep(500)
		setNowSelecting(tl)
		setLoading('Change Timeline')
		setNewNotif(false)
	}
	const reply = (id: string, acct: string) => {
		setText(`@${acct} `)
		setReplyId(id)
		setTooting(true)
	}
	const acct = (timelines[nowSelecting || 0] || { acct: '' }).acct
	return (
		<TopBtnContext.Provider value={{ show: showToTop, setShow: setShowToTop, flatList, setFlatList }}>
			<ChangeTlContext.Provider value={{ changeTl }}>
				<SafeAreaView style={styles.container}>
					<View>
						<View style={styles.psudo}>
							<Timeline
								navigation={navigation}
								loading={loading}
								setNewNotif={setNewNotif}
								setLoading={setLoading}
								timeline={timelines[nowSelecting]}
								imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
								reply={reply}
							/>
						</View>
					</View>
					<TouchableOpacity style={[styles.toTop, { opacity: showToTop ? 1 : 0.3 }]} onPress={() => flatList && flatList.current?.scrollToIndex({ index: 0 })}>
						<MaterialIcons name="keyboard-arrow-up" size={27} />
					</TouchableOpacity>
					<View style={styles.stickToBottom}>
						<View style={styles.bottom}>
							<Bottom
								goToAccountManager={goToAccountManager}
								tooting={toSetTooting}
								timelines={timelines}
								nowSelecting={nowSelecting}
								setNewNotif={setNewNotif}
								newNotif={newNotif}
								imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
								reply={reply}
								navigation={navigation}
							/>
						</View>
					</View>
					<Modal visible={imageModal.show} animationType="slide" presentationStyle="formSheet">
						<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
					</Modal>
					<Post show={tooting} acct={acct} tooting={toSetTooting} setText={setText} text={text} replyId={replyId} setReplyId={setReplyId} />
				</SafeAreaView>
			</ChangeTlContext.Provider>
		</TopBtnContext.Provider>
	)
}
let android = false
if (Platform.OS === 'android') android = true
const styles = StyleSheet.create({
	container: {
		top: statusBar,
		flex: 0,
		height: deviceHeight,
	},
	timelines: {
		height: deviceHeight - 75,
	},
	stickToBottom: {
		position: 'absolute',
		bottom: 0,
		top: deviceHeight - (isIPhoneX ? 95 : 75),
	},
	bottom: {
		height: 55,
		width: deviceWidth,
	},
	psudo: {
		width: deviceWidth,
		height: deviceHeight,
		paddingTop: 0,
		backgroundColor: 'transparent',
	},
	toTop: {
		position: 'absolute',
		top: deviceHeight - (isIPhoneX ? 95 : 75) - 50,
		height: 50,
		width: 50,
		borderTopLeftRadius: 10,
		backgroundColor: '#eee',
		right: 0,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center'
	}
})
