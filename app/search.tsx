import { Tag } from '@/components/profile/Tag'
import { User } from '@/components/profile/User'
import { Status } from '@/components/status/Status'
import { Text } from '@/components/themed/Text'
import { IconButton } from '@/components/ui/Button'
import type { Account } from '@/entities/account'
import { getAcctById } from '@/utils/storage'
import { useConfigStore } from '@/utils/store/config'
import { staticStyles } from '@/utils/theme'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import * as Localization from 'expo-localization'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, PlatformColor, ScrollView, StyleSheet, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native'

export default function Index() {
	const { t } = useTranslation()
	const [scrolled, setScrolled] = useState(false)

	const router = useRouter()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const params = useLocalSearchParams()

	const { config } = useConfigStore()
	const { acctId: acctIdDefault } = params as Record<'acctId', string>
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const txtColor = isDark ? 'white' : 'black'

	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'

	const [client, setClient] = useState<MegalodonInterface>()
	const [acctId, setAcctId] = useState<string>(acctIdDefault)
	const [acct, setAcct] = useState<Account | null>(null)
	const [q, setQ] = useState('')
	const [isShowTrend, setIsShowTrend] = useState<boolean>(true)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [tags, setTags] = useState<Array<Entity.Tag>>([])
	const [users, setUsers] = useState<Array<Entity.Account>>([])
	const [posts, setPosts] = useState<Array<Entity.Status>>([])
	const search = async () => {
		if (!client) return
		setIsLoading(true)
		setIsShowTrend(false)
		try {
			const res1 = await client.search(q, { type: 'hashtags', limit: 20 })
			setTags(res1.data.hashtags)
		} catch (e) {
			setTags([])
		}
		try {
			const res2 = await client.search(q, { type: 'accounts', limit: 20 })
			setUsers(res2.data.accounts)
		} catch (e) {
			setUsers([])
		}
		try {
			const res3 = await client.search(q, { type: 'statuses', limit: 20 })
			setPosts(res3.data.statuses)
		} catch (e) {
			console.log(e)
			setPosts([])
		}
		setIsLoading(false)
	}
	const trend = async () => {
		setIsLoading(true)
		setIsShowTrend(true)
		setQ('')
		const acct = await getAcctById(acctId)
		if (!acct) throw new Error('Invalid account id')
		const https = `https://${acct.domain}`
		const client = generator(acct.sns, https, acct.accessToken)
		setClient(client)
		try {
			const res1 = await client.getInstanceTrends(10)
			setTags(res1.data)
		} catch (e) {
			setTags([])
		}
		try {
			const res2 = await client.getInstanceTrendUsers(10)
			setUsers(res2.data)
		} catch (e) {
			setUsers([])
		}
		try {
			const res3 = await client.getInstanceTrendPosts(10)
			console.log(res3.data)
			setPosts(res3.data)
		} catch (e) {
			console.log(e)
			setPosts([])
		}
		setIsLoading(false)
	}
	useEffect(() => {
		trend()
	}, [])
	useEffect(() => {
		const fn = async () => {
			const acct = await getAcctById(acctId)
			if (acct) setAcct(acct)
		}
		fn()
	}, [acctId])
	return (
		<ScrollView style={{ padding: 10 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
				<TextInput
					value={q}
					onChangeText={(query) => setQ(query)}
					style={[staticStyles.input, { width: width - 65, borderRadius: 20, color: isDark ? 'white' : 'black' }]}
					placeholder={t('search.placeholder')}
					placeholderTextColor={isDark ? 'lightgray' : 'gray'}
					readOnly={isLoading}
					onSubmitEditing={() => (q ? search() : trend())}
					returnKeyType="search"
				/>
				<IconButton
					systemImage={isShowTrend ? 'magnifyingglass' : 'xmark'}
					onPress={() => (isShowTrend ? search() : trend())}
					style={{ width: 45, height: 45, marginLeft: 5 }}
					width={45}
					isDark={isDark}
				/>
			</View>
			<View style={styles.horizontal}>
				<SymbolView style={styles.icon} name="number" type="monochrome" tintColor={textColor} size={24} />
				<Text style={styles.title}>{t(isShowTrend ? 'search.trendTag' : 'search.tag')}</Text>
			</View>
			{acct && client && (
				<FlatList
					data={tags}
					keyExtractor={(item) => item.name}
					ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: width - 10 }}></View>}
					renderItem={({ item }) => <Tag acct={acct} columnWidth={width - 30} txtColor={txtColor} tag={item} />}
					ListEmptyComponent={() => <View style={{ alignItems: 'center', marginVertical: 10 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
					scrollEnabled={false}
				/>
			)}
			<View style={styles.horizontal}>
				<SymbolView style={styles.icon} name="person.crop.square.on.square.angled.fill" type="monochrome" tintColor={textColor} size={24} />
				<Text style={styles.title}>{t(isShowTrend ? 'search.trendUser' : 'search.user')}</Text>
			</View>
			{acct && client && (
				<FlatList
					data={users}
					keyExtractor={(item) => item.id}
					ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: width - 10 }}></View>}
					renderItem={({ item: basic }) => <User acct={acct} columnWidth={width - 30} txtColor={txtColor} basic={basic} />}
					ListEmptyComponent={() => <View style={{ alignItems: 'center', marginVertical: 10 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
					scrollEnabled={false}
				/>
			)}
			<View style={styles.horizontal}>
				<SymbolView style={styles.icon} name="bubble.left.and.bubble.right" type="monochrome" tintColor={textColor} size={24} />
				<Text style={styles.title}>{t(isShowTrend ? 'search.trendPost' : 'search.post')}</Text>
			</View>
			{acct && client && (
				<FlatList
					ItemSeparatorComponent={() => <View style={{ borderWidth: 0.5, borderColor: PlatformColor('separator'), marginLeft: 5, width: width - 10 }}></View>}
					renderItem={({ item }) => (
						<Status
							status={item}
							acct={acct}
							client={client}
							lang={lang}
							columnWidth={width - 30}
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
					)}
					data={posts}
					keyExtractor={(item) => item.id}
					scrollEnabled={false}
					ListEmptyComponent={() => <View style={{ alignItems: 'center', marginVertical: 10 }}>{isLoading ? <ActivityIndicator /> : <Text>{t('empty')}</Text>}</View>}
				/>
			)}
		</ScrollView>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		horizontal: {
			flexDirection: 'row',
			marginVertical: 10
		},
		title: {
			fontWeight: 'bold',
			fontSize: 18,
			marginLeft: 3,
			marginTop: 1
		},
		icon: {}
	})
