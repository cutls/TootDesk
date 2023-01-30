import React, { useState } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, SafeAreaView, Text, useColorScheme, Alert, useWindowDimensions } from 'react-native'
import TimelineProps from '../interfaces/TimelineProps'
import { TouchableOpacity, View } from '../components/Themed'
import Timeline from '../components/Timeline'
import ImageModal from '../components/modal/ImageModal'
import { Loading, ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import { TopBtnContext, IFlatList } from '../utils/context/topBtn'
import { MaterialIcons } from '@expo/vector-icons'
import { commonStyle } from '../utils/styles'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import timelineLabel from '../utils/timelineLabel'
import TimelineRoot from '../components/TimelineRoot'
import i18n from '../utils/i18n'
export default function App({ navigation, route }: StackScreenProps<ParamList, 'TimelineOnly'>) {
	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(deviceWidth, deviceHeight)
	const [loading, setLoading] = useState<null | Loading>('Initializing')
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
	const [showToTop, setShowToTop] = useState(false)
	const timeline = route.params.timeline
	const [flatList, setFlatList] = useState<IFlatList>(undefined)
	const [newNotif, setNewNotif] = useState(false)
	const [imageModal, setImageModal] = useState({
		url: [''],
		i: 0,
		show: false,
	})
	const txtAction = (id: string, insertText: string, type: 'reply' | 'edit') => {
		const action = i18n.t(type === 'reply' ? '返信' : '編集')
		Alert.alert(action, i18n.t(`%{t}するためには、まずこのタイムラインをピン留めしてください`, { t: action }))
	}
	const addTl = async () => {
		const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
		const old: TimelineProps[] = await storage.getItem('timelines')
		timeline.acctName = `@${acct.name}@${acct.domain}`
		old.push(timeline)
		await storage.setItem('timelines', old)
		navigation.goBack()
	}
	const tlLabel = timelineLabel(timeline)
	return (
		<TopBtnContext.Provider value={{ show: showToTop, setShow: setShowToTop, flatList, setFlatList }}>
			<View style={styles.container}>
				<View style={[styles.top, commonStyle.horizonal]}>
					<Text style={{ fontSize: 20, fontWeight: 'bold', width: deviceWidth - 80 }} numberOfLines={1}>{tlLabel}</Text>
					<TouchableOpacity onPress={() => addTl()}>
						<MaterialIcons name="push-pin" size={25} color={theFontGrayPlus} />
					</TouchableOpacity>
				</View>
				<View>
					<View style={styles.psudo}>
						<TimelineRoot
							navigation={navigation}
							loading={loading}
							setLoading={setLoading}
							setNewNotif={setNewNotif}
							timelines={[timeline]}
							txtAction={txtAction}
						/>
					</View>
				</View>
				<TouchableOpacity style={[styles.toTop, { opacity: showToTop ? 1 : 0.3 }]} onPress={() => flatList && flatList.current?.scrollToIndex({ index: 0 })}>
					<MaterialIcons name="keyboard-arrow-up" size={27} />
				</TouchableOpacity>
				<Modal visible={imageModal.show} animationType="slide" presentationStyle="fullScreen">
					<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
				</Modal>
			</View>
		</TopBtnContext.Provider>
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
		top: {
			padding: 15,
			justifyContent: 'space-between',
			elevation: 5,
		},
	})
}
