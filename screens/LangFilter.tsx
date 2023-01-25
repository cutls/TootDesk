import React, { useState, useEffect } from 'react'
import { StyleSheet, StatusBar, Platform, FlatList, useWindowDimensions, useColorScheme, Switch } from 'react-native'
import { Text, View, Button, TouchableOpacity } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import { Ionicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import * as Alert from '../utils/alert'
import deepClone from '../utils/deepClone'
import TimelineProps from '../interfaces/TimelineProps'
import { langsArray, localeObject } from '../interfaces/Languages'
import { commonStyle } from '../utils/styles'
export default function LangFilter({ navigation, route }: StackScreenProps<ParamList, 'LangFilter'>) {
    const tlId = route.params.tlId
    const [langs, setLangs] = useState<string[]>([])
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const init = async () => {
        try {
            const tls: TimelineProps[] = await storage.getItem('timelines')
            const tl = tls[tlId]
            if (!tl) Alert.alert('Error')
            setLangs(tl.config?.languageHide || [])
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
    const save = async () => {
        try {
            const tls: TimelineProps[] = await storage.getItem('timelines')
            const tl = deepClone<any>(tls[tlId])
            if (!tl.config) tl.config = { languageHide: [] }
            tl.config.languageHide = langs
            const newTl = tls.map((t, i) => i === tlId ? tl : t)
            await storage.setItem('timelines', newTl)
            navigation.replace('Root', { refresh: true })
            //init()
        } catch {

        }
    }


    return (
        <View style={{ width: deviceWidth, backgroundColor: isDark ? 'black' : 'white' }}>
            <View style={styles.container}>
                <View style={[commonStyle.horizonal, { justifyContent: 'space-between', marginVertical: 5, alignItems: 'center', padding: 10 }]}>
                    <Text style={styles.header}>タイムラインで表示しない言語</Text>
                    <Button title="完了" onPress={() => save()} style={{ marginVertical: 10 }} />
                </View>
                <View style={{ height: deviceHeight - 130 }}>
                    <FlatList data={langsArray} keyExtractor={(item) => item.toString()} renderItem={({ item }: { item: string }) =>
                        <View style={[commonStyle.horizonal, { justifyContent: 'space-between', marginVertical: 5, alignItems: 'center', paddingHorizontal: 10 }]}>
                            <Text>{localeObject[item][0]}({localeObject[item][1] || item})</Text>
                            <Switch
                                onValueChange={(tf) => {
                                    if (!tf) {
                                        const newLangs = langs.filter((l) => l !== item)
                                        setLangs(newLangs)
                                    } else {
                                        langs.push(item)
                                        setLangs(deepClone<string[]>(langs))
                                    }
                                }}
                                style={[styles.switch]}
                                value={langs.includes(item)}
                            />
                        </View>
                    } />
                </View>
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
            width: useWidth,
            marginLeft: deviceWidth > 500 ? (deviceWidth - useWidth) / 2 : 0
        },
        header: {
            fontSize: 18,
            marginVertical: 5
        },
        switch: {
            marginLeft: 0
        }
    })
}