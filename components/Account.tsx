import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Platform, Image, Dimensions } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import { commonStyle } from '../utils/styles'
const deviceWidth = Dimensions.get('window').width
interface FromTimelineToToot {
    account: M.Account
    statusPost?: (action: 'authorize' | 'reject', id: string) => void
    goToAccount: (id: string) => void
    isFR?: boolean
}

export default (props: FromTimelineToToot) => {
    const { account, statusPost, isFR, goToAccount } = props


    return (
        <View style={[commonStyle.horizonal, { alignItems: 'center' }]}>
            <TouchableOpacity style={{ marginRight: 10 }} onPress={() => goToAccount(account.id)}>
                <Image source={{ uri: account.avatar }} style={{ width: 50, height: 50, borderRadius: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 10, width: 200 }} onPress={() => goToAccount(account.id)}>
                <AccountName account={account} />
            </TouchableOpacity>
            {
        isFR && statusPost ? <View style={commonStyle.horizonal}><Button onPress={() => statusPost('authorize', account.id)} title="承認" materialIcon="check" style={styles.btn} />
            <Button onPress={() => statusPost('reject', account.id)} title="拒否" materialIcon="close" style={styles.btn} /></View> : null
    }
        </View >
    )
}
const styles = StyleSheet.create({
    btn: {
        marginHorizontal: 10
    }
})