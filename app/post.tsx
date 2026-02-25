import ComposeSheet from '@/components/ComposeSheet'
import { getAcctById } from '@/utils/storage'
import type { ActionProps } from '@/utils/type'
import generator from '@cutls/megalodon'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
interface ActionPropsI {
	type?: 'reply' | 'quote' | 'edit'
	acctId: string
	targetId?: string
	addText?: string
	statusId?: string
	visibility?: 'public' | 'unlisted' | 'private' | 'direct' | 'local'
}

export default function Post() {
	const params = useLocalSearchParams()
	const [composeAction, setComposeAction] = useState<ActionProps | null>(null)
	const { type, acctId, targetId, addText: notEncodedAddText, statusId, visibility } = params as unknown as ActionPropsI
	const addText = notEncodedAddText ? decodeURIComponent(notEncodedAddText) : undefined
	useEffect(() => {
		const fn = async () => {
			if (statusId && acctId) {
				const acct = await getAcctById(acctId)
				if (!acct) return
				const https = `https://${acct.domain}`
				const client = generator(acct.sns, https, acct.accessToken)
				const d = await client.getStatus(statusId)
				setComposeAction({ type, acctId, targetId, addText, status: d.data, visibility })
				return
			}
			setComposeAction({ type, acctId, targetId, addText, visibility })
		}
		fn()
	}, [type, acctId, targetId, addText, statusId, visibility])
	return (
		<ComposeSheet
			isInSheet={false}
			isOpened={true}
			setIsOpened={(r) => {
				if (!r) router.back()
			}}
			composeAction={composeAction}
			clearComposeAction={(acctId: string) => setComposeAction({ acctId })}
		/>
	)
}
const createStyles = ({ width }: { width: number }) => StyleSheet.create({})
