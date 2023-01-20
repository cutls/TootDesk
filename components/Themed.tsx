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
	ActivityIndicator,
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
	ref?: any
}
export type TextProps = ThemeProps & DefaultText['props']
export type ViewProps = ThemeProps & DefaultView['props']
export type TextInputProps = ThemeProps & DefaultTextInput['props']
export type TouchableOpacityProps = ThemeProps & DefaultTouchableOpacity['props']

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
	style?: StyleProp<ViewStyle>
	activeOpacity?: number
	icon?: React.ComponentProps<typeof MaterialIcons>['name']
	acm?: boolean
	textColor?: string
	loading?: boolean
	onLongPress?: DefaultTouchableOpacity['props']['onLongPress']
	borderLess? :boolean
}
export function Button(props: ButtonExtendProps) {
	const { title, style, loading, disabled, acm, color, borderLess, ...otherProps } = props
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const backGray = loading || disabled
	const useColor = backGray ? isDark ? `#888` : `#aaa` : color ? color : `#0049bf`
	const textColor = props.textColor
	const hasText = title || title !== ''

	const icon = props.icon
	const base: ViewStyle = {
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
		paddingRight: 14,
		maxWidth: 550
	}
	if (!hasText) base.borderWidth = 1.4
	const useTextColor = textColor ? textColor : backGray ? isDark ? `black` : 'white' : 'white'
	if (borderLess) base.borderWidth = 0
	return (
		<TouchableOpacity style={[{ backgroundColor: useColor }, base, style]} activeOpacity={loading ? 1.0 : 0.7} {...otherProps}>
			{icon && !loading && !acm ? <MaterialIcons name={icon} style={{ color: useTextColor, fontSize: 21, marginRight: hasText ? 8 : 5 }} /> : null}
			{loading ? <ActivityIndicator animating={true} color={useTextColor} size="small" style={{ marginRight: 8, scaleX: 1.5, scaleY: 1.5 }} /> : null}
			<Text style={{ color: useTextColor, fontSize: 16 }}>{title}</Text>
		</TouchableOpacity>
	)
}