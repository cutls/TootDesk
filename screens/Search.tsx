import React, { useState, useEffect } from 'react'
import { StyleSheet, Platform, ActionSheetIOS, useColorScheme, FlatList, TextInput, useWindowDimensions, findNodeHandle } from 'react-native'
import { Button, TouchableOpacity, View, Text } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { MaterialIcons } from '@expo/vector-icons'
import { commonStyle } from '../utils/styles'
import * as Alert from '../utils/alert'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import * as api from '../utils/api'
import Account from '../components/Account'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Toot from '../components/Toot'
import Card from '../components/Card'
import i18n from '../utils/i18n'
export default function App({ navigation, route }: StackScreenProps<ParamList, 'Search'>) {
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
    const styles = createStyle(deviceWidth, deviceHeight)
    const [loading, setLoading] = useState<boolean>(true)
    const [mode, setMode] = useState<'trend' | 'result'>('trend')
    const [account, setAccount] = useState<string>('')
    const [accountTxt, setAccountTxt] = useState<string>('')
    const [directoryOrder, setDirectoryOrder] = useState<'new' | 'active'>('active')
    const [directoryLocal, setDirectoryLocal] = useState<boolean>(false)
    const [q, setQ] = useState<string>('')
    const [toots, setToots] = useState<M.Toot[]>([])
    const [users, setUsers] = useState<M.Account[]>([])
    const [tags, setTags] = useState<M.Tag[]>([])
    const [cards, setCards] = useState<M.Card[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
    const init = async () => {
        const accts: S.Account[] = await storage.getItem('accounts')
        setAccount(accts[0].id)
        setAccountTxt(`@${accts[0].name}@${accts[0].domain}`)
    }
    useEffect(() => { init() }, [])
    const loadTrends = async (acctId: string, index: number) => {
        if (!acctId) return
        try {
            setLoading(true)
            setMode('trend')
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', acctId)
            if (index === 1) {
                const data = await api.getV1TrendStatuses(acct.domain, acct.at)
                setToots(data)
                setSelectedIndex(1)
            } else if (index === 0) {
                const data = await api.getV1TrendTags(acct.domain, acct.at)
                setTags(data)
                setSelectedIndex(0)
            } else if (index === 3) {
                const data = await api.getV1TrendLink(acct.domain, acct.at)
                setCards(data)
                setSelectedIndex(3)
            } else {
                const data = await api.getV1Directory(acct.domain, acct.at, { order: directoryOrder, local: directoryLocal })
                setUsers(data)
                setSelectedIndex(2)
            }

        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { loadTrends(account, 0) }, [account])
    useEffect(() => { loadTrends(account, 2) }, [directoryLocal, directoryOrder])
    const [anchorAcct, setAnchorAcct] = React.useState<null | number>(0)
    const selectAcct = async () => {
        const accts: S.Account[] = await storage.getItem('accounts')
        const accountListTxt = accts.map((item) => `@${item?.name}@${item?.domain}`)
        const accountList = accts.map((item) => item.id)
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: accountListTxt,
                anchor: anchorAcct || undefined
            },
            (buttonIndex) => {
                const id = accountList[buttonIndex]
                const txt = accountListTxt[buttonIndex]
                setAccountTxt(txt)
                setAccount(id)
            }
        )
    }
    const search = async () => {
        if (!q) return loadTrends(account, 0)
        try {
            setLoading(true)
            setMode('result')
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            const data = await api.getV2Search(acct.domain, acct.at, { q })
            if (data.statuses) setToots(data.statuses)
            if (data.accounts) setUsers(data.accounts)
            if (data.hashtags) setTags(data.hashtags)

        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const renderTag = ({ item }: { item: M.Tag }) => {
        const history = item.history || []
        let m = 0
        let n = 0
        for (const d of history) n = n + parseInt(d.accounts, 10)
        for (const d of history) m = m + parseInt(d.uses, 10)
        return <TouchableOpacity style={{ marginTop: 5 }} onPress={() => {
            navigation.navigate('TimelineOnly', { timeline: { type: 'hashtag', acct: account, acctName: accountTxt, activated: true, key: `hashtag ${account} some`, timelineData: { target: item.name } } })
        }}>
            <Text>#{item.name}</Text>
            <Text>{i18n.t('過去%{a}日に%{b}人が%{c}回利用', { a: history.length, b: n, c: m })}</Text>
            <View style={{ height: 5 }} />
            <View style={commonStyle.separator} />
        </TouchableOpacity>
    }
    const renderToot = ({ item }: { item: M.Toot }) => {
        return (
            <>
                <Toot
                    toot={item}
                    acctId={account}
                    navigation={navigation}
                    deletable={false}
                    key={`search ${item.id}`}
                    txtAction={() => true}
                    width={deviceWidth}
                    tlId={-1}
                />
                <View style={commonStyle.separator} />
            </>
        )
    }
    const renderCard = ({ item }: { item: M.Card }) => {
        return (
            <>
                <Card card={item} width={deviceWidth} />
                <View style={{ height: 10 }} />
                <View style={commonStyle.separator} />
                <View style={{ height: 10 }} />
            </>
        )
    }
    const renderUser = ({ item }: { item: M.Account }) => {
        return (
            <View>
                <View style={commonStyle.horizonal}>
                    <Account acctId={account} account={item} key={`userInList ${item.id}`} goToAccount={(id: string) => navigation.navigate('AccountDetails', { acctId: account, id: item.id, notification: false })} width={deviceWidth} />
                </View>
                <View style={{ height: 5 }} />
                <View style={commonStyle.separator} />
            </View>
        )
    }
    return (
        <View style={{ padding: 5, flex: 1 }}>
            <TouchableOpacity onPress={() => selectAcct()} style={[commonStyle.horizonal, { marginVertical: 15 }]}>
                <MaterialIcons style={{ paddingTop: 3 }} ref={(c: any) => setAnchorAcct(findNodeHandle(c))} name="switch-account" />
                <Text style={{ textDecorationLine: 'underline' }}>{accountTxt}</Text>
            </TouchableOpacity>
            <View style={commonStyle.horizonal}>
                <TextInput placeholder={i18n.t('検索')} onChangeText={(text) => setQ(text)} style={[styles.form]} value={q} />
                <Button title={i18n.t('検索')} onPress={async () => search()} icon="search" style={{ width: '29%', marginLeft: '1%' }} />
            </View>
            <View style={{ height: 5 }} />
            {mode === 'result' ? <SegmentedControl
                style={{ marginVertical: 15 }}
                values={[i18n.t(`ハッシュタグ`), i18n.t(`トゥート`), i18n.t(`アカウント`)]}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
                }}
            /> : <SegmentedControl
                style={{ marginVertical: 15 }}
                values={[i18n.t(`ハッシュタグ`), i18n.t(`トゥート`), i18n.t(`ディレクトリ`), i18n.t(`リンク`)]}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    loadTrends(account, event.nativeEvent.selectedSegmentIndex)
                }}
            />}
            {loading && <Text>Loading...</Text>}
            {mode === 'trend' && selectedIndex === 2 && <View>
                <Text>{directoryOrder === 'active' ? i18n.t('最近の活動順') : i18n.t('新着順')}, {directoryLocal ? i18n.t('ローカルのみ') : i18n.t('連合すべて')}</Text>
                <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                    <Button title={i18n.t('最近の活動順')} onPress={() => setDirectoryOrder('active')} style={styles.dBtn} disabled={directoryOrder === 'active'} />
                    <Button title={i18n.t('新着順')} onPress={() => setDirectoryOrder('new')} style={styles.dBtn} disabled={directoryOrder === 'new'} />
                </View>
                <View style={{ height: 5 }} />
                <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                    <Button title={i18n.t('ローカル')} onPress={() => setDirectoryLocal(true)} style={styles.dBtn} disabled={directoryLocal} />
                    <Button title={i18n.t('連合')} onPress={() => setDirectoryLocal(false)} style={styles.dBtn} disabled={!directoryLocal} />
                </View>
                <View style={{ height: 5 }} />
            </View>}
            {selectedIndex === 0 && <FlatList ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>} data={tags} keyExtractor={(item) => item.name} renderItem={renderTag} />}
            {selectedIndex === 1 && <FlatList ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>} data={toots} keyExtractor={(item) => item.id} renderItem={renderToot} />}
            {selectedIndex === 2 && <FlatList ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>} data={users} keyExtractor={(item) => item.id} renderItem={renderUser} />}
            {selectedIndex === 3 && <FlatList ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>} data={cards} keyExtractor={(item) => item.url} renderItem={renderCard} />}

        </View>
    )
}
let android = false
if (Platform.OS === 'android') android = true
function createStyle(deviceWidth: number, deviceHeight: number) {
    return StyleSheet.create({
        form: {
            marginVertical: 2,
            borderWidth: 1,
            width: '70%',
            padding: 10,
            borderRadius: 10,
        },
        editMenu: {
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 5
        },
        dBtn: {
            width: (deviceWidth - 40) / 2
        }
    })
}