import * as Linking from 'expo-linking'
import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import * as storage from './storage'
import * as S from '../interfaces/Storage'
import axios from 'axios'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import uuid from './uuid'

export const loginFirst = async (BASE_URL: string, via: string) => {
    const clientName = via
    const red = Linking.createURL('account')
    if (BASE_URL === 'mstdn.jp') {
        const a = await Alert.promise('mstdn.jp互換性', 'mstdn.jpは運営の方針にTootDeskが対応できないためストリーミングを利用できません。接続を続行しますか？', Alert.UNSAVE)
        if (a === 0) return
    }
    const start: string = `https://${BASE_URL}/api/v1/apps`
    try {
        const appAxios = await axios.post(start, {
            scopes: 'read write follow push',
            client_name: clientName,
            redirect_uris: red,
            website: 'https://toot.thedesk.top'
        })
        const app = appAxios.data
        const auth = `https://${BASE_URL}/oauth/authorize?client_id=${app.client_id}&client_secret=${app.client_secret}&response_type=code&scope=read+write+follow+push&redirect_uri=${red}`
        await storage.setItem('tempLoginData', {
            redirect_uris: red,
            client_id: app.client_id,
            client_secret: app.client_secret,
            domain: BASE_URL
        })
        const session = await WebBrowser.openAuthSessionAsync(auth, red)
        if (session.type === 'success') {
            return session.url
        }
    } catch (e: any) {
        throw e
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
        const instanceData = await api.getV1Instance(domain)
        const configInstance = instanceData.configuration
        const maxLetters = configInstance.statuses.max_characters
        const maxMedia = configInstance.statuses.max_media_attachments
        const streaming = instanceData.urls.streaming_api

        const vis = userData.source.privacy
        const acct: S.Account = {
            id: uuid(),
            name: userData.display_name ? userData.display_name : userData.acct,
            acct: `@${userData.acct}@${domain}`,
            at: access_token,
            domain: domain,
            defaultVis: vis || 'public',
            maxLetters: maxLetters || 500,
            maxMedia: maxMedia || 4,
            streaming,
            pushNotification: undefined,
            idInServer: userData.id
        }
        await storage.pushItem('accounts', acct)
        try {
            const instanceV2 = await api.getV2Instance(domain)
            const config = instanceV2.configuration
            acct.maxLetters = config.statuses.max_characters
            acct.maxMedia = config.statuses.max_media_attachments
            acct.streaming = config.urls.streaming
            acct.translationEnabled = config.translation.enabled
            await storage.updateCertainItem('accounts', 'id', acct.id, acct)
        } finally {
            const accts = await storage.getItem('accounts') as S.Account[]
            return accts
        }
    } catch (e: any) {
        Alert.alert('Error', e.toString())
        console.error(e)
        return []
    }
}
export const refresh = async (acctId: string) => {
    const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
    const { domain, at } = acct
    const userData = await api.getV1AccountsVerifyCredentials(domain, at)
    acct.idInServer = userData.id
    await storage.deleteCertainItem('emojis', 'domain', domain)
    const instanceData = await api.getV1Instance(domain)
    const configInstance = instanceData.configuration
    const maxLetters = configInstance.statuses.max_characters
    const maxMedia = configInstance.statuses.max_media_attachments
    const streaming = instanceData.urls.streaming_api
    const vis = userData.source.privacy
    acct.name = userData.display_name ? userData.display_name : userData.acct
    acct.defaultVis = vis || 'public'
    acct.maxLetters = maxLetters || 500
    acct.maxMedia = maxMedia || 4
    acct.streaming = streaming
    try {
        const instanceV2 = await api.getV2Instance(domain)
        const config = instanceV2.configuration
        acct.maxLetters = config.statuses.max_characters
        acct.maxMedia = config.statuses.max_media_attachments
        acct.streaming = config.urls.streaming
        acct.translationEnabled = config.translation.enabled
        await storage.updateCertainItem('accounts', 'id', acct.id, acct)
    } catch {
        await storage.updateCertainItem('accounts', 'id', acct.id, acct)
    }
}