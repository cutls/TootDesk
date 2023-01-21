import React, { useEffect, useState } from 'react'
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
import { ImageModalContext } from '../utils/context/imageModal'
import { SetConfigContext } from '../utils/context/config'
import { configInit, IConfig } from '../interfaces/Config'

export default function App({ navigation, route }: StackScreenProps<ParamList, 'Root'>) {
	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(deviceWidth, deviceHeight)
	const [loading, setLoading] = useState<null | Loading>('Initializing')
	const [rootLoading, setRootLoading] = useState<null | string>(null)
	const [config, setConfig] = useState<IConfig>(configInit)
	const [insertText, setInsertText] = useState('')
	const [replyId, setReplyId] = useState('')
	const [nowSelecting, setNowSelecting] = useState([0])
	const [timelines, setTimelines] = useState<TimelineProps[]>([])
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	const tlPerScreen = config.tlPerScreen
	const init = async () => {
		const tls = await storage.getItem('timelines')
		const config = await storage.getItem('config')
		if (config) setConfig(config)
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
		const start = 0
		const end = Math.min(0 + tlPerScreen, timelines.length)
		const ns = []
		for (let i = start; i < end; i++) ns.push(i)
		if (!ns.length) return
		setNowSelecting(ns)
	}
	useEffect(() => { init() }, [])
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			if (route.params?.refresh) init()
		})
		return unsubscribe
	}, [navigation])


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
		const start = tl
		const end = Math.min(tl + tlPerScreen, timelines.length)
		const tls = []
		for (let i = start; i < end; i++) tls.push(i)
		setNowSelecting(tls)
	}
	const reply = (id: string, acct: string) => {
		setInsertText(`@${acct} `)
		setReplyId(id)
	}
	return (
		<SetConfigContext.Provider value={{ config, setConfig }}>
			<LoadingContext.Provider value={{ loading: rootLoading, setLoading: setRootLoading }}>
				<ImageModalContext.Provider value={{ imageModal, setImageModal }}>
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
										reply={reply}
									/>}
								</View>
							</View>
							<View style={styles.stickToBottom}>
								<View style={styles.bottom}>
									{!!timelines.length && <Bottom
										goToAccountManager={goToAccountManager}
										timelines={timelines}
										nowSelecting={nowSelecting}
										setNewNotif={setNewNotif}
										newNotif={newNotif}
										reply={reply}
										insertText={insertText}
										replyId={replyId}
										setReplyId={setReplyId}
										setInsertText={setInsertText}
										navigation={navigation}
									/>
									}
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
				</ImageModalContext.Provider>
			</LoadingContext.Provider >
		</SetConfigContext.Provider>
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