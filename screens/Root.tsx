import React, { useState } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, SafeAreaView, ActivityIndicator, useColorScheme, useWindowDimensions } from 'react-native'
import { TouchableOpacity, View, Text } from '../components/Themed'
import Bottom from '../components/Bottom'
import Timeline from '../components/Timeline'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { Loading, ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import * as storage from '../utils/storage'
import * as Alert from '../utils/alert'
import TimelineProps from '../interfaces/TimelineProps'
import * as Updates from 'expo-updates'
import { TopBtnContext, IFlatList } from '../utils/context/topBtn'
import { MaterialIcons } from '@expo/vector-icons'
import { ChangeTlContext } from '../utils/context/changeTl'
import { LoadingContext } from '../utils/context/loading'
import TimelineRoot from '../components/TimelineRoot'

export default function App({ navigation }: StackScreenProps<ParamList, 'Root'>) {
	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(deviceWidth, deviceHeight)
	const [loading, setLoading] = useState<null | Loading>('Initializing')
	const [rootLoading, setRootLoading] = useState<null | string>(null)
	const [insertText, setInsertText] = useState('')
	const [replyId, setReplyId] = useState('')
	const [inited, setInited] = useState(false)
	const [showToTop, setShowToTop] = useState(false)
	const [nowSelecting, setNowSelecting] = useState(0)
	const [timelines, setTimelines] = useState<TimelineProps[]>([])
	const [flatList, setFlatList] = useState<IFlatList>(undefined)
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	const init = async () => {
		setInited(true)
		const tls = await storage.getItem('timelines')
		if (tls) setTimelines(tls)
		if (!tls) {
			return goToAccountManager()
		}
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
	const [newNotif, setNewNotif] = useState(false)
	const [imageModal, setImageModal] = useState({
		url: [''],
		i: 0,
		show: false,
	})
	const goToAccountManager = () => {
		navigation.replace('AccountManager')
	}

	const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
	const changeTl = async (tl: number, reloadTimeline?: boolean) => {
		if (reloadTimeline) {
			const tls = await storage.getItem('timelines')
			setTimelines(tls)
		}
		setNewNotif(false)
		setNowSelecting(tl)
	}
	const reply = (id: string, acct: string) => {
		setInsertText(`@${acct} `)
		setReplyId(id)
	}
	return (
		<LoadingContext.Provider value={{ loading: rootLoading, setLoading: setRootLoading }}>
			<TopBtnContext.Provider value={{ show: showToTop, setShow: setShowToTop, flatList, setFlatList }}>
				<ChangeTlContext.Provider value={{ changeTl, tl: nowSelecting }}>
					<SafeAreaView style={styles.container}>
						<View>
							<View style={styles.psudo}>
								{!!timelines.length && <TimelineRoot
									navigation={navigation}
									loading={loading}
									setNewNotif={setNewNotif}
									setLoading={setLoading}
									timelines={timelines}
									targetTimelines={[timelines[0]]}
									imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
									reply={reply}
								/>}
							</View>
						</View>
						<TouchableOpacity style={[styles.toTop, { opacity: showToTop ? 1 : 0.3 }]} onPress={() => flatList && flatList.current?.scrollToIndex({ index: 0 })}>
							<MaterialIcons name="keyboard-arrow-up" size={27} />
						</TouchableOpacity>
						<View style={styles.stickToBottom}>
							<View style={styles.bottom}>
								<Bottom
									goToAccountManager={goToAccountManager}
									timelines={timelines}
									nowSelecting={nowSelecting}
									setNewNotif={setNewNotif}
									newNotif={newNotif}
									imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
									reply={reply}
									insertText={insertText}
									replyId={replyId}
									setReplyId={setReplyId}
									setInsertText={setInsertText}
									navigation={navigation}
								/>
							</View>
						</View>
						<Modal visible={imageModal.show} animationType="slide" presentationStyle="fullScreen">
							<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
						</Modal>
					</SafeAreaView>
					<Modal visible={!!rootLoading} transparent={true}>
						<View style={[styles.rootLoading, bgColorAI]}>
							<ActivityIndicator size="large" />
							<Text style={styles.rootLoadingText}>{rootLoading}</Text>
						</View>
					</Modal>
				</ChangeTlContext.Provider>
			</TopBtnContext.Provider>
		</LoadingContext.Provider>
	)
}
let android = false
if (Platform.OS === 'android') android = true
function createStyle(deviceWidth: number, deviceHeight: number) {
	const statusBar = statusBarHeight(deviceWidth, deviceHeight)
	return StyleSheet.create({
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
			top: deviceHeight - (isIPhoneX(deviceWidth, deviceHeight) ? 95 : 75),
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
			top: deviceHeight - (isIPhoneX(deviceWidth, deviceHeight) ? 95 : 75) - 50,
			height: 50,
			width: 50,
			borderTopLeftRadius: 10,
			backgroundColor: '#eee',
			right: 0,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center'
		},
		rootLoading: {
			width: 200,
			height: 100,
			top: (deviceHeight / 2) - 50,
			left: (deviceWidth / 2) - 100,
			justifyContent: 'center',
			borderRadius: 10,
		},
		rootLoadingText: {
			color: 'white',
			textAlign: 'center',
			marginTop: 10
		}
	})
}