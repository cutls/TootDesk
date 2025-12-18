import Avatar from '@/components/Avatar'
import { Text } from '@/components/themed/Text'
import { Button } from '@/components/ui/Button'
import type { Account } from '@/entities/account'
import type { Color } from '@/entities/timeline'
import { listAccts, removeAcct, removeTimelinesByAcctId, updateAcct } from '@/utils/storage'
import { colors, getTextColor } from '@/utils/type'
import { GlassView } from 'expo-glass-effect'
import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
export default function Index() {
	const { t } = useTranslation()

	const router = useRouter()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [acct, setAcct] = useState<Account[]>([])
	const load = async () => {
		const accts = await listAccts()
		setAcct(accts)
	}
	useEffect(() => {
		load()
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
	const updateColor = async (acctId: string, color: Color | null) => {
		await updateAcct(acctId, { color })
		load()
	}
	const removeAcctId = async (acctId: string) => {
		await removeAcct(acctId)
		await removeTimelinesByAcctId(acctId)
		load()
	}
	return (
		<View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
			<FlatList
				data={acct}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				renderItem={({ item: a }) => (
					<GlassView style={[styles.container, { backgroundColor: PlatformColor(colorToSystemColor(a.color || 'gray4')) }]}>
						<View style={styles.horizontal}>
							<View>
								<Avatar src={a.avatar || a.favicon} fallback={a.sns} color={a.color} size={40} />
							</View>
							<View style={styles.infoContainer}>
								<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
									{a.username}
								</Text>
								<Text style={[styles.domain, { color: textColor }]} numberOfLines={1}>
									{a.domain}
								</Text>
							</View>
						</View>
						<View style={styles.actions}>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, flexShrink: 1 }}>
								{colors.map((color) => (
									<TouchableOpacity key={color} style={createColorBtn(colorToSystemColor(color))} onPress={() => updateColor(a.id, color)}>
										{color === a.color && <SymbolView name="checkmark" type="monochrome" tintColor={getTextColor(color)} size={15} />}
									</TouchableOpacity>
								))}
								{a.color && (
									<TouchableOpacity style={createColorBtn(`systemGray4`)} onPress={() => updateColor(a.id, null)}>
										<SymbolView name="xmark" type="monochrome" tintColor={textColor} size={15} />
									</TouchableOpacity>
								)}
							</View>
							<Button variant="borderedProminent" color={PlatformColor('systemRed')} onPress={() => removeAcctId(a.id)} style={{ width: 50, height: 50 }} systemImage="trash"></Button>
						</View>
					</GlassView>
				)}
			/>
			<Button variant="glassProminent" systemImage="plus" onPress={() => router.push('/login')} style={{ marginVertical: 20, width: 200, height: 50 }}>
				{t('add')}
			</Button>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		container: {
			marginVertical: 10,
			width: width - 40,
			borderRadius: 20,
			padding: 15
		},
		horizontal: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		actions: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		infoContainer: {
			marginLeft: 10,
			maxWidth: width - 100
		},
		username: {
			fontSize: 16,
			fontWeight: '600'
		},
		domain: {
			fontSize: 14,
			marginTop: 2
		}
	})
