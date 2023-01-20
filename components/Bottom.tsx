import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, Dimensions, Modal, useWindowDimensions, useColorScheme } from 'react-native'
import { Text, View, Button } from './Themed'
import { Ionicons } from '@expo/vector-icons'
import { ParamList, IState } from '../interfaces/ParamList'
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import TimelineProps from '../interfaces/TimelineProps'
import NotifitionModal from '../components/modal/NotificationModal'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import TimelineModal from './modal/TimelineModal'
import { ChangeTlContext } from '../utils/context/changeTl'
import timelineLabel from '../utils/timelineLabel'
import Post from './Post'
interface PropBottomFromRoot {
    goToAccountManager: () => void,
    timelines: TimelineProps[],
    nowSelecting: number,
    setNewNotif: IState<boolean>
    newNotif: boolean
    imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
    reply: (id: string, acct: string) => void
    navigation: StackNavigationProp<ParamList, any>
    insertText: string
    replyId: string
    setReplyId: IState<string>
    setInsertText: IState<string>
}
export default (params: PropBottomFromRoot) => {
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const { width: deviceWidth } = useWindowDimensions()
	const styles = createStyle(deviceWidth, isDark)
    const { changeTl: setNowSelecting } = useContext(ChangeTlContext)
    const { timelines, nowSelecting, newNotif, setNewNotif, imgModalTrigger, reply, goToAccountManager, navigation, insertText, replyId, setReplyId, setInsertText } = params
    const timeline = timelines[nowSelecting]
    const [acct, setAcct] = useState({ id: 'a' } as S.Account)
    const [showNotif, setShowNotif] = useState(false)
    const [showTL, setShowTL] = useState(false)
    const [tooting, setTooting] = useState(false)
    const init = async () => {
        const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
        setAcct(acct)
    }
    useEffect(() => { init() }, [timeline])
    const showTrgNotif = () => {
        setShowNotif(true)
        setNewNotif(false)
    }
    const toot = (i: boolean) => {
        setTooting(i)
        if (!i) setReplyId('')
        if (!i) setInsertText('')
    }
    useEffect(() => {
        if (insertText) setTooting(true)
    }, [insertText])
    if (!timeline) return null
    const tlLabel = timelineLabel(timeline)
    return (
        <View style={styles.bottom}>
            {showTL ? <TimelineModal setModal={setShowTL} goToAccountManager={goToAccountManager} navigation={navigation} /> : null}
            {showNotif ? <NotifitionModal navigation={navigation} setShowNotif={setShowNotif} acctId={acct.id} imgModalTrigger={imgModalTrigger} reply={reply} /> : null}
            <TouchableOpacity style={styles.config} onPress={() => showTrgNotif()}>
                <Ionicons name="notifications" size={30} color={newNotif ? 'red' : isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tlChanger} onPress={() => timelines.length > 1 ? setNowSelecting(nowSelecting ? 0 : 1) : true}>
                <Text style={styles.tlChangerText}>{nowSelecting ? 1 : 2}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.centerMenu} onPress={() => setShowTL(true)}>
                <Text numberOfLines={1}>{tlLabel}</Text>
                <Text>{timeline.acctName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.config} onPress={() => toot(true)}>
                <Ionicons name="create" size={30} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Post show={tooting} acct={acct.acct} tooting={toot} insertText={insertText} replyId={replyId} />
        </View>
    )
}
function createStyle(deviceWidth: number, isDark: boolean) {
    return StyleSheet.create({
        bottom: {
            flex: 1,
            flexDirection: 'row',
            padding: 5
        },
        config: {
            top: 10,
            marginRight: 10
        },
        centerMenu: {
            width: deviceWidth - 130,
            paddingTop: 10
        },
        toot: {
            width: 100,
            position: 'absolute',
            right: 5
        },
        tlChanger: {
            top: 10,
            height: 35,
            borderWidth: 2,
            borderColor: isDark ? 'white' : 'black',
            borderRadius: 10,
            paddingHorizontal: 10,
            marginRight: 10,
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center'
        },
        tlChangerText: {
            fontSize: 20,
        }
    })
}
/*
<Bottom goToAccountManager={goToAccountManager} tooting={toSetTooting} timelines={timelines} nowSelecting={nowSelecting} setNowSelecting={changeTl} setNewNotif={setNewNotif} newNotif={newNotif} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url: url, i: i, show: show })} />
*/