import { GlassView } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import React from 'react'
import { PlatformColor, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from './themed/Text'
import { Button } from './ui/Button'

interface Props {
	openComposer: () => void
}

export default function Navigator({ openComposer }: Props) {
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	return (
		<GlassView style={styles.containerStyle}>
			<View style={{ width: width - 100, height: '100%', paddingLeft: 8 }}>
				<View style={styles.infoBar}>
					<View style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
						<TouchableOpacity style={styles.glass20}>
							<SymbolView name="arrow.clockwise" type="monochrome" tintColor={textColor} size={20} />
						</TouchableOpacity>
						<View style={{ width: width - 175, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ textAlign: 'center' }}>Home @cutls@6m.cutls.dev</Text>
						</View>
						<TouchableOpacity style={styles.glass20}>
							<SymbolView name="arrow.up.to.line" type="monochrome" tintColor={textColor} size={20} />
						</TouchableOpacity>
					</View>
					<View style={styles.border} />
				</View>
				<ScrollView style={styles.scrollBar} horizontal={true}>
					<GlassView style={styles.glass30} isInteractive={true} tintColor="teal">
						<SymbolView name="house" type="monochrome" tintColor="white" size={25} />
					</GlassView>
					<GlassView style={styles.glass30} isInteractive={true}>
						<SymbolView name="globe" type="monochrome" tintColor={textColor} size={25} />
					</GlassView>
					<GlassView style={styles.glassAdd} isInteractive={true}>
						<SymbolView name="plus" type="monochrome" tintColor={textColor} size={20} />
					</GlassView>
				</ScrollView>
			</View>
			<Button onPress={() => openComposer()} style={{ width: 60, height: 60, margin: 5, marginTop: 20 }} variant="glassProminent" color="teal">
				<SymbolView name="square.and.pencil" type="monochrome" tintColor="white" />
			</Button>
		</GlassView>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		containerStyle: {
			position: 'absolute',
			bottom: 25,
			left: 10,
			height: 110,
			width: width - 20,
			borderRadius: 30,
			padding: 5,
			display: 'flex',
			flexDirection: 'row'
		},
		infoBar: {
			width: '100%',
			height: 40,
			padding: 5
		},
		border: {
			width: '100%',
			height: 1,
			marginTop: 3,
			borderBottomColor: PlatformColor('separator'),
			borderBottomWidth: 1
		},
		scrollBar: {
			paddingHorizontal: 5,
			paddingTop: 5,
			display: 'flex',
			flexDirection: 'row',
			width: '100%'
		},
		glass20: {
			width: 30,
			height: 30,
			borderRadius: 5,
			alignItems: 'center',
			justifyContent: 'center'
		},
		glass30: {
			width: 55,
			height: 52,
			borderRadius: 5,
			alignItems: 'center',
			justifyContent: 'center',
			marginHorizontal: 3
		},
		glassAdd: {
			width: 55,
			height: 52,
			borderRadius: 25,
			alignItems: 'center',
			justifyContent: 'center',
			marginHorizontal: 3
		}
	})
