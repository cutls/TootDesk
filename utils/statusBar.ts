import { Dimensions, Platform, StatusBar } from 'react-native'
let ios = true
if (Platform.OS === 'android') ios = false
const X_WIDTH = 375
const X_HEIGHT = 812
const XSMAX_WIDTH = 414
const XSMAX_HEIGHT = 896
const { height, width } = Dimensions.get('window')
export const isIPhoneX = Platform.OS === 'ios' && !Platform.isPad ? (width === X_WIDTH && height === X_HEIGHT) || (width === XSMAX_WIDTH && height === XSMAX_HEIGHT) : false
export const statusBarHeight = () => {

    return (!ios ? StatusBar.currentHeight || 44 : isIPhoneX ? 44 : 20)
}
