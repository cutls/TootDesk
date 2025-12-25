import type { Account } from '@/entities/account'
import { defaultSetting } from '@/entities/settings'
import type { TimelineKind } from '@/entities/timeline'
import { allClose, listenUser, start } from '@/utils/socket'
import { getTimelineAccount, listAccts } from '@/utils/storage'
import { useTimelineStore } from '@/utils/store/timelines'
import { capitalizeFirst } from '@/utils/string'
import type { IState, ReceiveNotificationPayload } from '@/utils/type'
import type { FlashListRef } from '@shopify/flash-list'
import { GlassView } from 'expo-glass-effect'
import { useFocusEffect, useRouter } from 'expo-router'
import { SymbolView, type SFSymbol } from 'expo-symbols'
import type React from 'react'
import { useCallback, useEffect, useState, type RefObject } from 'react'
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
	const [allAcctData, setAllAcctData] = useState<Account[]>([])
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const { timelines } = useTimelineStore()
	const [badge, setBadge] = useState<Record<string, boolean>>({})
	const currentTimeline = timelines[context.current]
	const router = useRouter()
	useFocusEffect(
		useCallback(() => {
			const fn = async () => {
				const accounts = await listAccts()
				setAllAcctData(accounts)
				const tlAcct = await getTimelineAccount()
				await start(tlAcct, true)
				listenUser<ReceiveNotificationPayload>(
					'receive-notification',
					async (ev) => {
						const acctId = ev.payload.acctId
						setBadge((prev) => ({ ...prev, [acctId]: true }))
					},
					defaultSetting.timeline,
					false
				)
			}
			fn()
			return () => {
				allClose()
			}
		}, [])
	)
	useEffect(() => {
		if (currentTimeline && currentTimeline.kind !== 'notifications') return
		setBadge((prev) => ({ ...prev, [currentTimeline?.acctId || '']: false }))
	}, [currentTimeline])
	const colorToSystem = (color: string | null | undefined) => (color ? PlatformColor(`system${capitalizeFirst(color)}`) : null)
	const getColor = (acctId: string) => colorToSystem(allAcctData.find((a) => a.id === acctId)?.color) || 'transparent'
	return (
		<GlassView style={styles.containerStyle}>
			<View style={{ width: width - 100, height: '100%', paddingLeft: 8 }}>
				<View style={styles.infoBar}>
					<View style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
						<TouchableOpacity style={styles.glass20} onPress={() => router.push('/config')}>
							<SymbolView name="gearshape" type="monochrome" tintColor={textColor} size={20} />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => console.log('go')} style={{ width: width - 175, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ textAlign: 'center' }}>{currentTimeline?.name || '?'}</Text>
							<View style={{ position: 'absolute', top: 5, right: 10, width: 5, height: 5, borderRadius: 5, backgroundColor: badge[currentTimeline?.acctId || ''] ? 'red' : 'transparent' }} />
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
								{tl.kind === 'notifications' && <View style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: badge[tl?.acctId || ''] ? 'red' : 'transparent' }} />}
								<View style={{ position: 'absolute', top: 40, left: 15, width: 25, height: 5, borderRadius: 2, padding: 1, backgroundColor: getColor(tl.acctId) }} />
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
