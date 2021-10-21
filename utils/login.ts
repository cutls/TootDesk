import * as Linking from 'expo-linking'
import { Platform } from 'react-native'
let android = false
if (Platform.OS === 'android') android = true
import * as WebBrowser from 'expo-web-browser'
import * as storage from './storage'
import * as S from '../interfaces/Storage'
import axios from 'axios'
import * as api from '../utils/api'
import uuid from './uuid'

export const loginFirst = async (BASE_URL: string) => {
    let os = 'iOS'
    if (android) os = 'Android'
    const clientName = `TootDesk(${os})`
    //const red = Linking.createURL('account')
    const red = `urn:ietf:wg:oauth:2.0:oob`
    const start: string = `https://${BASE_URL}/api/v1/apps`
    try {
        const appAxios = await axios.post(start, {
            scopes: 'read write follow push',
            client_name: clientName,
            redirect_uris: red,
            website: 'https://toot.thedesk.top'
        })
        const app = appAxios.data
        const auth = `https://${BASE_URL}/oauth/authorize?client_id=${app.client_id}&client_secret=${app.client_secret}&response_type=code&scope=read+write+follow&redirect_uri=${red}`
        await storage.setItem('tempLoginData', {
            redirect_uris: red,
            client_id: app.client_id,
            client_secret: app.client_secret,
            domain: BASE_URL
        })
        await Linking.openURL(auth)
        return true
    } catch (e) {
        return false
    }

}
export const getAt = async (code: string) => {
    const loginData = await storage.getItem('tempLoginData')
    const { domain, client_id, client_secret, redirect_uris } = loginData
    await storage.removeItem('tempLoginData')
    const start: string = `https://${domain}/oauth/token`
    try {
        const tokenAxios = await axios.post(start, {
            grant_type: 'authorization_code',
            redirect_uri: redirect_uris,
            client_id: client_id,
            client_secret: client_secret,
            code: code
        })
        const token = tokenAxios.data
        const { access_token } = token
        const userData = await api.getV1AccountsVerifyCredentials(domain, access_token)
        storage.pushItem('accounts', {
            id: uuid(),
            name: userData.display_name ? userData.display_name : userData.acct,
            acct: userData.acct,
            at: access_token,
            domain: domain
        } as S.Account)
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}