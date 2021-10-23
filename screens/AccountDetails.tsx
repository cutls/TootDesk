import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Animated, Image, FlatList } from 'react-native'
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
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Account from '../components/Account'
import * as WebBrowser from 'expo-web-browser'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
    img: defaultHTMLElementModels.img.extend({
        contentModel: HTMLContentModel.mixed,
    })
}
const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = StatusBar.currentHeight ? StatusBar.currentHeight : 20
export default function AccountDetails({ navigation, route }: StackScreenProps<ParamList, 'AccountDetails'>) {
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
    const [account, setAccount] = useState({} as M.Account)
    const [fffw, setFffw] = useState([{}, {}] as [M.Account[], M.Account[]])
    const [uTl, setUtl] = useState([] as M.Toot[])
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
            const acctData = await api.getV1Account(domain, at, id)
            const userTl = await api.getV1AccountsStatuses(domain, at, id)
            setUtl(userTl)
            const fings = await api.getV1Follows(domain, at, id)
            const fers = await api.getV1Follower(domain, at, id)
            setFffw([fings, fers])
            setDeletable(`@${acctData.acct}@${domain}` === acct)
            setAcctId(acctIdGet)
            setAccount(acctData)
            setReady(true)
        } catch (e) {
            console.log(e)
        }
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
            const status = data.account
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
    const compactAcct = (e: any) => {
        const item = e.item as M.Account
        return (<TouchableOpacity onPress={() => init(acctId, item.id)}>
            <Account account={item} key={`notification ${item.id}`} />
        </TouchableOpacity>)
    }
    const compactToot = (e: any) => {
        const item = e.item as M.Toot
        return (<TouchableOpacity onPress={() => navigation.navigate('Toot', { acctId, id: item.id, notification: false })}>
            <AccountName account={item.account} miniEmoji={true} />
            <HTML
                source={{ html: emojify(item.content, item.emojis) }}
                tagsStyles={{ p: { margin: 0 } }}
                contentWidth={deviceWidth - 50}
                customHTMLElementModels={renderers}
            />
        </TouchableOpacity>)
    }

    const showAccts = fffw[selectedIndex === 1 ? 0 : 1]
    const fields = account.fields ? account.fields : []
    interface IField {
        name: string;
        value: string;
        verified_at?: string | null | undefined;
    }
    interface ParamField {
        field: IField
    }
    console.log(fields)
    const Fields = (fieldParam: ParamField) => {
        const { field } = fieldParam
        return <View style={commonStyle.horizonal}>
            <View style={styles.fieldName}>
                <Text>{field.name}</Text>
            </View>
            <View style={styles.fieldValue}>
                <HTML
                    source={{ html: field.value }}
                    tagsStyles={{ p: { margin: 0 } }}
                    contentWidth={deviceWidth - 150}
                    customHTMLElementModels={renderers}
                    renderersProps={{
                        a: {
                            onPress: async (e, href) => await WebBrowser.openBrowserAsync(href)
                        }
                    }}
                />
            </View>
        </View>
    }
    return (
        <View style={commonStyle.container}>
            <Modal visible={imageModal.show} animationType="fade">
                <ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url, i, show })} />
            </Modal>
            <Image source={{ uri: account.header }} style={{ width: deviceWidth, height: 150, top: -10, left: -10 }} resizeMode="cover" />
            <View style={commonStyle.horizonal}>
                <Image source={{ uri: account.avatar }} style={{ width: 100, height: 100 }} />
                <View>
                    <AccountName account={account} fontSize={20} />
                    <View style={{ width: deviceWidth - 120 }}>
                        <HTML
                            source={{ html: emojify(account.note, account.emojis) }}
                            tagsStyles={{ p: { margin: 0 } }}
                            contentWidth={deviceWidth - 150}
                            customHTMLElementModels={renderers}
                            renderersProps={{
                                a: {
                                    onPress: async (e, href) => await WebBrowser.openBrowserAsync(href)
                                }
                            }}
                        />
                    </View>
                </View>
            </View>
            <View style={{ height: 10 }} />
            {fields[0] ? <Fields field={fields[0]} /> : null}
            {fields[1] ? <Fields field={fields[1]} /> : null}
            {fields[2] ? <Fields field={fields[2]} /> : null}
            {fields[3] ? <Fields field={fields[3]} /> : null}
            <SegmentedControl
                style={{ marginVertical: 15 }}
                values={[`${account.statuses_count}トゥート`, `${account.following_count}フォロー`, `${account.followers_count}フォロワー`]}
                selectedIndex={selectedIndex}
                onChange={(event) => {
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
                }}
            />
            {selectedIndex > 0 ? <FlatList data={showAccts} renderItem={compactAcct} /> : null}
            {selectedIndex === 0 ? <FlatList data={uTl} renderItem={compactToot} /> : null}
            {tooting ? <Post acct={acctId} tooting={setTooting} setText={setText} text={text} replyId={replyId} setReplyId={setReplyId} /> : null}
        </View>
    )
}
const styles = StyleSheet.create({
    fieldName: {
        width: (deviceWidth - 20) / 3,
        padding: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ddd'
    },
    fieldValue: {
        width: (deviceWidth - 20) / 3 * 2,
        padding: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eee'
    }
})