import { Dimensions, Platform, StatusBar } from 'react-native'
let ios = true
if (Platform.OS === 'android') ios = false

const SIZE = [
    [1284 / 3, 2778 / 3],
    [2778 / 3, 1284 / 3],
    [1242 / 3, 2688 / 3],
    [2688 / 3, 1242 / 3],
    [1290 / 3, 2796 / 3],
    [2796 / 3, 1290 / 3],
    [1179 / 3, 2556 / 3],
    [2556 / 3, 1179 / 3],
    [1170 / 3.2532 / 3],
    [2532 / 3, 1170 / 3],
    [1125 / 3, 2436 / 3],
    [2436 / 3, 1125 / 3],
    [1080 / 3, 2340 / 3]
]
export const isIPhoneX = (width: number, height: number) => Platform.OS === 'ios' && !Platform.isPad ? SIZE.findIndex((i) => i[0] === width && i[1] === height) !== -1 : false
export const statusBarHeight = (width: number, height: number) => {

    return (!ios ? StatusBar.currentHeight || 44 : isIPhoneX(width, height) ? 44 : 20)
}
