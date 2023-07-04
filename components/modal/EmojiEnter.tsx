import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { Text, View, TouchableOpacity, TextInput, Button } from '../Themed'
import { StyleSheet, FlatList, Platform, useColorScheme, Modal, useWindowDimensions, InputAccessoryView } from 'react-native'
import { Image } from 'expo-image'
import * as Alert from '../../utils/alert'
import { Octicons } from '@expo/vector-icons'
import * as api from '../../utils/api'
import { commonStyle } from '../../utils/styles'
import * as storage from '../../utils/storage'
import * as S from '../../interfaces/Storage'
import * as M from '../../interfaces/MastodonApiReturns'
import i18n from '../../utils/i18n'
import { suggest } from '../../utils/tootAction'
import { useEffect, useState } from 'react'
import PagerView from 'react-native-pager-view'
let ios = true
if (Platform.OS === 'android') ios = false
const isEmoji = (item: any): item is M.CustomEmoji => item.shortcode

export default function SelectCustomEmoji({ setSelectCustomEmoji, callback, acct }: any) {
    const { width: deviceWidth, height: deviceHeight } = useWindowDimensions()
    const styles = createStyle(deviceWidth)
    const g = 8
    const [tooManyEmoji, setTooManyEmoji] = useState(false)
    const [photos, setPhotos] = useState<M.CustomEmoji[][]>([])
    const [suggested, setSuggested] = useState<M.CustomEmoji[] | M.Account[] | M.Search['hashtags']>([])
    const [modalVisible, setModalVisible] = useState(true)
    const [text, setText] = useState('')
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
    const load = async () => {
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acct)) as S.Account
            const dataRaw = await api.getV1CutsomEmojis(domain, at)
            let tank = []
            const data = []
            for (let i = 0; i < dataRaw.length; i++) {
                if (i % 100 === 0) {
                    if (tank.length > 0) data.push(tank)
                    tank = []
                }
                tank.push(dataRaw[i])
            }
            setPhotos(data)
        } catch (e: any) {
            Alert.alert('Error', e.toString())
            console.error(e)
        }
    }
    useEffect(() => { load() }, [])
    const dismiss = () => {
        setModalVisible(false)
        setTimeout(() => setSelectCustomEmoji(false), 200)
    }
    const completeSuggest = (shortcode: string) => {
        setText(`:${shortcode}:`)
        setSuggested([])
        callback(shortcode)
        dismiss()
    }
    const renderSuggest = (item: M.CustomEmoji | M.Account | M.Tag) => {
        if (isEmoji(item)) return <TouchableOpacity style={[commonStyle.horizonal, styles.sIT]} onPress={() => completeSuggest(item.shortcode)}><Image source={{ uri: item.url }} style={styles.sImg} /><Text style={styles.sTxt}>:{item.shortcode}:</Text></TouchableOpacity>
        return null
    }
    useEffect(() => {
        const main = async () => {
            const sendText = text.match(/^:/) ? text : `:${text}`
            const data = await suggest(sendText.length, sendText, acct || '')
            setSuggested(data[0])
        }
        main()
    }, [text])
    const complete = async (u: string) => {
        try {
            dismiss()
            callback(u)
        } catch (e) {
            console.error(e)
        }
    }
    const renderImage = (item: M.CustomEmoji, i: number) => {
        return (
            <TouchableOpacity
                key={item.shortcode}
                onPress={() => {
                    setText(item.shortcode)
                }}>
                <Image
                    style={{ width: deviceWidth / g, height: deviceWidth / g }}
                    placeholder="L1Ps-W-;fQ-;_3fQfQfQfQfQfQfQ"
                    source={{
                        uri: item.static_url,
                    }}
                />
            </TouchableOpacity>
        )
    }
    return (
        <Modal visible={modalVisible} presentationStyle={"formSheet"} animationType="slide">
            <View style={[styles.top, commonStyle.horizonal]}>
                <TouchableOpacity onPress={() => dismiss()}>
                    <Octicons name="x" size={25} color={theFontGrayPlus} />
                </TouchableOpacity>
            </View>
            <View style={[commonStyle.horizonal, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <TextInput onChangeText={(r) => setText(r)} value={text} style={styles.input} />
                <Button title={i18n.t('完了')} onPress={() => { callback(text); dismiss(); }} style={{ width: 80 }} />
            </View>
            {suggested.length > 0 && <FlatList data={suggested as any} horizontal={true} renderItem={({ item }: any) => renderSuggest(item)} keyExtractor={(s) => s.id || s.shortcode} style={styles.sWrap} keyboardShouldPersistTaps="handled" />}
            <PagerView style={{height: deviceHeight - 200}}>
                {photos.map((emojis) => <FlatList
                    key={emojis[0].shortcode}
                    data={emojis}
                    removeClippedSubviews={true}
                    windowSize={5}
                    numColumns={g}
                    renderItem={({ item, index: i }) => renderImage(item, i)}
                    keyExtractor={(item, i) => `${item.shortcode}`}
                />)}
            </PagerView>
        </Modal>
    )
}


function createStyle(deviceWidth: number) {
    return StyleSheet.create({
        top: {
            padding: 15,
            justifyContent: 'flex-end',
            elevation: 5,
        },

        sWrap: {
            height: 50,
            width: deviceWidth - 40,
            marginTop: 0,
            padding: 5
        },
        sIT: {
            height: 40,
            marginHorizontal: 5
        },
        sImg: {
            width: 20,
            height: 20
        },
        sTxt: {
            marginLeft: 5
        },
        input: {
            width: deviceWidth - 100,
            height: 50,
            borderRadius: 10
        }
    })
}