import React, { useState } from 'react'
import { StyleSheet, Dimensions, FlatList, RefreshControl } from 'react-native'
import { Text, TouchableOpacity, View } from './Themed'
import Toot from './Toot'
import Account from './Account'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import { RefObject } from 'react'
import { commonStyle } from '../utils/styles'
import { FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
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
    const [acct, setAcct] = useState<S.Account | null>(null)
    const [loading, setLoading] = useState('Initializing' as string | null)
    const [refreshing, setRefreshing] = useState(false)
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        await loadTimeline()
        setRefreshing(false)
    }, [])
    const { acctId, reply, navigation, dismiss } = props
    const openAcct = (id: string) => {
        if (acct) navigation.navigate('AccountDetails', { at: acct.at, domain: acct.domain, notification: false, acctId, id })
        if (acct && typeof dismiss !== 'undefined') dismiss()
    }
    const renderItem = (e: any) => {
        const item = e.item as M.Notification
        let icon = <MaterialIcons name="help" size={27} style={styles.icon} color="#9a9da1" />
        if (item.type === 'favourite') icon = <MaterialIcons name="star" size={27} style={styles.icon} color="#fbc02d" />
        if (item.type === 'reblog') icon = <FontAwesome size={27} name="retweet" style={styles.icon} color="#03a9f4" />
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
                <TouchableOpacity style={[commonStyle.horizonal, styles.notice]} onPress={() => openAcct(item.account.id)}>
                    {icon}
                    <AccountName account={item.account} miniEmoji={true} />
                    <Text>さんが{label}</Text>
                </TouchableOpacity>
                <Toot
                    toot={item.status}
                    acctId={acctId}
                    navigation={navigation}
                    deletable={false}
                    key={`notification ${item.id}`}
                    imgModalTrigger={(url: string[], i: number, show: boolean) => props.imgModalTrigger(url, i, show)}
                    reply={reply} />
                <View style={commonStyle.separator} />
            </View>
        )
        const gta = (id: string) => {
            navigation.navigate('AccountDetails', { acctId, id, notification: false })
            if (dismiss) dismiss()
        }
        return (
            <View style={{ padding: 5 }}>
                <TouchableOpacity style={[commonStyle.horizonal, styles.notice]} onPress={() => openAcct(item.account.id)}>
                    {icon}
                    <AccountName account={item.account} miniEmoji={true} />
                    <Text>さんが{label}</Text>
                </TouchableOpacity>
                <Account account={item.account} key={`notification ${item.id}`} acctId={acctId} isFR={item.type === 'follow_request'} goToAccount={(id: string) => gta(id)} />
                <View style={commonStyle.separator} />
            </View>
        )
    }
    let ct = 0
    const loadTimeline = async () => {
        setLoading('Loading...')
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        setAcct(acct)
        let min_id: string = ''
        try {

            const data: M.Notification[] = await api.getV1Notifications(acct.domain, acct.at)
            setToots(data)
            setLoading(null)
        } catch (e) {

        }
    }
    const flatlistRef = React.useRef<FlatList>() as RefObject<FlatList<any>>
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
