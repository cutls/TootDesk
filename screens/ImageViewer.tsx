import React, { RefObject, useRef, useState } from 'react'
import { ActivityIndicator, Dimensions, Modal, StyleSheet, useColorScheme, Platform, useWindowDimensions } from 'react-native'
import { TouchableOpacity, View } from '../components/Themed'
import { WebView } from 'react-native-webview'
import { Octicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { statusBarHeight, isIPhoneX } from '../utils/statusBar'
import PagerView from 'react-native-pager-view'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import * as Alert from '../utils/alert'
import i18n from '../utils/i18n'
import { StackScreenProps } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'

const ios = Platform.OS === 'ios'
export default function ImageViewer({ navigation, route }: StackScreenProps<ParamList, 'ImageViewer'>) {
    const { i: initI, url } = route.params
    const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
	const styles = createStyle(deviceWidth, deviceHeight)
	const [loading, setLoading] = useState(false)
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const [i, setI] = useState(initI)
	const bgColorVal = isDark ? 'black' : 'white'
	const bgColor = { backgroundColor: bgColorVal }
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	const simpleColor = isDark ? 'black' : 'white'
	const ref = useRef<PagerView>() as RefObject<PagerView>
	const download = async (targetUrl: string) => {
		setLoading(true)
		const files = targetUrl.match(/[^/]+\.[a-zA-Z]{3,4}$/)
		const { status } = await MediaLibrary.requestPermissionsAsync()

		if (status === 'denied') {
			Alert.alert(i18n.t('権限エラー'), i18n.t('写真フォルダへのアクセス権限が無いため、画像保存できません。'))
		}
		if (!files) return false
		const downloadResumable = FileSystem.createDownloadResumable(targetUrl, FileSystem.cacheDirectory + files[0], {})
		try {
			const res = await downloadResumable.downloadAsync()
			if (!res) throw 'Error'
			const blobUrl = res.uri

			const asset = await MediaLibrary.createAssetAsync(blobUrl)
			Alert.alert(i18n.t('完了'), i18n.t('写真フォルダに保存しました'))
			setLoading(false)
		} catch (e: any) {
			Alert.alert(i18n.t('権限エラー'), i18n.t('失敗しました。一つ左のボタンからブラウザを開いて、長押しして保存してください。'))
			setLoading(false)
			console.error(e)
		}
	}
	const changeI = (i: number) => {
		if (i >= url.length || i < 0) return
		setI(i)
		ref.current?.setPage(i)
	}
	return (

		<View style={[styles.container, bgColor]}>
			<View style={[styles.top, bgColor]}>
				<TouchableOpacity onPress={async () => await WebBrowser.openBrowserAsync(url[i])} style={styles.upper}>
					<Octicons name="link-external" size={30} style={styles.icon} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
				<TouchableOpacity onPress={async () => download(url[i])} style={styles.upper}>
					<Octicons name="download" size={30} style={styles.icon} />
				</TouchableOpacity>
			</View>
			<PagerView style={[bgColor, { flex: 1 }]} initialPage={initI} ref={ref} onPageSelected={(e) => changeI(e.nativeEvent.position)}>
				{url.map((txt, index) => <View key={index}>
					<WebView source={{ html: `<html><body style="margin: 0px;background: #0e0e0e;height: 100%;display: flex; justify-content: center; align-items: center; background-color: ${simpleColor}"><img src="${txt}" style="display: block;-webkit-user-select: none;margin: auto; width: 80%; height: 80%; object-fit: contain;" /></body></html>` }} />
				</View>)}
			</PagerView>

			<View style={styles.bottom}>
				<TouchableOpacity onPress={() => changeI(i > 0 ? i - 1 : 0)} activeOpacity={i > 0 ? 0.5 : 1} style={styles.fullCenterContainer}>
					<Octicons name="arrow-left" size={30} style={styles.icon} color={i > 0 ? (isDark ? 'white' : 'black') : 'gray'} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => changeI(i < url.length - 1 ? i + 1 : i)} activeOpacity={i < url.length - 1 ? 0.5 : 1} style={styles.fullCenterContainer}>
					<Octicons name="arrow-right" size={30} style={styles.icon} color={i < url.length - 1 ? (isDark ? 'white' : 'black') : 'gray'} />
				</TouchableOpacity>
			</View>
			<Modal visible={loading} transparent={true}>
				<View style={[styles.downloader, bgColorAI]}>
					<ActivityIndicator size="large" />
				</View>
			</Modal>
		</View>
	)
}
function createStyle(deviceWidth: number, deviceHeight: number) {
	const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
	return StyleSheet.create({
		container: {
			height: deviceHeight,
		},
		icon: {
			marginHorizontal: 15,
		},
		bottom: {
			opacity: 0.8,
			width: deviceWidth,
			backgroundColor: 'white',
			bottom: isIPhoneX(deviceWidth, deviceHeight) ? 70 : 40,
			paddingBottom: 0,
			height: ios ? 80 : 70,
			flexDirection: 'row',
		},
		top: {
			width: deviceWidth,
			backgroundColor: 'white',
			opacity: 0.8,
			top: 0,
			paddingTop: ios && tablet ? statusBarHeight(deviceWidth, deviceHeight) : 0,
			height: ios && tablet ? statusBarHeight(deviceWidth, deviceHeight) + 60 : 70,
			flexDirection: 'row',
			justifyContent: 'flex-end',
		},
		upper: {
			flex: 0,
			alignItems: 'center',
			justifyContent: 'center',
			padding: 5,
			backgroundColor: 'transparent',
		},
		downloader: {
			width: 100,
			height: 100,
			top: (deviceHeight / 2) - 50,
			left: (deviceWidth / 2) - 50,
			justifyContent: 'center',
			borderRadius: 10,
		},
		fullCenterContainer: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: 5,
		},
	})
}