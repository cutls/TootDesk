import { Status } from '@/components/status/Status'
import { Text } from '@/components/themed/Text'
import type { Account } from '@/entities/account'
import { getAcctById } from '@/utils/storage'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
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
	const [acct, setAcct] = useState<Account | null>(null)
	const [statuses, setStatuses] = useState<Entity.Status[]>([])
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'

	const load = async (more?: boolean) => {
		if (!more) setIsLoading(true)
		if (!more) setIsRefreshing(true)
		if (more) setIsMoreLoading(true)

		try {
			const acct = await getAcctById(acctId)
			if (!acct) throw new Error('Invalid account id')
			setAcct(acct)
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
	}, [acctId, q])
	if (isLoading || !statuses.length || !client || !acct) {
		return (
			<SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</SafeAreaView>
		)
	}
	return (
		<View>
			<FlatList
				renderItem={({ item, index }) => (
					<>
						<Status
							status={item}
							acct={acct}
							client={client}
							lang={lang}
							columnWidth={width}
							config={{}}
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
		}
	})
