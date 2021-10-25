import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Alert } from 'react-native'
import { Text, View, TextInput, Button } from '../components/Themed'
import Bottom from '../components/Bottom'
import Timeline from '../components/Timeline'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { MaterialIcons } from '@expo/vector-icons'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import * as storage from '../utils/storage'
import TimelineProps, { TLType } from '../interfaces/TimelineProps'
import { commonStyle } from '../utils/styles'
import * as Updates from 'expo-updates'
const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = statusBarHeight()
export default function App({ navigation }: StackScreenProps<ParamList, 'Root'>) {
	const [loading, setLoading] = useState('Initializing' as null | string)
	const [text, setText] = useState('' as string)
	const [replyId, setReplyId] = useState('' as string)
	const [inited, setInited] = useState(false)
	const [nowSelecting, setNowSelecting] = useState(0)
	const [timelines, setTimelines] = useState([] as TimelineProps[])
	const init = async () => {
		setInited(true)
		if (!__DEV__) {
			const update = await Updates.checkForUpdateAsync()
			if (update.isAvailable) {
				await Updates.fetchUpdateAsync()
				Alert.alert(
					'追加データのダウンロード完了',
					'再起動して最新のTootDeskをお使いください。',
					[
						{
							text: 'スキップ',
							onPress: () => true,
							style: 'cancel',
						},
						{
							text: '再起動',
							onPress: () => {
								Updates.reloadAsync()
							},
						},
					],
					{ cancelable: true }
				)
			}
		}
		const tls = await storage.getItem('timelines')
		if (!tls) {
			return goToAccountManager()
		}
		setTimelines(tls)
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
	return (
		<View style={styles.container}>
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
			<View style={styles.stickToBottom}>
				<View style={styles.bottom}>
					<Bottom
						goToAccountManager={goToAccountManager}
						tooting={toSetTooting}
						timelines={timelines}
						nowSelecting={nowSelecting}
						setNowSelecting={changeTl}
						setNewNotif={setNewNotif}
						newNotif={newNotif}
						imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
						reply={reply}
						navigation={navigation}
					/>
				</View>
			</View>
			<Modal visible={imageModal.show} animationType="fade">
				<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
			</Modal>
			{tooting ? <Post acct={timelines[nowSelecting].acct} tooting={toSetTooting} setText={setText} text={text} replyId={replyId} setReplyId={setReplyId} /> : null}
		</View>
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
})
