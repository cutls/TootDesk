import type { TimelineKind } from '@/entities/timeline'
import { useTimelineStore } from '@/utils/store/timelines'
import type { IState } from '@/utils/type'
import type { FlashListRef } from '@shopify/flash-list'
import { GlassView } from 'expo-glass-effect'
import { useRouter } from 'expo-router'
import { SymbolView, type SFSymbol } from 'expo-symbols'
import type React from 'react'
import type { RefObject } from 'react'
import { PlatformColor, Pressable, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from './themed/Text'
import { Button } from './ui/Button'

interface Props {
	openComposer: () => void
	openAddTimeline: () => void
	context: {
		current: number
		setCurrent: IState<number>
		relayRef: RefObject<FlashListRef<any> | null>
	}
}
const icon = (kind: TimelineKind): SFSymbol => {
	if (kind === 'home') return 'house.fill'
	if (kind === 'notifications') return 'bell.fill'
	if (kind === 'local') return 'person.2.fill'
	if (kind === 'public') return 'globe'
	if (kind === 'list') return 'list.bullet'
	if (kind === 'bookmarks') return 'bookmark.fill'
	if (kind === 'direct') return 'envelope.fill'
	if (kind === 'favourites') return 'star.fill'
	if (kind === 'tag') return 'tag.fill'
	return 'rectangle.stack.person.crop'
}

export default function Navigator({ openComposer, openAddTimeline, context }: Props) {
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const { timelines } = useTimelineStore()
	const currentTimeline = timelines[context.current]
	const router = useRouter()
	return (
		<GlassView style={styles.containerStyle}>
			<View style={{ width: width - 100, height: '100%', paddingLeft: 8 }}>
				<View style={styles.infoBar}>
					<View style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
						<TouchableOpacity style={styles.glass20}>
							<SymbolView name="gearshape" type="monochrome" tintColor={textColor} size={20} />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.push('/acct')} style={{ width: width - 175, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ textAlign: 'center' }}>{currentTimeline?.name || '?'}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.glass20} onPress={() => context.relayRef.current?.scrollToOffset({ offset: 0, animated: true })}>
							<SymbolView name="arrow.up.to.line" type="monochrome" tintColor={textColor} size={20} />
						</TouchableOpacity>
					</View>
					<View style={styles.border} />
				</View>
				<ScrollView style={styles.scrollBar} horizontal={true}>
					{timelines.map((tl, index) => (
						<Pressable key={tl.id} onPress={() => context.setCurrent(index)}>
							<GlassView style={styles.glass30} isInteractive={true} tintColor={context.current === index ? 'teal' : undefined}>
								<SymbolView name={icon(tl.kind)} type="monochrome" tintColor={context.current === index ? 'white' : textColor} size={25} />
							</GlassView>
						</Pressable>
					))}
					<Pressable onPress={() => openAddTimeline()}>
						<GlassView style={styles.glassAdd} isInteractive={true}>
							<SymbolView name="plus" type="monochrome" tintColor={textColor} size={20} />
						</GlassView>
					</Pressable>
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
			zIndex: 2,
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
