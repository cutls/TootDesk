import React, { useState, useRef, useEffect, useContext } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Animated, FlatList, Linking, useWindowDimensions, useColorScheme, Switch } from 'react-native'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import * as WebBrowser from 'expo-web-browser'
import { ParamList } from '../interfaces/ParamList'
import { Ionicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import { SetConfigContext } from '../utils/context/config'
import { configInit, IConfig } from '../interfaces/Config'
import deepClone from '../utils/deepClone'
export default function App({ navigation, route }: StackScreenProps<ParamList, 'Config'>) {
    const [config, setConfig] = useState(configInit)
    const [tlPerScreen, setTlPerScreen] = useState(config.tlPerScreen.toString())
    const [imageHeight, setImageHeight] = useState(config.imageHeight.toString())
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const init = async () => {
        try {
            const newConfig: IConfig = await storage.getItem('config')
            if (newConfig) setConfig(newConfig)
        } catch (e) { }
    }
    useEffect(() => { init() }, [])
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
            headerTitleStyle: { color: isDark ? 'white' : 'black' },
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Root')} style={{ marginLeft: 10 }}>
                    <Ionicons name="arrow-back" size={30} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, isDark])

    const { height, width } = useWindowDimensions()
    const deviceWidth = width
    const deviceHeight = StatusBar.currentHeight ? height : height - 20
    const styles = createStyle(deviceWidth, deviceHeight)

    const save = async (newConfig: IConfig) => {
        try {
            await storage.setItem('config', newConfig)
        } catch (e) { }
    }
    const saveTlPerScreen = (t: string) => {
        if(!t) return setTlPerScreen('')
        const inted = parseInt(t, 10)
        if (!inted || inted < 1 || inted > 6) return 
        setTlPerScreen(inted.toString())
        config.tlPerScreen = inted
        setConfig(config)
        save(config)
    }
    const saveImageHeight = (t: string) => {
        if(!t) return setImageHeight('')
        const inted = parseInt(t, 10)
        if (!inted) return
        setImageHeight(inted.toString())
        config.imageHeight = inted
        setConfig(config)
        save(config)
    }

    return (
        <View style={{ width: deviceWidth, backgroundColor: isDark ? 'black' : 'white' }}>
            <View style={styles.container}>
				{!!route.params?.code && <Text>ログインコールバックを受信しました</Text>}
                <Text style={styles.header}>タイムラインの設定</Text>
                <Text style={styles.title}>スクリーンあたりのカラム数</Text>
                <Text>1(スマホ向け)〜6</Text>
                <TextInput style={styles.form} value={tlPerScreen.toString()} onChangeText={(t) => saveTlPerScreen(t)} keyboardType="number-pad" />
                <Text style={styles.title}>絶対時間を表示する</Text>
                <Switch
                    onValueChange={(tf) => {
                        const newConfig = deepClone<IConfig>(config)
                        newConfig.useAbsoluteTime = tf
                        setConfig(newConfig)
                        save(newConfig)
                    }}
                    style={[styles.switch]}
                    value={config.useAbsoluteTime}
                />
                <Text style={styles.title}>相対時間を表示する</Text>
                <Switch
                    onValueChange={(tf) => {
                        const newConfig = deepClone<IConfig>(config)
                        newConfig.useRelativeTime = tf
                        setConfig(newConfig)
                        save(newConfig)
                    }}
                    style={[styles.switch]}
                    value={config.useRelativeTime}
                />
                <Text style={styles.title}>画像の高さ設定</Text>
                <TextInput style={styles.form} value={imageHeight.toString()} onChangeText={(t) => saveImageHeight(t)} keyboardType="number-pad" />
                <Button title="完了" onPress={() => navigation.replace('Root', { refresh: true })} style={{ marginVertical: 10 }} />
            </View>
        </View>
    )
}
let android = false
if (Platform.OS === 'android') android = true
function createStyle(deviceWidth: number, deviceHeight: number) {
    const useWidth = deviceWidth > 500 ? 500 : deviceWidth
    return StyleSheet.create({
        container: {
            flex: 0,
            height: deviceHeight,
            padding: 10,
            width: useWidth,
            marginLeft: deviceWidth > 500 ? (deviceWidth - useWidth) / 2 : 0
        },
        horizonal: {
            flexDirection: 'row',
        },
        form: {
            marginVertical: 2,
            borderWidth: 1,
            width: '70%',
            padding: 10,
            borderRadius: 10,
        },
        menu: {
            borderBottomColor: '#eee',
            borderBottomWidth: 1,
            paddingVertical: 10,
            height: 50
        },
        header: {
            fontSize: 18,
            marginVertical: 5
        },
        title: {
            fontSize: 16,
            marginVertical: 5
        },
        switch: {
            marginLeft: useWidth - 220
        }
    })
}