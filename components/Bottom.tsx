import React from 'react'
import { StyleSheet,TouchableOpacity, Dimensions } from 'react-native'
import { Text, View, Button } from './Themed'
import { Ionicons } from '@expo/vector-icons'
import { ParamList } from '../interfaces/ParamList'
import { StackScreenProps } from '@react-navigation/stack'
const deviceWidth = Dimensions.get('window').width

export default (params: {goToAccountManager: () => void, tooting: (a: boolean) => void}) => {
    return (
        <View style={styles.bottom}>
            <TouchableOpacity style={styles.config} onPress={() => params.goToAccountManager()}>
                <Ionicons name="notifications" size={30} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tlChanger} onPress={() => params.goToAccountManager()}>
                <Text style={styles.tlChangerText}>2</Text>
            </TouchableOpacity>
            <View style={styles.centerMenu}>
                <Text>Home</Text>
                <Text>@Cutls@2m.cutls.com</Text>
            </View>
            <TouchableOpacity style={styles.config} onPress={() => params.tooting(true)}>
                <Ionicons name="create" size={30} />
            </TouchableOpacity>
            </View>
    )
}
const styles = StyleSheet.create({
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
        borderColor: 'black',
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