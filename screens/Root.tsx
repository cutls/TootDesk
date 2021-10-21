import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal } from 'react-native'
import { Text, View, TextInput, Button } from '../components/Themed'
import Bottom from '../components/Bottom'
import Timeline from '../components/Timeline'
import ImageModal from '../components/ImageModal'
import Post from '../components/Post'
import { MaterialIcons } from '@expo/vector-icons'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import * as storage from '../utils/storage'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = statusBarHeight()
export default function App({ navigation }: StackScreenProps<ParamList, 'Root'>) {
	const [nowSelecting, setNowSelecting] = useState(0)
	const tlRaw = [
		{ type: 'public', acct: '5d435588-4289-43e8-a9ce-d2aaa7c35654', activated: true, key: 'public 0', timelineData: { target: '' } },
		{ type: 'local', acct: '5d435588-4289-43e8-a9ce-d2aaa7c35654', activated: false, key: 'local 0', timelineData: { target: '' } },
	]
	const [timelines, setTimelines] = useState(tlRaw)
	const [tooting, setTooting] = useState(false)
	const [imageModal, setImageModal] = useState({ url: [''], i: 0, show: false })
	const goToAccountManager = () => {
		navigation.replace('AccountManager')
	}
	const toSetTooting = (is: boolean) => {
		setTooting(is)
	}
	return (
		<View style={styles.container}>
			<View>
				<View style={styles.psudo}>
					<Timeline timeline={timelines[nowSelecting]} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
				</View>
			</View>
			<View style={styles.stickToBottom}>
				<View style={styles.bottom}>
					<Bottom goToAccountManager={goToAccountManager} tooting={toSetTooting} />
				</View>
			</View>
			<Modal visible={imageModal.show} animationType="fade">
				<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
			</Modal>
			{tooting ? <Post accountIndex={nowSelecting} tooting={toSetTooting} /> : null}
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
