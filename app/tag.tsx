import Avatar from '@/components/Avatar'
import { Status } from '@/components/status/Status'
import { Text } from '@/components/themed/Text'
import AcctSelector from '@/components/timeline/AcctSelector'
import { CustomButton, IconButton } from '@/components/ui/Button'
import type { Account } from '@/entities/account'
import type { Timeline } from '@/entities/timeline'
import { getAcctById, getTimelines, saveTimelines } from '@/utils/storage'
import { useConfigStore } from '@/utils/store/config'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import { makeTagTimelineNameWithAcctId } from '@/utils/timelineName'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import { randomUUID } from 'expo-crypto'
import * as Localization from 'expo-localization'
import { useIsPreview, useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, PlatformColor, RefreshControl, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
	const { t } = useTranslation()
	const isPreview = useIsPreview()

	const router = useRouter()
	const navigation = useNavigation()

	const { config } = useConfigStore()

	const params = useLocalSearchParams()
	const { acctId, q } = params as Record<'acctId' | 'q', string>
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [isMoreLoading, setIsMoreLoading] = useState(false)
	const [isOpened, setIsOpened] = useState(false)
	const [acct, setAcct] = useState<Account | null>(null)
	const [statuses, setStatuses] = useState<Entity.Status[]>([])
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'
	useEffect(() => {
		const fn = async () => {
			const acct = await getAcctById(acctId)
			if (!acct) throw new Error('Invalid account id')
			setAcct(acct)
		}
		fn()
	}, [acctId])
	const load = async (more?: boolean) => {
		if (!more) setIsLoading(true)
		if (!more) setIsRefreshing(true)
		if (more) setIsMoreLoading(true)
		if (!acct) return

		try {
			const https = `https://${acct.domain}`
			const client = generator(acct.sns, https, acct.accessToken)
			setClient(client)
			const d = await client.getTagTimeline(q, { max_id: more ? statuses[statuses.length - 1]?.id : undefined })
			setStatuses(more ? [...statuses, ...d.data] : d.data)
		} finally {
			setIsLoading(false)
			setIsRefreshing(false)
			setIsMoreLoading(false)
		}
	}
	useEffect(() => {
		load()
		navigation.setOptions({ title: `#${q}` })
	}, [acct, q])
	const addPin = async () => {
		if (!client || !acct) return
		const tls = await getTimelines()
		const exists = tls.find((t) => t.kind === 'tag' && t.acctId === acct.id && t.tagName === q)
		if (exists) return
		const id = randomUUID()
		const newTimeline: Timeline = {
			id: id,
			tagName: q,
			name: await makeTagTimelineNameWithAcctId(q, acct.id),
			kind: 'tag',
			acctId: acct.id
		}
		await saveTimelines([...tls, newTimeline])
		router.navigate('/')
	}
	if (isLoading || !statuses.length || !client || !acct) {
		return (
			<SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</SafeAreaView>
		)
	}
	return (
		<View>
			<View style={styles.horizontal}>
				<CustomButton onPress={() => setIsOpened(true)} style={{ margin: 5, padding: 5, width: width - 70 }}>
					<View style={styles.acctContainer}>
						<View>
							<Avatar src={acct.avatar || acct.favicon} fallback={acct.sns} size={20} />
						</View>
						<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
							{acct.username}@{acct.domain}
						</Text>
					</View>
				</CustomButton>
				<IconButton systemImage="pin" onPress={() => addPin()} style={{ width: 40, height: 40, marginLeft: 5 }} width={45} isDark={isDark} />
			</View>

			<AcctSelector change={(r) => setAcct(r)} isOpened={isOpened} setIsOpened={setIsOpened} />
			<FlatList
				renderItem={({ item, index }) => (
					<>
						<Status
							status={item}
							acct={acct}
							client={client}
							lang={lang}
							columnWidth={width}
							config={config.timeline}
							filters={[]}
							updateStatus={() => {}}
							composeAction={async (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => {
								const isMe = target.account.acct !== account.username ? `@${target.account.acct} ` : ''
								if (type === 'reply') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=reply&addText=${encodeURIComponent(`${isMe}${getAllMentions(target)}`)}`)
								if (type === 'quote') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=quote`)
								if (type === 'edit') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=edit&addText=${encodeURIComponent(await getSourceText(target, client))}`)
							}}
						/>
						{statuses.length === index + 1 && (
							<View style={{ width: width, justifyContent: 'center', alignItems: 'center', padding: 20, display: statuses.length === 0 ? 'none' : 'flex' }}>
								{isMoreLoading ? (
									<ActivityIndicator />
								) : (
									<TouchableOpacity activeOpacity={0.7} onPress={() => load(true)} style={{ padding: 10, borderRadius: 5, borderWidth: 1, borderColor: PlatformColor('separator') }}>
										<Text>{t('timeline.more')}</Text>
									</TouchableOpacity>
								)}
							</View>
						)}
					</>
				)}
				data={statuses}
				keyExtractor={(item) => item.id}
				refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
			/>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		horizontal: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 10,
			width: width
		},
		acctContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			height: 30
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		}
	})
