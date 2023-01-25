import { Account, Toot } from "../interfaces/MastodonApiReturns";
import { IState } from "../interfaces/ParamList";
import * as api from './api'
import * as storage from './storage'
import * as S from '../interfaces/Storage'

export const translate = async (acctId: string, id: Toot['id']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.postV1Translate(acct.domain, acct.at, id)
        console.log(data)
        return `${data.content} (${data.provider})`
    } catch (e: any) {
        return e.toString()
    }
}
export const resolveStatus = async (acctId: string, url: Toot['url']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.getV2Search(acct.domain, acct.at, { q: url, resolve: true })
        console.log(data)
        if (data.statuses) return data.statuses[0] || null
        return null
    } catch (e: any) {
        return null
    }
}
export const resolveAccount = async (acctId: string, url: Account['url']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.getV2Search(acct.domain, acct.at, { q: url, resolve: true })
        console.log(data)
        if (data.accounts) return data.accounts[0] || null
        return null
    } catch (e: any) {
        return null
    }
}