import { IState } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as api from './api'
import * as storage from './storage'
import * as Alert from './alert'
type ITootAction = 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete' | 'pin' | 'unpin'

export const statusPost = async (action: ITootAction, id: string, acctId: string, changeStatus?: IState<any>) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        let positive = true
        let ct = 0
        if (action === 'delete') {
            const data = await api.deleteV1Status(acct.domain, acct.at, id)
            return false
        } else if (action === 'boost') {
            const data = await api.postV1Boost(acct.domain, acct.at, id)
            ct = data.reblogs_count
        } else if (action === 'fav') {
            const data = await api.postV1Fav(acct.domain, acct.at, id)
            ct = data.favourites_count
        } else if (action === 'unboost') {
            positive = false
            const data = await api.postV1Unboost(acct.domain, acct.at, id)
            ct = data.reblogs_count
        } else if (action === 'unfav') {
            positive = false
            const data = await api.postV1Unfav(acct.domain, acct.at, id)
            ct = data.favourites_count
        } else if (action === 'pin') {
            const data = await api.postV1Pin(acct.domain, acct.at, id)
        } else if (action === 'unpin') {
            const data = await api.postV1UnPin(acct.domain, acct.at, id)
        }
        if(changeStatus) changeStatus({ is: positive, ct })
        if (!changeStatus) Alert.alert('操作完了', `操作"${action}"が完了しました`)
    } catch (e) { 
        Alert.alert('エラー', `${e}`)
        console.error(e)
    }
}
export const statusPostAcct = async (action: 'authorize' | 'reject', acctId: string, id: string) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        if (action === 'authorize') {
            const data = await api.postV1FRAuthorize(acct.domain, acct.at, id)
        } else if (action === 'reject') {
            const data = await api.postV1FRReject(acct.domain, acct.at, id)
        }
        Alert.alert('Success', '成功しました(拒否した場合でも一覧からは自動では消えません。)')
    } catch (e) {

    }
}