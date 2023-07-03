import * as React from 'react'
import { StyleSheet, Platform, Switch, StyleProp, ViewStyle, useWindowDimensions, useColorScheme } from 'react-native'
import { Text, View, TouchableOpacity } from './Themed'
import { commonStyle } from '../utils/styles'
import * as Haptics from 'expo-haptics'
import { IState } from '../interfaces/ParamList'
type ISetValueFunc = (tf: boolean) => void
interface Param {
    text: string | number
    setHasUnsaved?: (value: React.SetStateAction<boolean>) => void
    setValueState?: IState<boolean>
    setValueFunc?: ISetValueFunc
    value: boolean
    wrapStyle?: StyleProp<ViewStyle>
    noMargin?: boolean
}
const ios = Platform.OS === 'ios'
export default (param: Param) => {
    const { text, setHasUnsaved, setValueState, setValueFunc, value, wrapStyle, noMargin } = param
    const { height, width } = useWindowDimensions()
    const styles = createStyle([width, height])
	const theme = useColorScheme()
	const isDark = theme === 'dark'
    const backgroundColor = isDark ? '#808080' : '#e0e0e0'
    const customStyle = wrapStyle || noMargin ? {} : { marginVertical: 10 }
    const onChange = () => {
        if (setValueState) setValueState(!value)
        if (setValueFunc) setValueFunc(!value)
        if (setHasUnsaved) setHasUnsaved(true)
        if (ios) Haptics.selectionAsync()
    }
    return (
        <View style={[styles.switches, commonStyle.horizonal, customStyle]}>
            <TouchableOpacity onPress={() => onChange()}>
                <Text style={styles.switchText}>{text}</Text>
            </TouchableOpacity>
            <Switch
                trackColor={{ false: backgroundColor, true: '#002b70' }}
                thumbColor={isDark ? 'black' : 'white'}
                ios_backgroundColor={backgroundColor}
                onValueChange={(tf) => {
                    if (setValueState) setValueState(tf)
                    if (setValueFunc) setValueFunc(tf)
                    if (setHasUnsaved) setHasUnsaved(true)
                }}
                style={[styles.switch, { justifyContent: 'center' }]}
                value={value}
            />
        </View>
    )
}
const createStyle = ([deviceWidth, deviceHeight]: number[]) => {
	const tablet = deviceWidth > deviceHeight ? deviceHeight > 500 : deviceWidth > 500
    return StyleSheet.create({
        switch: {
            marginTop: ios ? 10 : 0
        },
        switches: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: tablet ? 500 : deviceWidth - 10,
            padding: 10,
            borderTopColor: '#e6e8eb',
            borderTopWidth: 1,
            borderBottomColor: '#e6e8eb',
            borderBottomWidth: 1,
        },
        switchText: {
            fontSize: 17
        }
    })
}