import { Dimensions, Platform, StatusBar } from 'react-native'
let ios = true
if (Platform.OS === 'android') ios = false
const X_WIDTH = 375
const X_HEIGHT = 812
const XSMAX_WIDTH = 414
const XSMAX_HEIGHT = 896
export const isIPhoneX = (width: number, height: number) => Platform.OS === 'ios' && !Platform.isPad ? (width === X_WIDTH && height === X_HEIGHT) || (width === XSMAX_WIDTH && height === XSMAX_HEIGHT) : false
export const statusBarHeight = (width: number, height: number) => {

    return (!ios ? StatusBar.currentHeight || 44 : isIPhoneX(width, height) ? 44 : 20)
}
