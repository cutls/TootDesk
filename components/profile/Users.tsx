import type { Account } from '@/entities/account'
import { parseHeader } from '@/utils/parseHeader'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { FlashList } from '@shopify/flash-list'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, TouchableOpacity, useColorScheme, View } from 'react-native'
import { Text } from '../themed/Text'
import { User } from './User'
interface IProps {
	client: MegalodonInterface | null
	targetId: string
	acct: Account
	columnWidth: number
	lang: string
	type: 'followers' | 'following'
}
export const ProfileUsers = (props: IProps) => {
	const { client, acct, columnWidth, targetId, type } = props
	const { t } = useTranslation()
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const [users, setUsers] = useState<Entity.Account[]>([])
	const [isMore, setIsMore] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [maxId, setMaxId] = useState<string | null>(null)
	useEffect(() => {
		const fn = async () => {
			try {
				if (!client) return
				setIsLoading(true)
				const res = type === 'following' ? await client.getAccountFollowing(targetId) : await client.getAccountFollowers(targetId)
				const link = parseHeader(res.headers.link)
				setMaxId(link.next.urlParams.max_id)
				setUsers(res.data)
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
			const res = type === 'following' ? await client.getAccountFollowing(targetId, { max_id: maxId || undefined }) : await client.getAccountFollowers(targetId, { max_id: maxId || undefined })
			setUsers((p) => [...p, ...res.data])
		} catch (e) {
			console.log(e)
		} finally {
			setIsMore(false)
		}
	}
	if (!client) return null

	return (
		<FlashList
			data={users}
			keyExtractor={(item) => item.id}
			ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: columnWidth - 10 }}></View>}
			renderItem={({ item: basic }) => (
				<User acct={acct} columnWidth={columnWidth} txtColor={txtColor} basic={basic} />
			)}
			ListEmptyComponent={() => <View style={{ alignItems: 'center', marginTop: 100 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
			ListFooterComponent={() => (
				<View style={{ width: columnWidth, justifyContent: 'center', alignItems: 'center', padding: 20, display: users.length === 0 ? 'none' : 'flex' }}>
					{isMore ? (
						<ActivityIndicator />
					) : (
						<TouchableOpacity activeOpacity={0.7} onPress={() => more()} style={{ padding: 10, borderRadius: 5, borderWidth: 1, borderColor: PlatformColor('separator') }}>
							<Text>{t('timeline.more')}</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
		/>
	)
}
