import * as React from 'react'
import {
	ColorSchemeName,
	useColorScheme as _useColorScheme,
	Text as DefaultText,
	View as DefaultView,
	TextInput as DefaultTextInput,
	TouchableOpacity as DefaultTouchableOpacity,
	ButtonProps,
	StyleProp,
	ViewStyle,
	NativeSyntheticEvent,
	NativeTouchEvent,
} from 'react-native'

const tintColorLight = '#2f95dc'
const tintColorDark = '#fff'
const Colors = {
	light: {
		text: '#000',
		background: '#fff',
		tint: tintColorLight,
		tabIconDefault: '#ccc',
		tabIconSelected: tintColorLight,
	},
	dark: {
		text: '#fff',
		background: '#000',
		tint: tintColorDark,
		tabIconDefault: '#ccc',
		tabIconSelected: tintColorDark,
	},
}

function useColorScheme(): NonNullable<ColorSchemeName> {
	return _useColorScheme() as NonNullable<ColorSchemeName>
}
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

export function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light & keyof typeof Colors.dark) {
	const theme = useColorScheme()
	const colorFromProps = props[theme]

	if (colorFromProps) {
		return colorFromProps
	} else {
		return Colors[theme][colorName]
	}
}

type ThemeProps = {
	lightColor?: string
	darkColor?: string
}
export type TextProps = ThemeProps & DefaultText['props']
export type ViewProps = ThemeProps & DefaultView['props']
export type TextInputProps = ThemeProps & DefaultTextInput['props']
export interface TouchableOpacityProps extends ViewProps {
	onPress?: ((ev: NativeSyntheticEvent<NativeTouchEvent>) => void)
	activeOpacity?: number
}

export function Text(props: TextProps) {
	const { style, lightColor, darkColor, ...otherProps } = props
	const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')

	return <DefaultText style={[{ color }, style]} {...otherProps} />
}

export function View(props: ViewProps) {
	const { style, lightColor, darkColor, ...otherProps } = props
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')

	return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />
}

export function TextInput(props: TextInputProps) {
	const { style, lightColor, darkColor, ...otherProps } = props
	const color = '#000'
	const backgroundColor = '#eee'
	const borderWidth = 2
	return <DefaultTextInput style={[{ color, backgroundColor, borderWidth }, style]} {...otherProps} />
}

export function TouchableOpacity(props: TouchableOpacityProps) {
	const { style, lightColor, darkColor, activeOpacity, ...otherProps } = props
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')
	return <DefaultTouchableOpacity activeOpacity={activeOpacity ? activeOpacity : 0.5} style={[{ backgroundColor }, style]} {...otherProps} />
}

interface ButtonExtendProps extends ButtonProps {
	style?: ViewStyle
	activeOpacity?: number
	icon?: string
	materialIcon?: string
	textColor?: string
}
export function Button(props: ButtonExtendProps) {
	const { title, color, style, textColor,  ...otherProps } = props
	const icon = props.icon as 'create' | 'add'
	const materialIcon = props.materialIcon as 'menu'
	const base: ViewStyle = {
		borderRadius: 3,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 10,
		paddingRight: 14
	}
	return (
		<TouchableOpacity style={[{ backgroundColor: color ? color : '#3182eb' }, base, style]} {...otherProps}>
			{icon ? <Ionicons name={icon} style={{ color: textColor ? textColor : 'white', fontSize: 22, marginRight: 8 }} /> : null}
			{materialIcon ? <MaterialIcons name={materialIcon} style={{ color: textColor ? textColor : 'white', fontSize: 22, marginRight: 8 }} /> : null}
			<Text style={{ color: textColor ? textColor : 'white', fontSize: 16 }}>{title}</Text>
		</TouchableOpacity>
	)
}
