import React, { useState } from 'react'
import { Image } from 'expo-image'
import { StyleSheet, Platform, Dimensions } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { AccountName, emojify } from './AccountName'
import { commonStyle } from '../utils/styles'
import { statusPostAcct as statusPost } from '../utils/changeStatus'
import i18n from '../utils/i18n'
interface FromTimelineToToot {
    acctId: string
    account: M.Account
    goToAccount: (id: string) => void
    isFR?: boolean
    width: number
}

export default (props: FromTimelineToToot) => {
    const { account, isFR, goToAccount, acctId, width } = props


    return (
        <View style={[commonStyle.horizonal, { alignItems: 'center' }]}>
            <TouchableOpacity style={{ marginRight: 10 }} onPress={() => goToAccount(account.id)}>
                <Image source={{ uri: account.avatar }} style={{ width: 50, height: 50, borderRadius: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 10, width: 200 }} onPress={() => goToAccount(account.id)}>
                <AccountName account={account} width={width} />
            </TouchableOpacity>
            {
        isFR && statusPost ? <View style={commonStyle.horizonal}><Button onPress={() => statusPost('authorize', acctId, account.id)} title={i18n.t('承認')} icon="check" style={styles.btn} />
            <Button onPress={() => statusPost('reject', acctId, account.id)} title={i18n.t('拒否')} icon="circle-slash" style={styles.btn} /></View> : null
    }
        </View >
    )
}
const styles = StyleSheet.create({
    btn: {
        marginHorizontal: 10
    }
})