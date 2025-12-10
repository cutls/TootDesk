import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { FlashList } from '@shopify/flash-list'
import React, { useEffect, useState } from 'react'
import { PlatformColor, useColorScheme, View } from 'react-native'
import { Status } from '../status/Status'
interface IProps {
	client: MegalodonInterface | null
	targetId: string
	acctId: string
	columnWidth: number
	lang: string
}
export const ProfileStatuses = (props: IProps) => {
	const { client, acctId, columnWidth, targetId } = props
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	if (!client) return null
	const [statuses, setStatuses] = useState<Entity.Status[]>([])
	const updateStatus = (newStatus: Entity.Status) => {
		setStatuses((prevStatuses) => prevStatuses.map((s) => (s.id === newStatus.id ? newStatus : s)))
	}
	useEffect(() => {
		const fn = async () => {
			try {
				const res = await client.getAccountStatuses(targetId)
				setStatuses(res.data)
			} catch (e) {
				console.log(e)
			}
		}
		fn()
	}, [])

	return (
		<FlashList
			data={statuses}
			keyExtractor={(item) => item.id}
			ItemSeparatorComponent={() => <View style={{ borderWidth : 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: columnWidth - 10 }}></View>}
			renderItem={({ item: status }) => (
				<Status
					status={status}
					client={client}
					acctId={acctId}
					columnWidth={columnWidth}
					updateStatus={updateStatus}
					config={{}}
					lang={props.lang === 'ja' ? 'ja' : 'en'}
					statusAction={(status: Entity.Status, type: 'reply' | 'quote' | 'edit') => console.log(status, type)}
					filters={[]}
				/>
			)}
		/>
	)
}
