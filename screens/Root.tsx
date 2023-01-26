import React, { useEffect, useState } from 'react'
import { StyleSheet, StatusBar, Platform, Modal, SafeAreaView, ActivityIndicator, useColorScheme, useWindowDimensions } from 'react-native'
import { View, Text } from '../components/Themed'
import Bottom from '../components/Bottom'
import ImageModal from '../components/modal/ImageModal'
import { Loading, ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import * as storage from '../utils/storage'
import * as Alert from '../utils/alert'
import * as api from '../utils/api'
import TimelineProps from '../interfaces/TimelineProps'
import * as Updates from 'expo-updates'
import { ChangeTlContext } from '../utils/context/changeTl'
import { LoadingContext } from '../utils/context/loading'
import TimelineRoot from '../components/TimelineRoot'
import { ImageModalContext } from '../utils/context/imageModal'
import { SetConfigContext } from '../utils/context/config'
import { configInit, IConfig } from '../interfaces/Config'
import { stripTags } from '../utils/stringUtil'
import { commonStyle } from '../utils/styles'
import { refresh } from '../utils/login'
type IConfigType = keyof IConfig

export default function App({ navigation, route }: StackScreenProps<ParamList, 'Root'>) {
	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(deviceWidth, deviceHeight)
	const [loading, setLoading] = useState<null | Loading>('Initializing')
	const [rootLoading, setRootLoading] = useState<null | string>(null)
	const [config, setConfig] = useState<IConfig>(configInit)
	const [insertText, setInsertText] = useState('')
	const [txtActionId, setTxtActionId] = useState('')
	const [nowSelecting, setNowSelecting] = useState([0])
	const [timelines, setTimelines] = useState<TimelineProps[]>([])
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	const tlPerScreen = config.tlPerScreen
	const init = async () => {
		let accounts: S.Account[] = []
		try {
			accounts = await storage.getItem('accounts') || []
		} catch { }
		let tls = []
		try {
			tls = await storage.getItem('timelines') || []
		} catch { }
		let newConfig = configInit
		try {
			const configs = await storage.getItem('config') as IConfig
			if (configs) newConfig = configs
		} catch { }
		for (const keyConfigRaw of Object.keys(configInit)) {
			const keyConfig = keyConfigRaw as IConfigType
			let c = newConfig[keyConfig]
			if (c !== undefined) c = newConfig[keyConfig]
			if (c === undefined) c = configInit[keyConfig]
		}
		if (newConfig) setConfig(newConfig)
		if (tls) setTimelines(tls)
		if (!tls.length) {
			return goToAccountManager()
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
		let useTl = timelines
		if (reloadTimeline) {
			useTl = await storage.getItem('timelines')
			setTimelines(useTl)
		}
		setNewNotif(false)
		const start = tl
		const end = Math.min(tl + tlPerScreen, useTl.length)
		const tls = []
		for (let i = start; i < end; i++) tls.push(i)
		if (!tls.length) return
		setNowSelecting(tls)
	}
	const txtAction = async (id: string, insertText: string, type: 'reply' | 'edit') => {
		if (type === 'reply') {
			setInsertText(`@${insertText} `)
			setTxtActionId(`${type}:${id}`)
		}
		if (type === 'edit') {
			const acct = (await storage.getCertainItem('accounts', 'id', insertText)) as S.Account
			try {
				const data = await api.getV1Source(acct.domain, acct.at, id)
				const text = data.text
				if (!text) throw ''
				setInsertText(text)
				setTxtActionId(`${type}:${id}`)
			} catch (e: any) {
				const r = await Alert.promise(`Error ~v4.0.0`, '編集非対応のサーバーの可能性があります。「削除して再編集」を実行しますか？', Alert.DELETE)
				if (r === 0) return
				const data = await api.deleteV1Status(acct.domain, acct.at, id)
				const text = data.text || stripTags(data.content)
				if (!text) throw ''
				setInsertText(text)
			}
		}
	}
	return (
		<SetConfigContext.Provider value={{ config, setConfig }}>
			<LoadingContext.Provider value={{ loading: rootLoading, setLoading: setRootLoading }}>
				<ImageModalContext.Provider value={{ imageModal, setImageModal }}>
					<ChangeTlContext.Provider value={{ changeTl, tl: nowSelecting }}>
						<View style={{ backgroundColor: isDark ? 'black' : 'white' }}>
							<SafeAreaView style={styles.container}>
								<View>
									<View style={styles.psudo}>
										{!!timelines.length && <TimelineRoot
											navigation={navigation}
											loading={loading}
											setNewNotif={setNewNotif}
											setLoading={setLoading}
											timelines={timelines}
											txtAction={txtAction}
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
											txtAction={txtAction}
											insertText={insertText}
											txtActionId={txtActionId}
											setTxtActionId={setTxtActionId}
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
									<Text style={commonStyle.rootLoadingText}>{rootLoading}</Text>
								</View>
							</Modal>
						</View>
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
	})
}