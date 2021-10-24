import * as React from 'react'
import { Dimensions, Platform, StyleSheet, Animated, useColorScheme, Modal, FlatList, ActionSheetIOS, Alert } from 'react-native'
import { Text, View, Button, TouchableOpacity } from '../Themed'
import * as storage from '../../utils/storage'
import { commonStyle, tablet } from '../../utils/styles'
import { Swipeable } from 'react-native-gesture-handler'
import * as S from '../../interfaces/Storage'
import * as api from '../../utils/api'
import * as R from '../../interfaces/MastodonApiRequests'
import TimelineProps, { TLType } from '../../interfaces/TimelineProps'
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist"
import moment from 'moment-timezone'
import 'moment/locale/ja'
import { MaterialIcons } from '@expo/vector-icons'
moment.locale('ja')
moment.tz.setDefault('Asia/Tokyo')

const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('window').height
let ios = true
if (Platform.OS != 'ios') ios = false
let web = false
if (Platform.OS === 'web') web = true

export default ({ setModal, setNowSelecting, goToAccountManager }: any) => {
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const [inited, setInited] = React.useState(false)
    const [animation, setAnimation] = React.useState(new Animated.Value(0))
    const [internalShow, setInternalShow] = React.useState(true)
    const [editMode, setEditMode] = React.useState(false)
    const [mode, setMode] = React.useState('select')
    const [timelines, setTimelines] = React.useState([] as TimelineProps[])
    const [accountListTxt, setAccountListTxt] = React.useState([] as string[])
    const [accountList, setAccountList] = React.useState([] as string[])
    const [accountTxt, setAccountTxt] = React.useState('' as string)
    const [account, setAccount] = React.useState('' as string)
    const [listSelect, setListSelect] = React.useState(false)
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
    const actionSheet = () =>
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
    const select = async (i: number | undefined) => {
        try {
            dismiss()
            setNowSelecting(i ? i : 0)
        } catch (e) {

        }
    }
    const dismiss = () => {
        setInternalShow(false)
        setTimeout(() => {
            setModal(false)
        }, 200)
        handleAnimation()
    }
    const handleAnimation = () => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start()
    }
    const boxInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'],
    })
    const animatedStyle = {
        backgroundColor: boxInterpolation,
    }
    const useTl = (type: TLType) => {
        const tl = { type, acct: account, acctName: accountTxt, activated: true, key: `${type} ${account} ${timelines.length}`, timelineData: { target: '' } }
        const cl = timelines
        cl.push(tl)
        storage.setItem('timelines', cl)
        setTimelines(cl)
        setMode('select')
    }
    const delTl = (key: string) => {
        if (timelines.length < 2) return alert('カラムは1つ以上必要です')
        Alert.alert(
            'カラムを削除します',
            'この操作は取り消せません。',
            [
                {
                    text: 'キャンセル',
                    onPress: () => true,
                    style: 'cancel',
                },
                {
                    text: '削除',
                    onPress: () => {
                        const cl = []
                        for (const tl of timelines) {
                            if (tl.key !== key) cl.push(tl)
                        }
                        setTimelines(cl)
                        storage.setItem('timelines', cl)
                    },
                },
            ],
            { cancelable: true }
        )

    }
    const renderRightActions = (
        progress: Animated.AnimatedInterpolation,
        dragAnimatedValue: Animated.AnimatedInterpolation,
        key: string
    ) => {
        const opacity = dragAnimatedValue.interpolate({
            inputRange: [-150, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });
        return (
            <View>
                <Animated.View style={[styles.deleteButton, { opacity }]}>
                    <TouchableOpacity onPress={() => delTl(key)}>
                        <Text style={styles.deleteButtonText}>削除</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }
    const selectList = async () => {
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', account)) as S.Account
            const lists = await api.getV1Lists(domain, at)
            const mapList = lists.map((i) => i.id)
            const mapListTxt = lists.map((i) => i.title)
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: mapListTxt,
                    title: 'リストの選択'
                },
                (buttonIndex) => {
                    const id = mapList[buttonIndex]
                    const txt = mapListTxt[buttonIndex]
                    const tl = { type: 'list', acct: account, acctName: accountTxt, activated: true, key: `list ${account} ${timelines.length}`, timelineData: { target: id, title: txt } } as TimelineProps
                    const cl = timelines
                    cl.push(tl)
                    storage.setItem('timelines', cl)
                    setTimelines(cl)
                    setMode('select')
                }
            )
        } catch (e) {
            console.error(e)
        }
    }
    const configOption = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['アカウントマネージャー', editMode ? '編集モード終了' : 'カラムの編集と削除', '検索', 'キャンセル'],
                destructiveButtonIndex: 4,
                cancelButtonIndex: 4
            },
            (buttonIndex) => {
                if (buttonIndex === 0) return goToAccountManager()
                if (buttonIndex === 1) return setEditMode(!editMode)
                if (buttonIndex === 2) return alert('現在使用できません')
            }
        )
    const renderItem = ({ item, index, drag, isActive }: RenderItemParams<TimelineProps>) => {
        let tlLabel = 'Timeline'
        if (item.type === 'home') tlLabel = 'Home'
        if (item.type === 'local') tlLabel = 'Local'
        if (item.type === 'public') tlLabel = 'Public'
        if (item.type === 'user') tlLabel = 'User'
        if (item.type === 'list') tlLabel = `List ${item.timelineData.title}`

        return (
            <Swipeable enabled={editMode} renderRightActions={(a, b) => renderRightActions(a, b, item.key)}>
                <TouchableOpacity onLongPress={drag} onPress={() => editMode ? true : select(index)}>
                    <View style={styles.menu}>
                        <Text>{tlLabel}</Text>
                        <Text>{item.acctName}</Text>
                    </View>
                    <View style={commonStyle.separator} />
                </TouchableOpacity>
            </Swipeable>)
    }
    return (
        <Animated.View style={web ? [styles.wrap] : { ...styles.wrap, ...animatedStyle }}>
            <Modal visible={internalShow} animationType={tablet ? 'fade' : 'slide'} transparent={true}>
                <View style={tablet ? styles.center : styles.bottom}>
                    <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                        <View style={commonStyle.horizonal}>
                            <TouchableOpacity onPress={() => configOption()}>
                                <MaterialIcons name="more-vert" size={30} color={isDark ? 'white' : 'black'} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => dismiss()}>
                            <MaterialIcons name="close" size={30} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                    {mode === 'select' ? <View style={styles.flatlist}>
                        <DraggableFlatList data={timelines} renderItem={renderItem}
                            keyExtractor={(item, index) => `draggable-item-${item.key}`}
                            onDragEnd={({ data }) => setTimelines(data)} />
                        {editMode ?
                            <Button title="完了" materialIcon="done" onPress={() => setEditMode(false)} />
                            :
                            <Button title="追加" icon="add" onPress={() => setMode('add')} />}
                    </View> :
                        <View>
                            <TouchableOpacity onPress={() => actionSheet()} style={{ paddingHorizontal: 10 }}>
                                <Text>タップしてアカウントを選択: {accountTxt}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 25 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="ホーム" onPress={() => useTl('home')} style={styles.tlBtn} />
                                <Button title="ローカル" onPress={() => useTl('local')} style={styles.tlBtn} />
                            </View>
                            <View style={{ height: 10 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="連合" onPress={() => useTl('public')} style={styles.tlBtn} />
                                <Button title="ブックマーク" onPress={() => useTl('bookmark')} style={styles.tlBtn} />
                            </View>
                            <View style={{ height: 10 }} />
                            <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
                                <Button title="リスト" onPress={() => selectList()} style={styles.tlBtn} />
                            </View>
                        </View>
                    }
                </View>
            </Modal>
        </Animated.View>
    )
}
const heightBottmed = 420
const heightCentered = 600
const useHeight = tablet ? heightCentered : heightCentered
const styles = StyleSheet.create({
    bottom: {
        height: heightBottmed,
        top: deviceHeight > heightBottmed ? deviceHeight - heightBottmed : 0,
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderColor: 'white',
        borderWidth: 1,
        left: -2,
        width: deviceWidth + 4,
        position: 'absolute',
    },
    center: {
        flex: 0,
        top: deviceHeight / 2 - heightCentered / 2,
        left: deviceWidth / 2 - 275,
        paddingLeft: 25,
        padding: 10,
        paddingTop: 0,
        width: 550,
        height: heightCentered,
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 10,
        position: 'absolute',
    },
    wrap: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: deviceHeight,
        width: deviceWidth,
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
    deleteButton: {
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: '#e83a00',
        height: 50,
        width: 100,
        paddingHorizontal: 10
    },
    deleteButtonText: {
        backgroundColor: '#e83a00',
        color: 'white',
        textAlign: 'right',
        fontSize: 20
    },
    menu: {
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        paddingVertical: 10,
        height: 50
    },
    flatlist: {
        height: useHeight - 250
    },
    tlBtn: {
        width: (deviceWidth - 40) / 2
    }
})
