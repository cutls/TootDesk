import * as React from 'react'
import { Text, View, TouchableOpacity } from '../Themed'
import { StyleSheet, Dimensions, Platform, useColorScheme, Modal, useWindowDimensions } from 'react-native'
import { Octicons } from '@expo/vector-icons'
import { commonStyle } from '../../utils/styles'
import NotificationTimeline from '../NotificationTimeline'
import i18n from '../../utils/i18n'
import { useState } from 'react'


let ios = true
if (Platform.OS === 'android') ios = false
export default function NotificationModal({ setShowNotif, acctId, txtAction, navigation }: any) {
    const [modalVisible, setModalVisible] = useState(true)
	const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
    const modalWidth = deviceWidth > 700 ? 700 : deviceWidth
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
        <Modal visible={modalVisible} presentationStyle="pageSheet" animationType="slide">
            <View style={[styles.top, commonStyle.horizonal]}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{i18n.t('通知')}</Text>
                <TouchableOpacity onPress={() => dismiss()}>
                    <Octicons name="x" size={25} color={theFontGrayPlus} />
                </TouchableOpacity>
            </View>
            <NotificationTimeline navigation={navigation} acctId={acctId} txtAction={txtAction} dismiss={dismiss} width={modalWidth} />
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
