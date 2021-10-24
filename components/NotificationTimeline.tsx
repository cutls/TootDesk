import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, AppState, Dimensions, FlatList, RefreshControl, AppStateStatus, Alert } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import Toot from './Toot'
import Account from './Account'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import { RefObject } from 'react'
import { commonStyle } from '../utils/styles'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { AccountName } from './AccountName'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'

interface FromRootToTimeline {
    acctId: string
    imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
    reply: (id: string, acct: string) => void
    dismiss?: () => void
    navigation: StackNavigationProp<ParamList, any>
}
export default (props: FromRootToTimeline) => {
    const [toots, setToots] = useState([] as M.Notification[])
    const [minId, setMinId] = useState('')
    const [loading, setLoading] = useState('Initializing' as string | null)
    const [refreshing, setRefreshing] = useState(false)
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        await loadTimeline()
        setRefreshing(false)
    }, [])
    const { acctId, reply, navigation, dismiss } = props
    const renderItem = (e: any) => {
        const item = e.item as M.Notification
        let icon = <MaterialIcons name="help" size={27} style={styles.icon} color="#9a9da1" />
        if (item.type === 'favourite') icon = <MaterialIcons name="star" size={27} style={styles.icon} color="#fbc02d" />
        if (item.type === 'reblog') icon = <MaterialCommunityIcons size={27} name="twitter-retweet" style={styles.icon} color="#03a9f4" />
        if (item.type === 'mention') icon = <MaterialCommunityIcons size={27} name="reply" style={styles.icon} color="#1f961b" />
        if (item.type === 'status') icon = <MaterialIcons size={27} name="person" style={styles.icon} color="#1b3896" />
        if (item.type === 'poll') icon = <MaterialIcons size={27} name="poll" style={styles.icon} color="#651470" />
        let label = 'アクション'
        if (item.type === 'favourite') label = 'お気に入り登録'
        if (item.type === 'reblog') label = 'ブースト'
        if (item.type === 'mention') label = '返信'
        if (item.type === 'status') label = '投稿'
        if (item.type === 'poll') label = '投票を終了'
        if (item.type === 'follow') label = 'フォロー'
        if (item.type === 'follow_request') label = 'フォローリクエスト'

        if (item.type === 'follow' || item.type === 'follow_request') icon = <MaterialIcons name="person-add" size={27} style={styles.icon} color="#03a9f4" />
        if (item.status) return (
            <View>
                <View style={[commonStyle.horizonal, styles.notice]}>
                    {icon}
                    <AccountName account={item.account} miniEmoji={true} />
                    <Text>さんが{label}</Text>
                </View>
                <Toot
                    toot={item.status}
                    acctId={acctId}
                    navigation={navigation}
                    deletable={false}
                    key={`notification ${item.id}`}
                    statusPost={statusPost}
                    imgModalTrigger={(url: string[], i: number, show: boolean) => props.imgModalTrigger(url, i, show)}
                    reply={reply} />
            </View>
        )
        const gta = (id: string) => {
            navigation.navigate('AccountDetails', { acctId, id, notification: false })
            if(dismiss) dismiss()
        }
        return (
            <View>
                <View style={[commonStyle.horizonal, styles.notice]}>
                    {icon}
                    <AccountName account={item.account} miniEmoji={true} />
                    <Text>さんが{label}</Text>
                </View>
                <Account account={item.account} key={`notification ${item.id}`} statusPost={statusPostAcct} isFR={item.type === 'follow_request'} goToAccount={(id: string) => gta(id)} />
            </View>
        )
    }
    let ct = 0
    const loadTimeline = async () => {
        setLoading('Loading...')
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        let min_id: string = ''
        try {

            const data: M.Notification[] = await api.getV1Notifications(acct.domain, acct.at)
            setToots(data)
            setLoading(null)
        } catch (e) {

        }
    }
    const flatlistRef = React.useRef<FlatList>() as RefObject<FlatList<any>>
    const statusPost = async (action: 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete', id: string, changeStatus: React.Dispatch<any>) => {
        try {
            const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            let positive = true
            let ct = 0
            if (action === 'boost') {
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
            }
            changeStatus({ is: positive, ct })
        } catch (e) {

        }
    }
    const statusPostAcct = async (action: 'authorize' | 'reject', id: string) => {
        try {
            const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            if (action === 'authorize') {
                const data = await api.postV1FRAuthorize(acct.domain, acct.at, id)
            } else if (action === 'reject') {
                const data = await api.postV1FRReject(acct.domain, acct.at, id)
            }
            Alert.alert('Success', '成功しました(拒否した場合でも自動では消えません。)')
        } catch (e) {

        }
    }
    if (loading) {
        if (loading === 'Initializing') {
            loadTimeline()
        }
        return (
            <View style={[styles.container, styles.center]}>
                <Text>{loading}</Text>
            </View>
        )
    }
    return <FlatList ref={flatlistRef} data={toots} renderItem={renderItem} style={styles.container} initialNumToRender={20} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
}
const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 0,
        height: Dimensions.get('window').height - 65,
        width: Dimensions.get('window').width,
        backgroundColor: 'transparent',
        marginBottom: 20,
    },
    icon: {},
    notice: {
        alignItems: 'center'
    }
})
