import React, { useState, useEffect, useLayoutEffect } from 'react'
import { StyleSheet, StatusBar, Platform, useWindowDimensions, useColorScheme, Switch } from 'react-native'
import Slider from '@react-native-community/slider'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import { Octicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import { configInit, IConfig } from '../interfaces/Config'
import deepClone from '../utils/deepClone'
import { commonStyle } from '../utils/styles'
import { ScrollView } from 'react-native-gesture-handler'
import { useKeyboard } from '../utils/keyboard'
import i18n from '../utils/i18n'
import SwitchComponent from '../components/SwitchComponent'
type IConfigType = keyof IConfig
export default function App({ navigation, route }: StackScreenProps<ParamList, 'Config'>) {
    const [config, setConfig] = useState(configInit)
    const [tlPerScreen, setTlPerScreen] = useState(config.tlPerScreen.toString())
    const [imageHeight, setImageHeight] = useState(config.imageHeight.toString())
    const [actionBtnSize, setActionBtnSize] = useState(config.actionBtnSize)
    const [letters, setLetters] = useState(config.autoFoldLetters.toString())
    const [lines, setLines] = useState(config.autoFoldLines.toString())
    const theme = useColorScheme()
    const [keyboardHeight] = useKeyboard()
    const isDark = theme === 'dark'
    const init = async () => {
        try {
            const newConfig = await storage.getItem('config')
            if (!newConfig) return
            for (const keyConfigRaw of Object.keys(configInit)) {
                const keyConfig = keyConfigRaw as IConfigType
                let c = newConfig[keyConfig]
                if (c !== undefined) c = newConfig[keyConfig]
                if (c === undefined) c = configInit[keyConfig]
                newConfig[keyConfig] = c
            }
            setTlPerScreen(newConfig.tlPerScreen)
            setImageHeight(newConfig.imageHeight)
            setActionBtnSize(newConfig.actionBtnSize)
            setLetters(newConfig.autoFoldLetters)
            setLines(newConfig.autoFoldLines)
            if (newConfig) setConfig(newConfig)
        } catch (e) { }
    }
    useEffect(() => { init() }, [])
    useLayoutEffect(() => {
        navigation.setOptions({
            headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
            headerTitleStyle: { color: isDark ? 'white' : 'black' },
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Root')} style={{ marginLeft: 10 }}>
                    <Octicons name="arrow-left" size={30} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, isDark])

    const { height, width } = useWindowDimensions()
    const deviceWidth = width
    const deviceHeight = StatusBar.currentHeight ? height : height - 20
    const styles = createStyle(deviceWidth, deviceHeight)
    interface ISwitchComponent {
        text: string
        configKey: IConfigType
    }
    const SwitchComponentWrap = ({ configKey, text }: ISwitchComponent) => {
        return <View style={styles.switchWrap}><SwitchComponent
            setValueFunc={(tf) => {
                const newConfig = deepClone<any>(config)
                newConfig[configKey] = tf
                setConfig(newConfig)
                save(newConfig)
            }}
            text={text}
            noMargin={true}
            value={!!config[configKey]}
        /></View>
    }

    const save = async (newConfig: IConfig) => {
        try {
            await storage.setItem('config', newConfig)
        } catch (e) { }
    }
    const saveTlPerScreen = (t: string) => {
        if (!t) return setTlPerScreen('')
        const inted = parseInt(t, 10)
        if (!inted || inted < 1 || inted > 6) return
        setTlPerScreen(inted.toString())
        config.tlPerScreen = inted
        setConfig(config)
        save(config)
    }
    const saveImageHeight = (t: string) => {
        if (!t) return setImageHeight('')
        const inted = parseInt(t, 10)
        if (!inted) return
        setImageHeight(inted.toString())
        config.imageHeight = inted
        setConfig(config)
        save(config)
    }
    const saveAutoFold = (t: string, target: 'letters' | 'lines') => {
        if (!t) return target === 'letters' ? setLetters('') : setLines('')
        const inted = parseInt(t, 10)
        if (!inted) return
        target === 'letters' ? setLetters(inted.toString()) : setLines(inted.toString())
        target === 'letters' ? config.autoFoldLetters = inted : config.autoFoldLines = inted
        setConfig(config)
        save(config)
    }

    return (
        <View style={{ width: deviceWidth, backgroundColor: isDark ? 'black' : 'white' }}>
            <View style={[commonStyle.horizonal, { justifyContent: 'space-between', marginVertical: 5, alignItems: 'center', padding: 10 }]}>
                <Text style={styles.header}>{i18n.t('設定')}</Text>
                <Button title={i18n.t('完了')} onPress={() => navigation.replace('Root', { refresh: true })} style={{ marginVertical: 10 }} />
            </View>
            <ScrollView style={styles.container}>
                <Text style={styles.header}>{i18n.t('タイムラインの設定')}</Text>
                <Text style={styles.title}>{i18n.t('スクリーンあたりのカラム数')}</Text>
                <Text>1({i18n.t('スマホ向け')})〜6({i18n.t('タブレット向け')})</Text>
                <TextInput style={styles.form} value={tlPerScreen.toString()} onChangeText={(t) => saveTlPerScreen(t)} keyboardType="number-pad" />
                <SwitchComponentWrap configKey="useAbsoluteTime" text={i18n.t('絶対時間を表示する')} />
                <SwitchComponentWrap configKey="useRelativeTime" text={i18n.t('相対時間を表示する')} />
                <SwitchComponentWrap configKey="showVia" text={i18n.t('viaを表示する')} />
                <SwitchComponentWrap configKey="showLang" text={i18n.t('言語を表示する')} />
                <SwitchComponentWrap configKey="showGif" text={i18n.t('アイコンのアニメーション表示')} />
                <Text style={styles.title}>{i18n.t('画像の高さ設定')}</Text>
                <TextInput style={styles.form} value={imageHeight.toString()} onChangeText={(t) => saveImageHeight(t)} keyboardType="number-pad" />
                <SwitchComponentWrap configKey="showReactedCount" text={i18n.t('リアクション数を表示')} />
                <Text style={styles.title}>{i18n.t('長文自動折り畳み')}</Text>
                <View style={styles.horizonal}>
                    <TextInput style={[styles.form, { width: 100 }]} value={letters.toString()} onChangeText={(t) => saveAutoFold(t, 'letters')} keyboardType="number-pad" />
                    <Text style={styles.alongInput}>{i18n.t('バイト')}</Text>
                    <TextInput style={[styles.form, { width: 100 }]} value={lines.toString()} onChangeText={(t) => saveAutoFold(t, 'lines')} keyboardType="number-pad" />
                    <Text style={styles.alongInput}>{i18n.t('行(改行数)')}</Text>
                </View>
                <Text style={styles.title}>{i18n.t('アクションボタンの大きさ')}</Text>
                <View style={[commonStyle.horizonal, { alignItems: 'center' }]}>
                    <Text style={{ width: 20, height: 39, paddingTop: 12 }}>{actionBtnSize}</Text>
                    <Octicons
                        name="sync"
                        size={actionBtnSize}
                        color={"#9a9da1"}
                    />
                </View>
                <Slider
                    style={{ width: 200, height: 40 }}
                    minimumValue={12}
                    maximumValue={39}
                    step={3}
                    minimumTrackTintColor={isDark ? '#fff' : '#000'}
                    maximumTrackTintColor={isDark ? '#000' : '#fff'}
                    value={actionBtnSize}
                    onValueChange={(s) => {
                        const newConfig = deepClone<IConfig>(config)
                        newConfig.actionBtnSize = s
                        setActionBtnSize(s)
                        setConfig(newConfig)
                        save(newConfig)
                    }}
                />
                <View style={{ height: keyboardHeight + 20 }} />
            </ScrollView>
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
            height: deviceHeight - 150,
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
        switchWrap: {
            width: useWidth - 20,
            display: 'flex',
            alignItems: 'flex-end'
        },
        switch: {

        },
        alongInput: {
            marginHorizontal: 10,
            marginTop: 12
        }
    })
}