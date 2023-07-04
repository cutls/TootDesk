import * as React from 'react'
import { Dimensions, Platform, StyleSheet, Animated, useColorScheme, Modal, FlatList, ActionSheetIOS, ListRenderItem, findNodeHandle, useWindowDimensions, Pressable, ScrollView } from 'react-native'
import { Text, View, Button, TouchableOpacity, TextInput } from '../Themed'
import * as storage from '../../utils/storage'
import * as Alert from '../../utils/alert'
import { commonStyle } from '../../utils/styles'
import { Swipeable } from 'react-native-gesture-handler'
import * as S from '../../interfaces/Storage'
import * as api from '../../utils/api'
import * as R from '../../interfaces/MastodonApiRequests'
import TimelineProps, { TLType, TimelineConfig } from '../../interfaces/TimelineProps'
import { Octicons } from '@expo/vector-icons'
import { ChangeTlContext } from '../../utils/context/changeTl'
import timelineLabel from '../../utils/timelineLabel'
import { IState, ParamList } from '../../interfaces/ParamList'
import { StackNavigationProp } from '@react-navigation/stack'
import { SetConfigContext } from '../../utils/context/config'
import deepClone from '../../utils/deepClone'
import { useKeyboard } from '../../utils/keyboard'
import i18n from '../../utils/i18n'
import { useContext, useEffect, useState } from 'react'

let ios = true
if (Platform.OS != 'ios') ios = false
let web = false
if (Platform.OS === 'web') web = true
interface BottomToTLModalProps {
    setModal: IState<boolean>
    goToAccountManager: () => void
    navigation: StackNavigationProp<ParamList, any>
}
interface ITlBtnProps {
    icon: React.ComponentProps<typeof Octicons>['name']
    name: string
    type: TLType
}

