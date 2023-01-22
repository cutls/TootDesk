import { Toot } from "../interfaces/MastodonApiReturns";
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
    } catch(e: any) {
        return e.toString()
    }
}