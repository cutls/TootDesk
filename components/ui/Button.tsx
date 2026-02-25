import { Host, Button as SwiftButton, type HostProps, type ButtonProps as SwiftUIButtonProps } from '@expo/ui/swift-ui'
import { ignoreSafeArea } from '@expo/ui/swift-ui/modifiers'
import { GlassView } from 'expo-glass-effect'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import type React from 'react'
import { ActivityIndicator, Pressable, Text, type OpaqueColorValue, type ViewStyle } from 'react-native'

interface SwiftUIProps extends SwiftUIButtonProps {
	style?: HostProps['style']
}
export function ButtonSwiftUI({ style, ...props }: SwiftUIProps) {
	const baseMods = [ignoreSafeArea({ regions: 'all', edges: 'all' })]
	const mods = props.modifiers ? [...props.modifiers, ...baseMods] : baseMods
	return (
		<Host modifiers={mods} style={style}>
			<SwiftButton modifiers={mods} {...props} />
		</Host>
	)
}
interface ButtonProps {
	color?: string | OpaqueColorValue
	isPrimary?: boolean
	width: number
	isLoading?: boolean
	style?: ViewStyle
	onPress?: () => void
	children?: React.ReactNode
	systemImage?: SymbolViewProps['name']
	isDark: boolean
	disabled?: boolean
}
export function Button({ systemImage, isLoading, isPrimary, onPress, color, style, isDark, width, children, disabled }: ButtonProps) {
	return (
		<Pressable onPress={onPress} disabled={disabled}>
			<GlassView
				style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center', borderRadius: 20, ...style }}
				tintColor={isPrimary ? color?.toString() : undefined}
				isInteractive={!disabled}
			>
				{systemImage && !isLoading && (
					<SymbolView name={systemImage} type="monochrome" tintColor={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} size={20} style={{ marginRight: 5 }} />
				)}
				{isLoading && <ActivityIndicator size="small" color={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} style={{ width: width }} />}
				{!isLoading && <Text numberOfLines={1} style={[{ textAlign: 'center', fontSize: 18, color: isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black' }]}>{children}</Text>}
			</GlassView>
		</Pressable>
	)
}
interface IconButtonProps {
	color?: string | OpaqueColorValue
	isPrimary?: boolean
	width: number
	isLoading?: boolean
	style?: ViewStyle
	onPress?: () => void
	systemImage?: SymbolViewProps['name']
	isDark: boolean
}
export function IconButton({ systemImage, isLoading, isPrimary, onPress, color, style, isDark, width }: IconButtonProps) {
	return (
		<Pressable onPress={onPress}>
			<GlassView
				style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center', borderRadius: 20, ...style }}
				tintColor={isPrimary ? color?.toString() : undefined}
				isInteractive={true}
			>
				{systemImage && !isLoading && <SymbolView name={systemImage} type="monochrome" tintColor={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} size={width / 2.2} />}
				{isLoading && <ActivityIndicator size="small" color={isPrimary ? 'white' : color ? color : isDark ? 'white' : 'black'} style={{ width: width }} />}
			</GlassView>
		</Pressable>
	)
}
interface CustomIconButtonProps {
	color?: string | OpaqueColorValue
	isPrimary?: boolean
	style?: ViewStyle
	onPress?: () => void
	children: React.ReactNode
}
export function CustomButton({ children, onPress, style, isPrimary, color }: CustomIconButtonProps) {
	return (
		<Pressable onPress={onPress}>
			<GlassView
				style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center', borderRadius: 20, ...style }}
				tintColor={isPrimary ? color?.toString() : undefined}
				isInteractive={true}
			>
				{children}
			</GlassView>
		</Pressable>
	)
}