export default ({ setModal, goToAccountManager, navigation }: BottomToTLModalProps) => {
    const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const [keyboardHeight] = useKeyboard()
    const styles = createStyle(deviceWidth, deviceHeight, isDark, keyboardHeight)
    const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    const useWidth = tablet ? 550 : deviceWidth
    const { changeTl: setNowSelecting } = useContext(ChangeTlContext)
    const { config } = useContext(SetConfigContext)
    const [animation, setAnimation] = useState(new Animated.Value(0))
    const [internalShow, setInternalShow] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [mode, setMode] = useState('select')
    const [timelines, setTimelines] = useState<TimelineProps[]>([])
    const [accountListTxt, setAccountListTxt] = useState<string[]>([])
    const [accountList, setAccountList] = useState<string[]>([])
    const [accountTxt, setAccountTxt] = useState<string>('')
    const [account, setAccount] = useState<string>('')
    const [local, setLocal] = useState<string>('')
    const [listSelect, setListSelect] = useState(false)
    const [anchor, setAnchor] = useState<null | number>(0)
    const [anchorAcct, setAnchorAcct] = useState<null | number>(0)
    const tlPerScreen = config.tlPerScreen
    const init = async () => {
        const tls = await storage.getItem('timelines')
        if (tls) setTimelines(tls)
        const accts = (await storage.getItem('accounts')) as S.Account[]
        const item = []
        const itemTxt = []
        for (let acct of accts) {
            item.push(acct.id)
            itemTxt.push(acct.acct)
        }
        setAccount(item[0])
        setAccountTxt(itemTxt[0])
        setAccountList(item)
        setAccountListTxt(itemTxt)
    }
    useEffect(() => { init() }, [])

    const actionSheet = () =>
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
    const select = async (i: number | undefined) => {
        try {
            dismiss()
            setNowSelecting(i ? i : 0, true)
        } catch (e) {

        }
    }
    const dismiss = () => {
        setInternalShow(false)
        setTimeout(() => {
            setModal(false)
        }, 200)
    }
    const save = async () => {
        await storage.setItem('timelines', timelines)
        setEditMode(false)
        setNowSelecting(0)
    }
    const useTl = (type: TLType) => {
        const tl = { type, acct: account, acctName: accountTxt, activated: true, key: `${type} ${account} ${timelines.length}`, timelineData: { target: '' } }
        const cl = timelines
        cl.push(tl)
        storage.setItem('timelines', cl)
        setTimelines(cl)
        setMode('select')
    }
    const glanceTl = (type: TLType) => {
        dismiss()
        const tl = { type, acct: account, acctName: accountTxt, activated: true, key: `${type} ${account} ${timelines.length}`, timelineData: { target: '' } }
        navigation.navigate('TimelineOnly', { timeline: tl })
        setMode('select')
    }
    const delTl = async (key: string) => {
        if (timelines.length < 2) return Alert.alert(i18n.t('カラム数エラー'), i18n.t('カラムは1つ以上必要です'))
        const a = await Alert.promise(i18n.t('カラムを削除します'), i18n.t('この操作は取り消せません。'), Alert.DELETE)
        if (a === 1) {
            const cl = []
            for (const tl of timelines) {
                if (tl.key !== key) cl.push(tl)
            }
            setTimelines(cl)
            storage.setItem('timelines', cl)
        }
    }
    const moveTl = (action: 'up' | 'down', key: string) => {
        const nowTarget = timelines.findIndex((item) => item.key === key)
        const targetItem = timelines[nowTarget]
        const goTarget = nowTarget + (action === 'up' ? -1 : 1)
        if (goTarget < 0. || goTarget === timelines.length) return
        let i = 0
        const newTl = timelines.filter((item) => item.key !== targetItem.key)
        newTl.splice(goTarget, 0, targetItem)
        setTimelines(newTl)
    }
    const selectList = async () => {
        navigation.navigate('ListManager', { acctId: account })
        dismiss()
    }
    const addNoAuth = async () => {
        const tl = { type: 'noAuth' as const, acct: account, acctName: accountTxt, activated: true, key: `noAuth ${local} ${timelines.length}`, timelineData: { target: local } }
        const cl = timelines
        cl.push(tl)
        storage.setItem('timelines', cl)
        setTimelines(cl)
        setMode('select')
    }
    const configOption = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    i18n.t('アカウントマネージャー'),
                    editMode ? i18n.t('編集モード終了') : i18n.t('カラムの編集と削除'),
                    i18n.t('検索'),
                    i18n.t('リスト管理'),
                    i18n.t('設定'),
                    i18n.t('キャンセル')
                ],
                cancelButtonIndex: 5,
                anchor: anchor || undefined,
            },
            (buttonIndex) => {
                if (buttonIndex === 0) return goToAccountManager()
                if (buttonIndex === 1) return setEditMode(!editMode)
                if (buttonIndex === 2) {
                    navigation.navigate('Search')
                    dismiss()
                }
                if (buttonIndex === 3) {
                    navigation.navigate('ListManager', { acctId: account })
                    dismiss()
                }
                if (buttonIndex === 4) {
                    navigation.navigate('Config')
                    dismiss()
                }
            }
        )
    const actionTl = (key: string) => {
        const tlId = timelines.findIndex((item) => item.key === key)
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [`${i18n.t('読み上げ')}${timelines[tlId].config?.speech ? 'ON' : 'OFF'}`, i18n.t('言語フィルター設定へ'), i18n.t('キャンセル')],
                cancelButtonIndex: 2,
            },
            (buttonIndex) => {
                let key: keyof TimelineConfig | null = null
                if (buttonIndex === 0) key = 'speech'
                if (buttonIndex === 1) {
                    navigation.navigate('LangFilter', { tlId })
                    dismiss()
                    return
                }
                if (!key) return
                const config = deepClone<TimelineConfig>(timelines[tlId].config || {})
                if (!config) {
                    const newConfig: TimelineConfig = {}
                    newConfig[key] = true
                    timelines[tlId].config = config
                    setTimelines(deepClone<TimelineProps[]>(timelines))
                } else {
                    const newConfig = !!!config[key]
                    config[key] = newConfig
                    timelines[tlId].config = config
                    setTimelines(deepClone<TimelineProps[]>(timelines))
                }
                alert(tlId)
                setNowSelecting(tlId, true)
                save()
            })
    }
    const renderItem = ({ item, index }: { item: TimelineProps, index: number }) => {
        const tlLabel = timelineLabel(item)
        return (
            <TouchableOpacity onPress={() => editMode || index % tlPerScreen !== 0 ? true : select(index)} style={[commonStyle.horizonal, { width: useWidth }]}>
                <View style={[styles.menu, commonStyle.horizonal]}>
                    {index % tlPerScreen !== 0 && <Octicons name="chevron-right" size={25} style={{ marginTop: 5 }} />}
                    <View>
                        <Text numberOfLines={1}>{tlLabel}</Text>
                        <Text>{item.type === 'noAuth' ? item.timelineData.target : item.acctName}</Text>
                    </View>
                </View>
                {editMode ?
                    <View style={[commonStyle.horizonal, { paddingTop: 10 }]}>
                        <TouchableOpacity onPress={() => moveTl('up', item.key)} style={styles.editMenu}>
                            <Octicons size={20} name="arrow-up" color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveTl('down', item.key)} style={styles.editMenu}>
                            <Octicons size={20} name="arrow-down" color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => delTl(item.key)} style={styles.editMenu}>
                            <Octicons size={20} name="trash" color="red" />
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={[commonStyle.horizonal, { paddingTop: 10, marginLeft: 60 }]}>
                        <TouchableOpacity onPress={() => actionTl(item.key)} style={[styles.editMenu]}>
                            <Octicons size={20} name="tools" color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                }
                <View style={commonStyle.separator} />
            </TouchableOpacity>)
    }
    const TLBtn = (props: ITlBtnProps) => {
        return <TouchableOpacity style={[styles.tlSelBtn]} onPress={() => useTl(props.type)} onLongPress={() => glanceTl(props.type)}>
            <Octicons name={props.icon} size={30} color="#858383" />
            <Text style={styles.tlSelTxt}>{props.name}</Text>
        </TouchableOpacity>
    }
    return (
        <View style={styles.wrap}>
            <Modal visible={internalShow} animationType={tablet ? 'fade' : 'slide'} transparent={true}>

                <Pressable onPress={() => dismiss()} style={styles.pressable}>
                    <View style={tablet ? styles.center : styles.bottom}>
                        <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                            <View style={commonStyle.horizonal}>
                                <TouchableOpacity onPress={() => configOption()}>
                                    <Octicons ref={(c: any) => setAnchor(findNodeHandle(c))} name="three-bars" size={30} color={isDark ? 'white' : 'black'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {mode === 'select' ? <View style={styles.flatlist}>
                            <FlatList data={timelines} renderItem={renderItem}
                                keyExtractor={(item, index) => `${item.key}`} />
                            {editMode ?
                                <Button title={i18n.t('完了')} icon="check" onPress={() => save()} />
                                :
                                <Button title={i18n.t('追加')} icon="plus" onPress={() => setMode('add')} />}
                        </View> :
                            <View>
                                <TouchableOpacity onPress={() => actionSheet()} style={[commonStyle.horizonal, { marginVertical: 15 }]}>
                                    <Octicons style={{ paddingTop: 3 }} ref={(c: any) => setAnchorAcct(findNodeHandle(c))} name="person" />
                                    <Octicons style={{ paddingTop: 3, marginRight: 3 }} name="arrow-switch" />
                                    <Text style={{ textDecorationLine: 'underline' }}>{accountTxt}</Text>
                                </TouchableOpacity>
                                <View style={{ height: 15 }} />
                                <Text style={{ textAlign: 'center' }}>{i18n.t('長押しすると、カラムに追加せずに見ることができます')}</Text>
                                <View style={{ height: 5 }} />
                                <ScrollView style={[commonStyle.horizonal]} horizontal={true}>
                                    <TLBtn name={i18n.t('ホーム')} icon="home" type="home" />
                                    <TLBtn name={i18n.t('ローカル')} icon="people" type="local" />
                                    <TLBtn name={i18n.t('連合')} icon="globe" type="public" />
                                    <TLBtn name={i18n.t('統合')} icon="git-merge" type="mix" />
                                    <TLBtn name={i18n.t('ブックマーク')} icon="bookmark" type="bookmark" />
                                    <TLBtn name={i18n.t('お気に入り')} icon="star" type="fav" />
                                </ScrollView>
                                <TouchableOpacity onPress={() => selectList()} style={{ marginVertical: 10 }}>
                                    <Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{i18n.t('リスト')}</Text>
                                </TouchableOpacity>
                                <View style={{ marginVertical: 5 }} />
                                <Text>{i18n.t('認証のないローカルタイムライン')}</Text>
                                <View style={commonStyle.horizonal}>
                                    <TextInput placeholder={`${i18n.t('ドメイン')}*`} onChangeText={(text) => setLocal(text)} style={[styles.form]} value={local} />
                                    <Button title={i18n.t('追加')} onPress={() => addNoAuth()} icon="plus" style={{ width: '29%', marginLeft: '1%' }} />
                                </View>
                            </View>
                        }
                    </View>
                </Pressable>
            </Modal>
        </View>
    )
}
function createStyle(deviceWidth: number, deviceHeight: number, isDark: boolean, keyboardHeight: number) {
    const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    const heightBottmed = 420 + keyboardHeight
    const heightCentered = 600
    const useHeight = tablet ? heightCentered : heightCentered
    const useWidth = tablet ? 550 : deviceWidth
    return StyleSheet.create({
        bottom: {
            height: heightBottmed,
            top: deviceHeight > heightBottmed ? deviceHeight - heightBottmed : 0,
            padding: 15,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderColor: 'white',
            borderWidth: 1,
            left: -2,
            width: useWidth + 4,
            position: 'absolute',
        },
        center: {
            flex: 0,
            top: deviceHeight / 2 - heightCentered / 2,
            left: deviceWidth / 2 - 275,
            paddingLeft: 25,
            padding: 10,
            width: useWidth,
            height: heightCentered,
            borderColor: isDark ? 'white' : 'black',
            borderWidth: 1,
            borderRadius: 10,
            position: 'absolute'
        },
        wrap: {
            height: deviceHeight,
            width: useWidth,
            top: 0,
            left: 0,
            position: 'absolute',
            zIndex: 99,
        },
        swipedRow: {
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center',
            height: 50,
        },
        menu: {
            borderBottomColor: '#eee',
            borderBottomWidth: 1,
            paddingVertical: 10,
            height: 50,
            width: useWidth - 120
        },
        flatlist: {
            height: useHeight - 250
        },
        tlSelBtn: {
            width: (useWidth - 60) / 4,
            height: (useWidth - 60) / 4,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 5,
            borderWidth: 1,
            borderColor: isDark ? '#eee' : '#d6d6d6',
            margin: 3,
            borderRadius: (useWidth - 60) / 8
        },
        tlSelTxt: {
            fontSize: 12,
            marginTop: 2,
            textAlign: 'center'
        },
        editMenu: {
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 5
        },
        form: {
            marginVertical: 2,
            borderWidth: 1,
            width: '70%',
            padding: 10,
            borderRadius: 10,
        },
        pressable: {
            height: deviceHeight,
            width: deviceWidth,
            top: 0,
            left: 0,
            position: 'absolute',
        },
    })
}