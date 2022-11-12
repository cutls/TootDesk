import React, { useState } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, SafeAreaView } from 'react-native'
import { TouchableOpacity, View } from '../components/Themed'
import Timeline from '../components/Timeline'
import ImageModal from '../components/modal/ImageModal'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import { TopBtnContext, IFlatList } from '../utils/context/topBtn'
import { MaterialIcons } from '@expo/vector-icons'
const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = statusBarHeight()
export default function App({ navigation, route }: StackScreenProps<ParamList, 'TimelineOnly'>) {
	const [loading, setLoading] = useState<null | string>('Initializing')
	const [showToTop, setShowToTop] = useState(false)
    const timeline = route.params.timeline
	const [flatList, setFlatList] = useState<IFlatList>(undefined)
	const [newNotif, setNewNotif] = useState(false)
	const [imageModal, setImageModal] = useState({
		url: [''],
		i: 0,
		show: false,
	})
	const reply = (id: string, acct: string) => {
		alert('リプライを送るためには、まずこのタイムラインをピン留めしてください')
	}
	return (
		<TopBtnContext.Provider value={{ show: showToTop, setShow: setShowToTop, flatList, setFlatList }}>
				<SafeAreaView style={styles.container}>
					<View>
						<View style={styles.psudo}>
							<Timeline
								navigation={navigation}
								loading={loading}
								setNewNotif={setNewNotif}
								setLoading={setLoading}
								timeline={timeline}
								imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })}
								reply={reply}
							/>
						</View>
					</View>
					<TouchableOpacity style={[styles.toTop, { opacity: showToTop ? 1 : 0.3 }]} onPress={() => flatList && flatList.current?.scrollToIndex({ index: 0 })}>
						<MaterialIcons name="keyboard-arrow-up" size={27} />
					</TouchableOpacity>
					<Modal visible={imageModal.show} animationType="slide" presentationStyle="formSheet">
						<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
					</Modal>
				</SafeAreaView>
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
