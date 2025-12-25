import { Status } from '@/components/status/Status'
import type { Account } from '@/entities/account'
import { getAcctById } from '@/utils/storage'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import * as Localization from 'expo-localization'
import { useIsPreview, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, ScrollView, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
	const { t } = useTranslation()
	const isPreview = useIsPreview()
	const [scrolled, setScrolled] = useState(false)

	const router = useRouter()
	const params = useLocalSearchParams()
	const { acctId, statusId } = params as Record<'acctId' | 'statusId', string>
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [acct, setAcct] = useState<Account | null>(null)
	const [status, setStatus] = useState<Entity.Status | null>(null)
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'
	useEffect(() => {
		const fn = async () => {
			setIsLoading(true)
			try {
				const acct = await getAcctById(acctId)
				if (!acct) throw new Error('Invalid account id')
				setAcct(acct)
				const https = `https://${acct.domain}`
				const client = generator(acct.sns, https, acct.accessToken)
				setClient(client)
				const d = await client.getStatus(statusId)
				setStatus(d.data)
			} finally {
				setIsLoading(false)
			}
		}
		fn()
	}, [acctId, statusId])
	if (isLoading || !status || !client || !acct) {
		return (
			<SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</SafeAreaView>
		)
	}
	return (
		<ScrollView onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 300)} style={{}}>
			<Status
				status={status}
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
		</ScrollView>
	)
}
const createStyles = ({ width }: { width: number }) => StyleSheet.create({})
