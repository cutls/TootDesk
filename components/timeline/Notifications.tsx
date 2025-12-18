import type { Account } from '@/entities/account'
import type { Timeline as TimelineProps } from '@/entities/timeline'
import { getAcctById } from '@/utils/storage'
import { useFilterStore } from '@/utils/store/filter'
import { getNotifications } from '@/utils/timeline'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import generator from '@cutls/megalodon'
import { FlashList, type FlashListRef } from '@shopify/flash-list'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, RefreshControl, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Notification } from '../status/Notification'
import { Text } from '../themed/Text'
interface IProps {
	timeline: TimelineProps
	columnWidth: number
	lang: string
	relayRef?: React.Ref<FlashListRef<any>>
	composeAction: (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => void
}
export const Notifications = (props: IProps) => {
	const { timeline, columnWidth, lang, relayRef, composeAction } = props
	const { acctId } = timeline
	const { t } = useTranslation()
	const theme = useColorScheme()
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [acct, setAcct] = useState<Account | null>(null)

	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const [statuses, setStatuses] = useState<Entity.Notification[]>([])
	const [isMore, setIsMore] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [maxId, setMaxId] = useState<string | null>(null)

	const { getFilters } = useFilterStore()
	const [filters, setFilters] = useState<Entity.Filter[]>([])
	const isStreaming = false
	const updateStatus = (newStatus: Entity.Status | null, deleteId?: string) => {
		if (newStatus === null) setStatuses((prevStatuses) => prevStatuses.filter((s) => s.status?.id !== deleteId))
		if (newStatus) setStatuses((prevStatuses) => prevStatuses.map((s) => (s.status?.id === newStatus.id ? { ...s, status: newStatus } : s)))
	}
	const load = async (refresh: boolean) => {
		try {
			const getClient = async () => {
				const acctData = await getAcctById(acctId)
				setAcct(acctData)
				if (!acctData) throw new Error('Account not found')
				const https = `https://${acctData.domain}`
				const c = generator(acctData.sns, https, acctData.accessToken)
				setClient(c)
				return c
			}
			const useClient = client || (await getClient())
			const isReset = isStreaming || !refresh
			if (isReset) setStatuses([])
			if (isReset) setIsLoading(true)
			if (refresh) setIsRefreshing(true)
			const option = {}
			const res = await getNotifications(useClient, option)
			if (isReset) setMaxId(res[res.length - 1]?.id || null)
			setFilters(getFilters(acctId, 'notifications'))
			setStatuses(res)
		} catch (e) {
			console.log(e)
		} finally {
			setIsLoading(false)
			setIsRefreshing(false)
		}
	}
	useEffect(() => {
		load(false)
	}, [])
	const more = async () => {
		setIsMore(true)
		try {
			if (!client) return
			const res = await getNotifications(client, { max_id: maxId })
			setStatuses((p) => [...p, ...res])
			setMaxId(res[res.length - 1]?.id || null)
		} catch (e) {
			console.log(e)
		} finally {
			setIsMore(false)
		}
	}
	if (!client || !acct) return null
	return (
		<FlashList
			data={statuses}
			keyExtractor={(item) => item.id}
			ref={relayRef}
			refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
			ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: columnWidth - 10 }}></View>}
			renderItem={({ item: status }) => (
				<Notification
					status={status}
					client={client}
					acct={acct}
					columnWidth={columnWidth}
					updateStatus={updateStatus}
					composeAction={composeAction}
					config={{}}
					lang={lang === 'ja' ? 'ja' : 'en'}
					statusAction={(status: Entity.Status, type: 'reply' | 'quote' | 'edit') => console.log(status, type)}
					filters={filters}
				/>
			)}
			onEndReached={() => more()}
			onEndReachedThreshold={0}
			ListEmptyComponent={() => <View style={{ alignItems: 'center', marginTop: 100 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
			ListFooterComponent={() => (
				<View style={{ width: columnWidth, justifyContent: 'center', alignItems: 'center', padding: 20, display: statuses.length === 0 ? 'none' : 'flex' }}>
					{isMore ? (
						<ActivityIndicator />
					) : (
						<TouchableOpacity activeOpacity={0.7} onPress={() => more()} style={{ padding: 10, borderRadius: 5, borderWidth: 1, borderColor: PlatformColor('separator'), marginBottom: 100 }}>
							<Text>{t('timeline.more')}</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
		/>
	)
}
