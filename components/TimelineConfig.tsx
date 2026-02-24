import type { Account } from '@/entities/account'
import { colorList, type Color, type Timeline } from '@/entities/timeline'
import { getTimelines, saveTimelines } from '@/utils/storage'
import { useTimelineStore } from '@/utils/store/timelines'
import { icon, makeTimelineNameWithAcctId } from '@/utils/timelineName'
import type { IState } from '@/utils/type'
import type { MegalodonInterface } from '@cutls/megalodon'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import { ignoreSafeArea } from '@expo/ui/swift-ui/modifiers'
import { GlassView } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from './themed/Text'
import { TextInputMulti } from './themed/TextInputMulti'
import { Button } from './ui/Button'

interface Props {
	isOpened: boolean
	setIsOpened: IState<boolean>
	timeline: Timeline
}
export default function TimelineConfig({ isOpened, setIsOpened, timeline }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const [useAcct, setUseAcct] = useState<Account | null>(null)
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const { setTimelines } = useTimelineStore()
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [defaultName, setDefaultName] = useState(timeline.name)
	useEffect(() => {
		const fn = async () => {
			const name = await makeTimelineNameWithAcctId(timeline.kind, t(`timeline.kind.${timeline.kind}`), timeline.acctId)
			setDefaultName(name)
		}
		fn()
	}, [])
	const colorToSystemColor = (color: string) => `system${color.charAt(0).toUpperCase() + color.slice(1)}`
	const createColorBtn = (color: string) =>
		({
			width: 30,
			height: 40,
			borderRadius: 8,
			backgroundColor: PlatformColor(color),
			alignItems: 'center',
			justifyContent: 'center'
		}) as const
	const updateColor = async (tlId: string, color: Color | null) => {
		const tls = await getTimelines()
		const updatedTls = tls.map((t) => (t.id === tlId ? { ...t, color: color || undefined } : t))
		await saveTimelines(updatedTls)
		setTimelines(updatedTls)
	}
	return (
		<Host style={{ width, position: isOpened ? 'absolute' : undefined, zIndex: 1000 }}>
			<BottomSheet modifiers={[ignoreSafeArea({ regions: 'keyboard' })]} isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
				<View style={{ padding: 20 }}>
					<Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{t('navigation.config.color')}</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, flexShrink: 1, alignItems: 'center' }}>
						{/* { backgroundColor: PlatformColor(colorToSystemColor(timeline.color || 'teal')) } */}
						<GlassView style={[styles.glass30]} tintColor={timeline.color || 'teal'}>
							<SymbolView name={icon(timeline.kind)} type="monochrome" tintColor="white" size={25} />
						</GlassView>
						{colorList.map((color) => (
							<Button
								key={color}
								style={createColorBtn(colorToSystemColor(color))}
								onPress={() => updateColor(timeline.id, color)}
								systemImage={color === timeline.color ? 'checkmark' : undefined}
								color="white"
								modifiers={[ignoreSafeArea({ regions: 'all' })]}
							>
								{color === timeline.color ? null : <View />}
							</Button>
						))}
						{timeline.color && (
							<Button modifiers={[ignoreSafeArea({ regions: 'all' })]} style={createColorBtn(`systemGray4`)} onPress={() => updateColor(timeline.id, null)} systemImage="xmark" color="white" />
						)}
					</View>
					<View style={{ height: 10 }} />
					<Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{t('navigation.config.name')}</Text>
					<TextInputMulti
						defaultValue={timeline.name}
						onBlur={async (input) => {
							const tls = await getTimelines()
							const name = input || defaultName
							const updatedTls = tls.map((tl) => (tl.id === timeline.id ? { ...tl, name: name } : tl))
							await saveTimelines(updatedTls)
							setTimelines(updatedTls)
						}}
						placeholder={defaultName}
						isDark={isDark}
					/>
					<View style={{ height: 10 }} />
				</View>
			</BottomSheet>
		</Host>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		glass30: {
			width: 55,
			height: 52,
			borderRadius: 5,
			alignItems: 'center',
			justifyContent: 'center',
			marginHorizontal: 3
		}
	})
