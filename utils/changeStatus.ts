import { IState } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as api from './api'
import * as storage from './storage'
import * as Alert from './alert'
import i18n from './i18n'
type ITootAction = 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete' | 'pin' | 'unpin' | 'bookmark' | 'unbookmark'

export const statusPost = async (action: ITootAction, id: string, acctId: string, changeStatus?: IState<any>, showAlert?: boolean) => {
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
        } else if (action === 'bookmark') {
            const data = await api.postV1Bookmark(acct.domain, acct.at, id)
        } else if (action === 'unbookmark') {
            const data = await api.postV1UnBookmark(acct.domain, acct.at, id)
        }
        if (changeStatus) changeStatus({ is: positive, ct })
        if (showAlert) Alert.alert('操作完了', i18n.t(`操作"%t"が完了しました`, { t: actionToLocale(action) }))
    } catch (e) {
        Alert.alert(i18n.t('エラー'), `${e}`)
        console.error(e)
    }
}
const actionToLocale = (action: ITootAction) => {
    if (action === 'delete') {
        return i18n.t('削除')
    } else if (action === 'boost') {
        return i18n.t('ブースト')
    } else if (action === 'fav') {
        return i18n.t('お気に入り登録')
    } else if (action === 'unboost') {
        return i18n.t('ブースト解除')
    } else if (action === 'unfav') {
        return i18n.t('お気に入り解除')
    } else if (action === 'pin') {
        return i18n.t('ピン留め')
    } else if (action === 'unpin') {
        return i18n.t('ピン留め解除')
    } else if (action === 'bookmark') {
        return i18n.t('ブックマーク')
    } else if (action === 'unbookmark') {
        return i18n.t('ブックマーク解除')
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
        Alert.alert('Success', i18n.t('成功しました(拒否した場合でも一覧からは自動では消えません。)'))
    } catch (e) {
        Alert.alert(i18n.t('エラー'), `${e}`)
        console.error(e)
    }
}