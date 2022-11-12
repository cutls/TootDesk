import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { Text, View, TouchableOpacity } from '../Themed'
import { StyleSheet, Image, FlatList, Dimensions, Platform, useColorScheme, Modal } from 'react-native'
import { statusBarHeight } from '../../utils/statusBar'
import { MaterialIcons, SimpleLineIcons } from '@expo/vector-icons'
import * as api from '../../utils/api'
import { commonStyle, tablet } from '../../utils/styles'
import * as storage from '../../utils/storage'
import * as S from '../../interfaces/Storage'
import * as M from '../../interfaces/MastodonApiReturns'
const deviceWidth = Dimensions.get('window').width
const deviceHeight = Dimensions.get('window').height
let ios = true
if (Platform.OS === 'android') ios = false
const g = Math.floor(deviceWidth / 50)
export default function SelectCustomEmoji({ setSelectCustomEmoji, callback, acct }: any) {
    const [loaded, setLoaded] = React.useState(false)
    const [photos, setPhotos] = React.useState([] as any[])
    const [modalVisible, setModalVisible] = React.useState(true)
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const theFontGrayPlus = isDark ? '#c7c7c7' : '#4f4f4f'
    const load = async () => {
        setLoaded(true)
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acct)) as S.Account
            const data = await api.getV1CutsomEmojis(domain, at)
            let arPhoto = []
            for (let i = 0; i < data.length; i = i + g) {
                let sPhoto = []
                for (let j = 0; j < g; j++) {
                    if (data[i + j]) sPhoto.push(data[i + j])
                }
                arPhoto.push(sPhoto)
            }
            setPhotos(arPhoto)
        } catch (e) {
            console.error(e)
        }
    }
    if (!loaded) load()
    const dismiss = () => {
        setModalVisible(false)
        setTimeout(() => setSelectCustomEmoji(false), 200)
    }
    const complete = async (u: string) => {
        try {
            dismiss()
            callback(u)
        } catch (e) {
            console.error(e)
        }
    }
    const renderImage = (items: M.CustomEmoji[], i: number) => {
        return (
            <View style={commonStyle.horizonal}>
                {items.map((item, j) => {
                    return (
                        <TouchableOpacity
                            key={`${i}-${j}`}
                            onPress={() => {
                                complete(item.shortcode)
                            }}>
                            <Image
                                style={{ width: deviceWidth / g, height: deviceWidth / g }}
                                source={{
                                    uri: item.url,
                                }}
                            />
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    }
    return (
        <Modal visible={modalVisible} presentationStyle={"formSheet"} animationType="slide">
            <View style={[styles.top, commonStyle.horizonal]}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>カスタム絵文字</Text>
                <TouchableOpacity onPress={() => dismiss()}>
                    <MaterialIcons name="close" size={25} color={theFontGrayPlus} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={photos}
                renderItem={({ item, index: i }) => renderImage(item, i)}
                keyExtractor={(item, i) => `${i}`}
                style={[commonStyle.horizonal]}
            />
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
