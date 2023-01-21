import * as React from 'react'
import { Dimensions, Platform, StyleSheet, Animated, useColorScheme, Modal, FlatList, ActionSheetIOS, ListRenderItem, findNodeHandle, useWindowDimensions } from 'react-native'
import { Text, View, Button, TouchableOpacity, TextInput } from '../Themed'
import * as storage from '../../utils/storage'
import * as Alert from '../../utils/alert'
import { commonStyle } from '../../utils/styles'
import { Swipeable } from 'react-native-gesture-handler'
import * as S from '../../interfaces/Storage'
import * as api from '../../utils/api'
import * as R from '../../interfaces/MastodonApiRequests'
import TimelineProps, { TLType } from '../../interfaces/TimelineProps'
import moment from 'moment-timezone'
import 'moment/locale/ja'
moment.locale('ja')
moment.tz.setDefault('Asia/Tokyo')
import { MaterialIcons } from '@expo/vector-icons'
import { ChangeTlContext } from '../../utils/context/changeTl'
import timelineLabel from '../../utils/timelineLabel'
import { IState, ParamList } from '../../interfaces/ParamList'
import { StackNavigationProp } from '@react-navigation/stack'
import { SetConfigContext } from '../../utils/context/config'

let ios = true
if (Platform.OS != 'ios') ios = false
let web = false
if (Platform.OS === 'web') web = true
interface BottomToTLModalProps {
    setModal: IState<boolean>
    goToAccountManager: () => void
    navigation: StackNavigationProp<ParamList, any>
}

export default ({ setModal, goToAccountManager, navigation }: BottomToTLModalProps) => {
    const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const styles = createStyle(deviceWidth, deviceHeight, isDark)
    const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    const useWidth = tablet ? 550 : deviceWidth
    const { changeTl: setNowSelecting } = React.useContext(ChangeTlContext)
    const { config } = React.useContext(SetConfigContext)
    const [inited, setInited] = React.useState(false)
    const [animation, setAnimation] = React.useState(new Animated.Value(0))
    const [internalShow, setInternalShow] = React.useState(true)
    const [editMode, setEditMode] = React.useState(false)
    const [mode, setMode] = React.useState('select')
    const [timelines, setTimelines] = React.useState<TimelineProps[]>([])
    const [accountListTxt, setAccountListTxt] = React.useState<string[]>([])
    const [accountList, setAccountList] = React.useState<string[]>([])
    const [accountTxt, setAccountTxt] = React.useState<string>('')
    const [account, setAccount] = React.useState<string>('')
    const [local, setLocal] = React.useState<string>('')
    const [listSelect, setListSelect] = React.useState(false)
    const [anchor, setAnchor] = React.useState<null | number>(0)
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
        setInited(true)
    }
    if (!inited) init()

    const [anchorAcct, setAnchorAcct] = React.useState<null | number>(0)
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
        if (timelines.length < 2) return Alert.alert('カラム数エラー', 'カラムは1つ以上必要です')
        const a = await Alert.promise('カラムを削除します', 'この操作は取り消せません。', Alert.DELETE)
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
                options: ['アカウントマネージャー', editMode ? '編集モード終了' : 'カラムの編集と削除', '検索', 'リスト管理', '設定', 'キャンセル'],
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
    const renderItem = ({ item, index }: { item: TimelineProps, index: number }) => {
        const tlLabel = timelineLabel(item)
        return (
            <TouchableOpacity onPress={() => editMode || index % tlPerScreen !== 0 ? true : select(index)} style={[commonStyle.horizonal, { width: useWidth }]}>
                <View style={[styles.menu, commonStyle.horizonal]}>
                    {index % tlPerScreen !== 0 && <MaterialIcons name="chevron-right" size={25} style={{ marginTop: 5 }} />}
                    <View>
                        <Text numberOfLines={1}>{tlLabel}</Text>
                        <Text>{item.type === 'noAuth' ? item.timelineData.target : item.acctName}</Text>
                    </View>
                </View>
                {editMode &&
                    <View style={[commonStyle.horizonal, { paddingTop: 10 }]}>
                        <TouchableOpacity onPress={() => moveTl('up', item.key)} style={styles.editMenu}>
                            <MaterialIcons size={20} name="arrow-upward" color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveTl('down', item.key)} style={styles.editMenu}>
                            <MaterialIcons size={20} name="arrow-downward" color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => delTl(item.key)} style={styles.editMenu}>
                            <MaterialIcons size={20} name="delete" color="red" />
                        </TouchableOpacity>
                    </View>

                }
                <View style={commonStyle.separator} />
            </TouchableOpacity>)
    }
    return (
        <View style={styles.wrap}>
            <Modal visible={internalShow} animationType={tablet ? 'fade' : 'slide'} transparent={true}>
                <View style={tablet ? styles.center : styles.bottom}>
                    <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                        <View style={commonStyle.horizonal}>
                            <TouchableOpacity onPress={() => configOption()}>
                                <MaterialIcons ref={(c: any) => setAnchor(findNodeHandle(c))} name="more-vert" size={30} color={isDark ? 'white' : 'black'} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => dismiss()}>
                            <MaterialIcons name="close" size={30} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                    {mode === 'select' ? <View style={styles.flatlist}>
                        <FlatList data={timelines} renderItem={renderItem}
                            keyExtractor={(item, index) => `${item.key}`} />
                        {editMode ?
                            <Button title="完了" icon="done" onPress={() => save()} />
                            :
                            <Button title="追加" icon="add" onPress={() => setMode('add')} />}
                    </View> :
                        <View>
                            <TouchableOpacity onPress={() => actionSheet()} style={[commonStyle.horizonal, { marginVertical: 15 }]}>
                                <MaterialIcons style={{ paddingTop: 3 }} ref={(c: any) => setAnchorAcct(findNodeHandle(c))} name="switch-account" />
                                <Text style={{ textDecorationLine: 'underline' }}>{accountTxt}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 15 }} />
                            <Text>長押しすると、カラムに追加せずに見ることができます</Text>
                            <View style={{ height: 5 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="ホーム" onPress={() => useTl('home')} style={styles.tlBtn} onLongPress={() => glanceTl('home')} />
                                <Button title="ローカル" onPress={() => useTl('local')} style={styles.tlBtn} onLongPress={() => glanceTl('local')} />
                            </View>
                            <View style={{ height: 10 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="連合" onPress={() => useTl('public')} style={styles.tlBtn} onLongPress={() => glanceTl('public')} />
                                <Button title="リスト" onPress={() => selectList()} style={styles.tlBtn} />
                            </View>
                            <View style={{ height: 10 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="ブックマーク" onPress={() => useTl('bookmark')} style={styles.tlBtn} onLongPress={() => glanceTl('bookmark')} />
                                <Button title="お気に入り" onPress={() => useTl('fav')} style={styles.tlBtn} onLongPress={() => glanceTl('fav')} />
                            </View>
                            <View style={{ marginVertical: 5 }} />
                            <View style={commonStyle.horizonal}>
                                <TextInput placeholder="ドメイン*" onChangeText={(text) => setLocal(text)} style={[styles.form]} value={local} />
                                <Button title="追加" onPress={() => addNoAuth()} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
                            </View>
                        </View>
                    }
                </View>
            </Modal>
        </View>
    )
}
function createStyle(deviceWidth: number, deviceHeight: number, isDark: boolean) {
    const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    const heightBottmed = 420
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
        tlBtn: {
            width: (useWidth - 40) / 2
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
    })
}