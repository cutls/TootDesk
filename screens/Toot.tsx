import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Animated, Alert, FlatList } from 'react-native'
import * as Linking from 'expo-linking'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import { loginFirst, getAt } from '../utils/login'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import { Ionicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import * as api from '../utils/api'
import { commonStyle } from '../utils/styles'
import axios from 'axios'
import Toot from '../components/Toot'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { AccountName, emojify } from '../components/AccountName'
import HTML, { extendDefaultRenderer, HTMLContentModel } from 'react-native-render-html'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Account from '../components/Account'

const renderers = {
    img: extendDefaultRenderer('img', {
        contentModel: HTMLContentModel.mixed,
    }),
}

const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = StatusBar.currentHeight ? StatusBar.currentHeight : 20
export default function TootIndv({ navigation, route }: StackScreenProps<ParamList, 'Toot'>) {
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Root')} style={{ marginLeft: 10 }}>
                    <Ionicons name="arrow-back" size={30} />
                </TouchableOpacity>
            ),
        });
    }, [navigation])
    const [ready, setReady] = useState(false)
    const [inited, setInited] = useState(false)
    const [tooting, setTooting] = useState(false)
    const [deletable, setDeletable] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [toot, setToot] = useState({} as M.Toot)
    const [ancestors, setAncestors] = useState([] as M.Toot[])
    const [descendants, setDescendants] = useState([] as M.Toot[])
    const [accounts, setAccounts] = useState([] as M.Account[][])
    const [acctId, setAcctId] = useState('')
    const [text, setText] = useState('' as string)
    const [replyId, setReplyId] = useState('' as string)
    const [imageModal, setImageModal] = useState({ url: [''], i: 0, show: false })
    let at: string | undefined
    let notfId: string | undefined
    const init = async (acctIdGet: string, id: string) => {
        try {
            setInited(true)
            const { domain, at, acct } = (await storage.getCertainItem('accounts', 'id', acctIdGet)) as S.Account
            const tootData = await api.getV1Toot(domain, at, id)
            const context = await api.getV1Context(domain, at, id)
            const faved = await api.getV1Faved(domain, at, id)
            const bted = await api.getV1Bted(domain, at, id)
            setAccounts([faved, bted])
            setDeletable(`@${tootData.account.acct}@${domain}` === acct)
            setAcctId(acctIdGet)
            setToot(tootData)
            setAncestors(context.ancestors)
            setDescendants(context.descendants)
            setReady(true)
        } catch (e) { }
    }
    const solve = async (domain: string, at: string, notfId: string) => {
        try {
            setInited(true)
            const acct = (await storage.getItem('accounts')) as S.Account[]
            const my = await api.getV1AccountsVerifyCredentials(domain, at)
            let acctId
            for (const a of acct) {
                if (a.acct === `@${my.acct}@${domain}`) acctId = a.id
            }
            if (!acctId) return false
            const data = await api.getV1NotificationId(domain, at, notfId)
            const status = data.status
            if (!status) return false
            init(acctId, status.id)
        } catch (e) { }
    }
    if (!route.params) return null

    if (route.params.notification) {
        let domain = route.params.domain
        at = route.params.at
        notfId = route.params.notfId
        if (!domain || !at || !notfId) return null
        if (!inited) solve(domain, at, notfId)
    } else {
        const acctIdGet = route.params.acctId
        const id = route.params.id
        if (!acctIdGet || !id) return null
        if (!inited) init(acctIdGet, id)
    }
    if (!ready) {
        return <View style={[commonStyle.container, commonStyle.blockCenter]}>
            <Text>Loading...</Text>
        </View>
    }
    const delToot = (key: string) => {
        Alert.alert(
            'トゥートを削除します',
            'この操作は取り消せません。',
            [
                {
                    text: 'キャンセル',
                    onPress: () => true,
                    style: 'cancel',
                },
                {
                    text: '削除',
                    onPress: async () => {

                    },
                },
            ],
            { cancelable: true }
        )
    }
    const statusPost = async (action: 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete', id: string, changeStatus: React.Dispatch<any>) => {
        try {
            const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            let positive = true
            let ct = 0
            if (action === 'delete') {
                const data = await api.deleteV1Status(acct.domain, acct.at, id)
                navigation.navigate('Root')
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
            }
            changeStatus({ is: positive, ct })
        } catch (e) {

        }
    }
    const reply = (id: string, acct: string) => {
        setText(`@${acct} `)
        setReplyId(id)
        setTooting(true)
    }
    const compactToot = (e: any) => {
        const item = e.item as M.Toot
        return (<TouchableOpacity onPress={() => init(acctId, item.id)}>
            <AccountName account={item.account} miniEmoji={true} />
            <HTML
                source={{ html: emojify(item.content, item.emojis) }}
                tagsStyles={{ p: { margin: 0 } }}
                renderers={renderers}
                contentWidth={deviceWidth - 50}
                onLinkPress={(e, href) => true}
            />
        </TouchableOpacity>)
    }
    const compactAcct = (e: any) => {
        const item = e.item as M.Account
        return (<TouchableOpacity onPress={() => true}>
            <Account account={item} key={`notification ${item.id}`} />
        </TouchableOpacity>)
    }

    const showAccts = accounts[selectedIndex]
    return (
        <View style={commonStyle.container}>
            <Modal visible={imageModal.show} animationType="fade">
                <ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url, i, show })} />
            </Modal>
            {ancestors.length ? <FlatList data={ancestors} renderItem={compactToot} style={{ maxHeight: ancestors.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : ancestors.length * 50 }} /> : null}
            <Toot
                navigation={navigation}
                deletable={deletable}
                acctId={acctId}
                toot={toot}
                statusPost={statusPost}
                imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url, i, show })}
                reply={reply} />
            {descendants.length ? <FlatList data={descendants} renderItem={compactToot} style={{ maxHeight: descendants.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : descendants.length * 50 }} /> : null}
            <SegmentedControl
                style={{ marginVertical: 15 }}
                values={['お気に入りした人', 'ブーストした人']}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
                }}
            />
            {showAccts ? <FlatList data={showAccts} renderItem={compactAcct} style={{ maxHeight: showAccts.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : showAccts.length * 50 }} /> : <Text style={commonStyle.textCenter}>いません</Text>}
            {tooting ? <Post acct={acctId} tooting={setTooting} setText={setText} text={text} replyId={replyId} setReplyId={setReplyId} /> : null}
        </View>
    )
}