import Avatar from '@/components/Avatar'
import { Status } from '@/components/status/Status'
import AcctSelector from '@/components/timeline/AcctSelector'
import { CustomButton } from '@/components/ui/Button'
import type { Account } from '@/entities/account'
import { useWindowSize } from '@/hooks/useWindowSize'
import { getAcctById } from '@/utils/storage'
import { useConfigStore } from '@/utils/store/config'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import * as Localization from 'expo-localization'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, ScrollView, StyleSheet, Text, type TextInput, useColorScheme, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
	const { t } = useTranslation()
	const params = useLocalSearchParams()
	const router = useRouter()
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'
	const { acctId, statusId } = params as Record<'acctId' | 'statusId', string>
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [isLoading, setIsLoading] = useState(false)
	const [isOpened, setIsOpened] = useState(false)
	const [acct, setAcct] = useState<Account | null>(null)
	const [status, setStatus] = useState<Entity.Status | null>(null)
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const textArea = useRef<TextInput>(null)

	const { width, deviceWidth } = useWindowSize()
	const padding = (deviceWidth - width) / 2 + 10
	const { config } = useConfigStore()
	const styles = createStyles({ width })
	useEffect(() => {
		const fn = async () => {
			if (!acct) throw new Error('Invalid account id')
			if (!status) throw new Error('Invalid status')
			if (!status.url) throw new Error('Status has no url')
			setIsLoading(true)
			try {
				const https = `https://${acct.domain}`
				const client = generator(acct.sns, https, acct.accessToken)
				setClient(client)
				const d = await client.search(status.url, { type: 'statuses', limit: 1, resolve: true })
				const s = d.data.statuses[0]
				setStatus(s)
			} finally {
				setIsLoading(false)
			}
		}
		fn()
	}, [acct, statusId])
	useEffect(() => {
		const fn = async () => {
			const acct = await getAcctById(acctId)
			if (!acct) throw new Error('Invalid account id')
			const https = `https://${acct.domain}`
			const client = generator(acct.sns, https, acct.accessToken)
			setClient(client)
			const d = await client.getStatus(statusId)
			setStatus(d.data)
			setAcct(acct)
		}
		fn()
	}, [acctId])
	if (isLoading || !status || !acct || !client) {
		return (
			<SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<ActivityIndicator />
			</SafeAreaView>
		)
	}
	return (
		<ScrollView style={{ paddingHorizontal: padding }}>
			<CustomButton onPress={() => setIsOpened(true)} style={{ margin: 5, padding: 5, width: width - 10 }}>
				<View style={styles.acctContainer}>
					<View>
						<Avatar src={acct.avatar || acct.favicon} fallback={acct.sns} size={20} />
					</View>
					<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
						{acct.username}@{acct.domain}
					</Text>
				</View>
			</CustomButton>
			<AcctSelector change={(r) => setAcct(r)} isOpened={isOpened} setIsOpened={setIsOpened} />
			<Status
				status={status}
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
		</ScrollView>
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
