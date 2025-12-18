import type { Account } from '@/entities/account'
import type { Timeline as TimelineProps } from '@/entities/timeline'
import { getAcctById } from '@/utils/storage'
import { useFilterStore } from '@/utils/store/filter'
import { getStatuses } from '@/utils/timeline'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import generator from '@cutls/megalodon'
import { FlashList, type FlashListRef } from '@shopify/flash-list'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, RefreshControl, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Status } from '../status/Status'
import { Text } from '../themed/Text'
interface IProps {
	timeline: TimelineProps
	columnWidth: number
	lang: string
	relayRef?: React.Ref<FlashListRef<any>>
	composeAction: (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => void
}
export const Timeline = (props: IProps) => {
	const { timeline, columnWidth, lang, relayRef, composeAction } = props
	const { kind: type, listId, tagName, acctId } = timeline
	const targetId = type === 'list' ? listId : type === 'tag' ? tagName : null
	const { t } = useTranslation()
	const theme = useColorScheme()
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [acct, setAcct] = useState<Account | null>(null)
	const { getFilters } = useFilterStore()
	const [filters, setFilters] = useState<Entity.Filter[]>([])

	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const [statuses, setStatuses] = useState<Entity.Status[]>([])
	const [isMore, setIsMore] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [maxId, setMaxId] = useState<string | null>(null)
	const isStreaming = false
	const updateStatus = (newStatus: Entity.Status | null, deleteId?: string) => {
		if (newStatus === null) setStatuses((prevStatuses) => prevStatuses.filter((s) => s.id !== deleteId))
		if (newStatus) setStatuses((prevStatuses) => prevStatuses.map((s) => (s.id === newStatus.id ? newStatus : s)))
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
			const res = await getStatuses(useClient, type, option, targetId)
			if (isReset) setMaxId(res.maxId)
			setFilters(getFilters(acctId, type))
			setStatuses(res.data)
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
			const res = await getStatuses(client, type, { max_id: maxId }, targetId)
			setStatuses((p) => [...p, ...res.data])
			setMaxId(res.maxId)
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
				<Status
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
			ListEmptyComponent={() => <View style={{ alignItems: 'center', marginTop: 100 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
			onEndReached={() => more()}
			onEndReachedThreshold={0}
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
