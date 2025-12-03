import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export const uploadCallback = async (callback: (attachedImage: string[]) => any) => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images', 'videos'],
			allowsMultipleSelection: true,
			quality: 1
		})

		if (!result) {
			alert('写真の選択に失敗しました。')
			return false
		}
		// const n = await uploadFrom(result, category, [])
		// await callback(n)
	} catch (e: any) {
		if (e.message) Alert.alert('Error', e.message)
		if (!e.message) Alert.alert('Error(e)', e)
		throw 'Error'
	}
}
