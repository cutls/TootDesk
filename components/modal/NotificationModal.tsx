import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { Text, View, TouchableOpacity, Button } from '../Themed'
import { StyleSheet, Image, FlatList, Dimensions, Platform, useColorScheme, Modal } from 'react-native'
import { statusBarHeight } from '../../utils/statusBar'
import * as api from '../../utils/api'
import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons'
import { commonStyle, tablet } from '../../utils/styles'
import NotificationTimeline from '../NotificationTimeline'
import * as R from '../../interfaces/MastodonApiRequests'
import * as storage from '../../utils/storage'
import * as S from '../../interfaces/Storage'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('window').height
let ios = true
if (Platform.OS === 'android') ios = false
const g = Math.floor(deviceWidth / 50)
export default function SelectCustomEmoji({ setShowNotif, acctId, imgModalTrigger, reply, navigation }: any) {
    const [modalVisible, setModalVisible] = React.useState(true)
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
    const dismiss = () => {
        setModalVisible(false)
        setTimeout(() => setShowNotif(false), 200)
    }
    const subscribe = async () => {
       
    }
    return (
        <Modal visible={modalVisible} presentationStyle="formSheet" animationType="slide">
            {ios ? <View style={{ height: statusBarHeight() }} /> : null}
            <View style={[styles.top, commonStyle.horizonal]}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>通知</Text>
                <TouchableOpacity onPress={() => dismiss()}>
                    <MaterialIcons name="close" size={25} color={theFontGrayPlus} />
                </TouchableOpacity>
            </View>
            <NotificationTimeline navigation={navigation} acctId={acctId} imgModalTrigger={imgModalTrigger} reply={reply} dismiss={dismiss} />
        </Modal>
    )
}

const styles = StyleSheet.create({
    top: {
        padding: 15,
        justifyContent: 'space-between',
        elevation: 5,
    },
})
