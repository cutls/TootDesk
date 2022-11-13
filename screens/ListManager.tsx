import React, { useState, useEffect } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, ActionSheetIOS, Text, useColorScheme, FlatList, TextInput, RefreshControl } from 'react-native'
import TimelineProps from '../interfaces/TimelineProps'
import { Button, TouchableOpacity, View } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
import { statusBarHeight } from '../utils/statusBar'
import { MaterialIcons } from '@expo/vector-icons'
import { commonStyle } from '../utils/styles'
import * as Alert from '../utils/alert'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import * as api from '../utils/api'
import Account from '../components/Account'
const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = statusBarHeight()
export default function App({ navigation, route }: StackScreenProps<ParamList, 'ListManager'>) {
    const [loading, setLoading] = useState<boolean>(true)
    const { acctId, targetAcct } = route.params
    const [mode, setMode] = useState<'list' | 'user'>('list')
    const [account, setAccount] = useState<string>('')
    const [accountTxt, setAccountTxt] = useState<string>('')
    const [newListName, setNewListName] = useState<string>('')
    const [changeName, setChangeName] = useState<string>('')
    const [selectingList, setSelectingList] = useState<string>('')
    const [list, setList] = useState<M.List[]>([])
    const [user, setUser] = useState<M.Account[]>([])
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
    const init = async () => {
        const accts: S.Account[] = await storage.getItem('accounts')
        setAccount(acctId)
        const acctUsed = accts.find((item) => item.id === acctId)
        setAccountTxt(`@${acctUsed?.name}@${acctUsed?.domain}`)
    }
    useEffect(() => { init() }, [])
    const loadListList = async (acctId: string) => {
        if (!acctId) return
        try {
            setLoading(true)
            setMode('list')
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', acctId)
            const data = await api.getV1Lists(acct.domain, acct.at)
            setList(data)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const loadListUser = async (listId: string) => {
        try {
            setLoading(true)
            setSelectingList(listId)
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            const data = await api.getV1UserInList(acct.domain, acct.at, listId)
            setUser(data)
            setMode('user')
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { loadListList(account) }, [account])
    const selectAcct = async () => {
        const accts: S.Account[] = await storage.getItem('accounts')
        const accountListTxt = accts.map((item) => `@${item?.name}@${item?.domain}`)
        const accountList = accts.map((item) => item.id)
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: accountListTxt
            },
            (buttonIndex) => {
                const id = accountList[buttonIndex]
                const txt = accountListTxt[buttonIndex]
                setAccountTxt(txt)
                setAccount(id)
            }
        )
    }
    const listAction = async (item: M.List) => {
        const actions = ['カラム追加', 'リスト情報', 'リストの削除']
        if (targetAcct) actions.push('このリストに追加/から削除')
        actions.push('キャンセル')
        setChangeName(item.title)
        ActionSheetIOS.showActionSheetWithOptions(
            {
                title: item.title,
                options: actions,
                cancelButtonIndex: actions.length - 1
            },
            (buttonIndex) => {
                if (buttonIndex === 0) addTL(item)
                if (buttonIndex === 1) loadListUser(item.id)
                if (buttonIndex === 2) delList(item.id)
                if (targetAcct && buttonIndex === 3) addToList(item.id, targetAcct)
            }
        )
    }
    const addTL = async (list: M.List) => {
        const timelines = await storage.getItem('timelines')
        const tl: TimelineProps = { type: 'list', acct: account, acctName: accountTxt, activated: true, key: `list ${account} ${timelines.length}`, timelineData: { target: list.id, title: list.title } }
        const cl = timelines
        cl.push(tl)
        storage.setItem('timelines', cl)
        navigation.replace('Root')
    }
    const addList = async () => {
        try {
            if (!newListName) Alert.alert('Error', 'リスト名を入力してください')
            setLoading(true)
            setMode('list')
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            await api.postV1List(acct.domain, acct.at, newListName)
            loadListList(account)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const renderList = (e: any) => {
        const item = e.item as M.List
        return (
            <TouchableOpacity onPress={() => listAction(item)} style={{ marginTop: 10 }}>
                <Text>{item.title}</Text>
                <View style={{ height: 15 }} />
                <View style={commonStyle.separator} />
            </TouchableOpacity>
        )
    }
    const changeListName = async () => {
        try {
            if (!changeName) Alert.alert('Error', 'リスト名を入力してください')
            setLoading(true)
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            await api.putV1List(acct.domain, acct.at, selectingList, changeName)
            loadListList(account)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const delUser = async (user: string, listId?: string) => {
        try {
            setLoading(true)
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            await api.deleteV1ListUser(acct.domain, acct.at, listId || selectingList, user)
            loadListUser(listId || selectingList)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const delList = async (listId: string) => {
        try {
            setLoading(true)
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            await api.deleteV1List(acct.domain, acct.at, listId)
            loadListList(account)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
        } finally {
            setLoading(false)
        }
    }
    const addToList = async (listId: string, userId: string) => {
        try {
            setLoading(true)
            const acct: S.Account = await storage.getCertainItem('accounts', 'id', account)
            await api.postV1ListUser(acct.domain, acct.at, listId, userId)
            loadListList(account)
        } catch (e: any) {
            if (e.toString().match(/Account/)) {
                const a = await Alert.promise('削除する', 'このリストから削除しますか？', Alert.DELETE)
                if (a === 1) delUser(userId ,listId)
            } else {
                Alert.alert('Error', e.toString())

            }
        } finally {
            setLoading(false)
        }
    }
    const renderUser = (e: any) => {
        const item = e.item as M.Account
        return (
            <View>
                <View style={commonStyle.horizonal}>
                    <Account acctId={account} account={item} key={`userInList ${item.id}`} goToAccount={(id: string) => true} />
                    <TouchableOpacity onPress={() => delUser(item.id)} style={styles.editMenu}>
                        <MaterialIcons size={20} name="delete" color="red" />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 5 }} />
                <View style={commonStyle.separator} />
            </View>
        )
    }
    return (
        <View style={{ padding: 5, flex: 1 }}>
            <TouchableOpacity onPress={() => selectAcct()} style={{ marginVertical: 15 }}>
                <Text style={{ textDecorationLine: 'underline' }}>{accountTxt}</Text>
            </TouchableOpacity>
            {mode === 'user' ?
                <View style={commonStyle.horizonal}>
                    <TextInput placeholder="リスト名編集" onChangeText={(text) => setChangeName(text)} style={[{ borderColor: changeName ? 'black' : '#bf1313' }, styles.form]} value={changeName} />
                    <Button title="変更" onPress={async () => changeListName()} icon="refresh" style={{ width: '29%', marginLeft: '1%' }} />
                </View>
                : <View style={commonStyle.horizonal}>
                    <TextInput placeholder="新規リスト名" onChangeText={(text) => setNewListName(text)} style={[{ borderColor: newListName ? 'black' : '#bf1313' }, styles.form]} value={newListName} />
                    <Button title="作成" onPress={async () => addList()} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
                </View>}
            <View style={{ height: 5 }} />
            {mode === 'user' && <Button title="戻る" onPress={async () => setMode('list')} icon="arrow-back" style={{ width: '29%', marginLeft: '1%' }} />}
            <View style={{ height: 10 }} />
            {loading && <Text>Loading...</Text>}
            {mode === 'list' && <FlatList ListEmptyComponent={() => <Text>データがありません</Text>} data={list} renderItem={renderList} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadListList(account)} />} />}
            {mode === 'user' && <FlatList ListEmptyComponent={() => <Text>データがありません</Text>} data={user} renderItem={renderUser} />}

        </View>
    )
}
let android = false
if (Platform.OS === 'android') android = true
const styles = StyleSheet.create({
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
    }
})
