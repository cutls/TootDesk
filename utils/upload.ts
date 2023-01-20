import * as ImagePicker from 'expo-image-picker'
import * as Permissions from 'expo-permissions'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import { Platform } from 'react-native'
import * as api from './api'
import * as Alert from './alert'
import { decode as atob, encode as btoa } from 'base-64'
const main = async (result: ImagePicker.ImagePickerResult, domain: string, at: string) => {
    try {
        if (!result.cancelled && result.base64 && result.uri) {
            return await upload(result, domain, at)
        }
    } catch (e) {
        console.error(e)
    }
}
export default main

async function upload(result: any, domain: string, at: string) {
    const { base64: b64, uri } = result
    let mime = null
    if (uri.match(/\.png$/i)) mime = 'image/png'
    if (uri.match(/\.jpg$/i)) mime = 'image/jpeg'
    if (uri.match(/\.jpeg$/i)) mime = 'image/jpeg'
    if (uri.match(/\.mp4$/i)) mime = 'video/mp4'
    if (uri.match(/\.mov$/i)) mime = 'video/quicktime'
    if (uri.match(/\.mp3$/i)) mime = 'audio/mpeg'
    if (uri.match(/\.wav$/i)) mime = 'audio/wav'
    if (!mime) return Alert.alert('未対応の形式', 'このソフトウェアではサポートされていないファイル形式です。')
    const formData = new FormData() as any
    formData.append('file', {
        uri: uri,
        type: mime,
        name: `file.png`
    })
    try {
        const data = await api.postV2Media(domain, at, formData)
        console.log(data)
        return data
    } catch (e: any) {
        console.log(e)
        if (e.message) Alert.alert('Error', e.message)
        return null
    }
}
export const pickImage = async (setUploading: (value: any) => void, callback: any, acctId: string) => {
    try {
        const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        if (Platform.OS !== 'web') {
            const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY)
            if (status === 'denied') {
                Alert.alert('権限エラー', '写真フォルダへのアクセス権限が無いため、画像を添付できません。')
            }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 1,
            base64: true,
        })
        setUploading(true)
        const n = await main(result, domain, at)
        if (!n) return false
        setUploading(false)
        callback(n)
        return true
    } catch {
        return false
    }
}
export const takeImage = async (setUploading: (value: any) => void, callback: any, acctId: string) => {
    try {
        const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        if (Platform.OS !== 'web') {
            const status = await Permissions.askAsync(Permissions.CAMERA)
            if (status.status === 'denied') {
                Alert.alert('権限エラー', '写真撮影の権限が無いため、画像を添付できません。')
            }
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            base64: true,
        })
        setUploading(true)
        const n = await main(result, domain, at)
        if (!n) return false
        setUploading(false)
        callback(n)
        return true
    } catch (e) {
        return false
    }
}
function toBlob(base64: string, type: string | undefined) {
    var bin = atob(base64.replace(/^.*,/, ''))
    var buffer = new Uint8Array(bin.length)
    for (var i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i)
    }
    // Blobを作成
    try {
        var blob = new Blob([new Uint8Array(buffer)], {
            type
        })
    } catch (e) {
        return null
    }

    return blob
}