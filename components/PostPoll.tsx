import React, { useEffect, useState } from 'react'
import { StyleSheet, TextInput, ActionSheetIOS, useColorScheme, useWindowDimensions, findNodeHandle } from 'react-native'
import { TouchableOpacity, View, Text } from '../components/Themed'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import moment from 'moment-timezone'
import 'moment/locale/ja'
import { commonStyle } from '../utils/styles'
import i18n from '../utils/i18n'
import * as R from '../interfaces/MastodonApiRequests'
import { IState } from '../interfaces/ParamList'

interface FromPostToPoll {
    setPoll: IState<R.Status['poll'] | null>
    setShowPoll: IState<boolean>
}
export default (props: FromPostToPoll) => {
    const { setPoll, setShowPoll } = props
    const { width, height } = useWindowDimensions()
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const styles = createStyle(width, height, isDark)
    const [poll1, setPoll1] = useState('')
    const [poll2, setPoll2] = useState('')
    const [poll3, setPoll3] = useState('')
    const [poll4, setPoll4] = useState('')
    const [multiplePoll, setMultiplePoll] = useState(false)
    const [hiddenPoll, setHiddenPoll] = useState(false)
    const [endPoll, setEndPoll] = useState(300)
    const [anchorEndPoll, setAnchorEndPoll] = useState<null | number>(0)
    useEffect(() => setPoll({
        options: [poll1, poll2, poll3, poll4].filter((i) => !!i),
        expires_in: endPoll,
        multiple: multiplePoll,
        hide_totals: hiddenPoll
    }), [poll1, poll2, poll3, poll4, multiplePoll, hiddenPoll, endPoll])
    const endPollSet = () =>
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [i18n.t('5分'), i18n.t('30分'), i18n.t('1時間'), i18n.t('6時間'), i18n.t('1日'), i18n.t('3日'), i18n.t('7日'), i18n.t('キャンセル')],
                anchor: anchorEndPoll || undefined,
                cancelButtonIndex: 7
            },
            (buttonIndex) => {
                if (buttonIndex === 0) setEndPoll(300)
                if (buttonIndex === 1) setEndPoll(1800)
                if (buttonIndex === 2) setEndPoll(3600)
                if (buttonIndex === 3) setEndPoll(21600)
                if (buttonIndex === 4) setEndPoll(86400)
                if (buttonIndex === 5) setEndPoll(86400 * 3)
                if (buttonIndex === 6) setEndPoll(86400 * 7)
            }
        )
    return <View>
        <TextInput style={[styles.pollArea]} placeholder={`${i18n.t('選択肢')}1`} value={poll1} onChangeText={(text) => setPoll1(text)} />
        <TextInput style={[styles.pollArea]} placeholder={`${i18n.t('選択肢')}2`} value={poll2} onChangeText={(text) => setPoll2(text)} />
        <TextInput style={[styles.pollArea]} placeholder={`${i18n.t('選択肢')}3(${i18n.t('オプション')})`} value={poll3} onChangeText={(text) => setPoll3(text)} />
        <TextInput style={[styles.pollArea]} placeholder={`${i18n.t('選択肢')}4(${i18n.t('オプション')})`} value={poll4} onChangeText={(text) => setPoll4(text)} />
        <View style={[commonStyle.horizonal, { marginBottom: 10, justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
                <MaterialCommunityIcons name={multiplePoll ? 'checkbox-multiple-marked-outline' : 'checkbox-marked-outline'} size={20} color={isDark ? 'white' : 'black'} onPress={() => setMultiplePoll(!multiplePoll)} />
            </View>
            <View>
                <TouchableOpacity onPress={() => endPollSet()} style={commonStyle.horizonal}>
                    <MaterialIcons name="timer" size={18} style={styles.icon} ref={(c: any) => setAnchorEndPoll(findNodeHandle(c))} />
                    <Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{moment().add(endPoll, 'seconds').fromNow()}</Text>
                </TouchableOpacity>
            </View>
        </View>
        <View style={[commonStyle.horizonal, { justifyContent: 'space-between' }]}>
            <TouchableOpacity onPress={() => setHiddenPoll(!hiddenPoll)} style={commonStyle.horizonal}>
                <MaterialCommunityIcons name={hiddenPoll ? 'checkbox-marked-outline' : 'crop-square'} size={18} color={isDark ? 'white' : 'black'} />
                <Text>{i18n.t('終了まで票数を隠す')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPoll(false)} style={commonStyle.horizonal}>
                <Text style={isDark ? commonStyle.linkDark : commonStyle.link}>{i18n.t('投票を削除')}</Text>
            </TouchableOpacity>

        </View>
    </View>
}
function createStyle(deviceWidth: number, deviceHeight: number, isDark: boolean) {
    const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    return StyleSheet.create({
        icon: {
            marginHorizontal: 15,
            color: isDark ? 'white' : 'black'
        },
        pollArea: {
            marginVertical: 4,
            borderWidth: 1,
            borderRadius: 5,
            width: deviceWidth - 40,
            textAlignVertical: 'top',
            padding: 5,
            color: isDark ? 'white' : 'black',
            borderColor: isDark ? 'white' : 'black'
        },
        horizonal: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-around'
        }
    })
}