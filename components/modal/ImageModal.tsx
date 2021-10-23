import React, { useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import { TouchableOpacity, View } from '../Themed'
import { WebView } from 'react-native-webview'
import { MaterialIcons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { statusBarHeight, isIPhoneX } from '../../utils/statusBar'
interface FromRootToImageModal {
	url: string[]
	i: number
    imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
}
const deviceWidth = Dimensions.get('window').width
export default (props: FromRootToImageModal) => {
	const { url, imgModalTrigger } = props
	const [i, setI] = useState(props.i)
	return (
		<View style={styles.container}>
			<View style={{height: statusBarHeight()}} />
			<WebView source={{ uri: url[i] }} />
			<View style={styles.bottom}>
				<TouchableOpacity onPress={() => imgModalTrigger(url, i, false)}>
					<MaterialIcons name="close" size={45} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={async () => await WebBrowser.openBrowserAsync(url[i])}>
					<MaterialIcons name="open-in-browser" size={45} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setI(i > 0 ? i - 1 : 0)} activeOpacity={i > 0 ? 0.5 : 1}>
					<MaterialIcons name="arrow-left" size={45} style={styles.icon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => setI(i < url.length - 1 ? i + 1 : i)} activeOpacity={i < url.length - 1 ? 0.5 : 1}>
					<MaterialIcons name="arrow-right" size={45} style={styles.icon} />
				</TouchableOpacity>
			</View>
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		height: '100%',
	},
	icon: {
		marginHorizontal: 15,
	},
	bottom: {
		position: 'absolute',
		width: deviceWidth,
		bottom: isIPhoneX ? 20 : 10,
		height: 50,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
})
