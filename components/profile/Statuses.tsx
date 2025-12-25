import type { Account } from '@/entities/account'
import { useFilterStore } from '@/utils/store/filter'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Status } from '../status/Status'
import { Text } from '../themed/Text'
interface IProps {
	client: MegalodonInterface | null
	targetId: string
	acct: Account
	columnWidth: number
	lang: string
}
export const ProfileStatuses = (props: IProps) => {
	const { t } = useTranslation()
	const router = useRouter()
	const { client, acct, columnWidth, targetId } = props
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const [statuses, setStatuses] = useState<Entity.Status[]>([])
	const [isMore, setIsMore] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [filters, setFilters] = useState<Entity.Filter[]>([])
	const { getFilters } = useFilterStore()
	const updateStatus = (newStatus: Entity.Status | null, deleteId?: string) => {
		if (newStatus === null) setStatuses((prevStatuses) => prevStatuses.filter((s) => s.id !== deleteId))
		if (newStatus) setStatuses((prevStatuses) => prevStatuses.map((s) => (s.id === newStatus.id ? newStatus : s)))
	}
	useEffect(() => {
		setFilters(getFilters(acct.id, 'home'))
		const fn = async () => {
			setIsLoading(true)
			try {
				if (!client) return
				const res = await client.getAccountStatuses(targetId)
				setStatuses(res.data)
			} catch (e) {
				console.log(e)
			} finally {
				setIsLoading(false)
			}
		}
		fn()
	}, [client])
	const more = async () => {
		setIsMore(true)
		try {
			if (!client) return
			const res = await client.getAccountStatuses(targetId, { max_id: statuses[statuses.length - 1]?.id })
			setStatuses((p) => [...p, ...res.data])
		} catch (e) {
			console.log(e)
		} finally {
			setIsMore(false)
		}
	}
	if (!client) return null

	return (
		<FlashList
			data={statuses}
			keyExtractor={(item) => item.id}
			ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: columnWidth - 10 }}></View>}
			renderItem={({ item: status }) => (
				<Status
					status={status}
					client={client}
					acct={acct}
					columnWidth={columnWidth}
					updateStatus={updateStatus}
					config={{}}
					composeAction={async (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => {
							const isMe = target.account.acct !== account.username ? `@${target.account.acct} ` : ''
							if (type === 'reply') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=reply&addText=${encodeURIComponent(`${isMe}${getAllMentions(target)}`)}`)
							if (type === 'quote') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=quote`)
							if (type === 'edit') router.push(`/post?acctId=${account.id}&targetId=${target.id}&statusId=${target.id}&mode=edit&addText=${encodeURIComponent(await getSourceText(target, client))}`)
						}}
					lang={props.lang === 'ja' ? 'ja' : 'en'}
					filters={filters}
				/>
			)}
			ListEmptyComponent={() => (
				<View style={{ alignItems: 'center', marginTop: 100 }}>
					{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}
				</View>
			)}
			ListFooterComponent={() => (
				<View style={{ width: columnWidth, justifyContent: 'center', alignItems: 'center', padding: 20, display: statuses.length === 0 ? 'none' : 'flex' }}>
					{isMore ? <ActivityIndicator /> : <TouchableOpacity activeOpacity={0.7} onPress={() => more()} style={{ padding: 10, borderRadius: 5, borderWidth: 1, borderColor: PlatformColor('separator') }}>
						<Text>{t('timeline.more')}</Text>
					</TouchableOpacity>}
				</View>
			)}
		/>
	)
}
