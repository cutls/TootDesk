import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, Dimensions, FlatList, RefreshControl, useWindowDimensions } from 'react-native'
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
import { Octicons } from '@expo/vector-icons'
import { AccountName } from './AccountName'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import i18n from '../utils/i18n'

interface FromRootToTimeline {
    acctId: string
    txtAction: (id: string, insertText: string, type:'reply' | 'edit') => void
    dismiss?: () => void
    navigation: StackNavigationProp<ParamList, any>
    width: number
}
export default (props: FromRootToTimeline) => {
	const { height: deviceHeight } = useWindowDimensions()
    const deviceWidth = props.width
	const styles = createStyle(deviceWidth, deviceHeight)
    const [toots, setToots] = useState([] as M.Notification[])
    const [acct, setAcct] = useState<S.Account | null>(null)
    const [loading, setLoading] = useState('Initializing' as string | null)
    const [refreshing, setRefreshing] = useState(false)
    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await loadTimeline()
        setRefreshing(false)
    }, [])
    const { acctId, txtAction, navigation, dismiss } = props
    const openAcct = (id: string) => {
        if (acct) navigation.navigate('AccountDetails', { at: acct.at, domain: acct.domain, notification: false, acctId, id })
        if (acct && typeof dismiss !== 'undefined') dismiss()
    }
    const renderItem = (e: any) => {
        const item = e.item as M.Notification
        let icon = <Octicons name="question" size={27} style={styles.icon} color="#9a9da1" />
        if (item.type === 'favourite') icon = <Octicons name="star" size={27} style={styles.icon} color="#fbc02d" />
        if (item.type === 'reblog') icon = <Octicons size={27} name="sync" style={styles.icon} color="#03a9f4" />
        if (item.type === 'mention') icon = <Octicons size={27} name="reply" style={styles.icon} color="#1f961b" />
        if (item.type === 'status') icon = <Octicons size={27} name="person" style={styles.icon} color="#1b3896" />
        if (item.type === 'poll') icon = <Octicons size={27} name="checklist" style={styles.icon} color="#651470" />
        let label = i18n.t('アクション')
        if (item.type === 'favourite') label = i18n.t('お気に入り登録')
        if (item.type === 'reblog') label = i18n.t('ブースト')
        if (item.type === 'mention') label = i18n.t('返信')
        if (item.type === 'status') label = i18n.t('投稿')
        if (item.type === 'poll') label = i18n.t('投票を終了')
        if (item.type === 'follow') label = i18n.t('フォロー')
        if (item.type === 'follow_request') label = i18n.t('フォローリクエスト')
        if (item.type === 'admin.sign_up') label = i18n.t('サインアップ')

        if (item.type === 'follow' || item.type === 'follow_request' || item.type === 'admin.sign_up') icon = <Octicons name="person-add" size={27} style={styles.icon} color="#03a9f4" />
        if (item.status) return (
            <View>
                <TouchableOpacity style={[commonStyle.horizonal, styles.notice]} onPress={() => openAcct(item.account.id)}>
                    {icon}
                    <AccountName account={item.account} miniEmoji={true} width={deviceWidth} />
                    <Text>{i18n.t('さんが')}{label}</Text>
                </TouchableOpacity>
                <Toot
                    toot={item.status}
                    acctId={acctId}
                    navigation={navigation}
                    deletable={false}
                    key={`notification ${item.id}`}
                    txtAction={txtAction}
                    width={deviceWidth}
                    tlId={-1}
                 />
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
                    <AccountName account={item.account} miniEmoji={true} width={deviceWidth} />
                    <Text>{i18n.t('さんが')}{label}</Text>
                </TouchableOpacity>
                <Account width={deviceWidth} account={item.account} key={`notification ${item.id}`} acctId={acctId} isFR={item.type === 'follow_request'} goToAccount={(id: string) => gta(id)} />
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
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        }
    }
    const flatlistRef = useRef<FlatList>() as RefObject<FlatList<any>>
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
    return <FlatList ref={flatlistRef} data={toots} renderItem={renderItem} keyExtractor={(item) => item.id} style={styles.container} initialNumToRender={20} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
}
function createStyle(deviceWidth: number, deviceHeight: number) {
    return StyleSheet.create({
        center: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            flex: 0,
            height: deviceHeight - 65,
            width: deviceWidth,
            backgroundColor: 'transparent',
            marginBottom: 20,
        },
        icon: {},
        notice: {
            alignItems: 'center'
        }
    })
}