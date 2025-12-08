import { CustomedButton } from '@/components/ui/CustomedButton'
import type { Account } from '@/entities/account'
import { listAccts, saveAccts } from '@/utils/storage'
import { staticStyles } from '@/utils/theme'
import generator, { getData } from '@cutls/megalodon'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, StyleSheet, TextInput, useColorScheme, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import semver from 'semver'

const misskeyPremission = [
	'read:account',
	'write:account',
	'read:blocks',
	'write:blocks',
	'read:drive',
	'write:drive',
	'read:favorites',
	'write:favorites',
	'read:following',
	'write:following',
	'read:messaging',
	'write:messaging',
	'read:mutes',
	'write:mutes',
	'write:notes',
	'read:notifications',
	'write:notifications',
	'read:reactions',
	'write:reactions',
	'write:votes',
	'read:pages',
	'write:pages',
	'write:page-likes',
	'read:page-likes',
	'read:user-groups',
	'write:user-groups',
	'read:channels',
	'write:channels',
	'read:gallery',
	'write:gallery',
	'read:gallery-likes',
	'write:gallery-likes',
	'read:flash',
	'write:flash',
	'read:flash-likes',
	'write:flash-likes',
	'write:invite-codes',
	'read:invite-codes',
	'write:clip-favorite',
	'read:clip-favorite',
	'read:federation',
	'write:report-abuse'
]
export default function Index() {
	const { t } = useTranslation()

	const router = useRouter()
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const [domain, setDomain] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const domainWithProtocol = `https://${domain}`
	const login = async () => {
        if (!domain) return
		setIsLoading(true)
		try {
			const { compatibleSns: sns, semanticVersionCompatibleNumber } = await getData(domainWithProtocol)
			const client = generator(sns, domainWithProtocol)
			const isMisskey = sns === 'misskey'
			const scopes = isMisskey ? misskeyPremission : ['read', 'write', 'follow']
			const redirectUrl = Linking.createURL('login')
			const app = await client.registerApp('TheDesk(mobile)', { scopes, redirect_uris: !isMisskey ? redirectUrl : 'urn:ietf:wg:oauth:2.0:oob', website: 'https://thedesk.top' })
			if (!app || !app.url) throw new Error('Cannot register app.')
			const a = await WebBrowser.openAuthSessionAsync(app.url)
			if (a.type === 'success') {
				const { queryParams } = Linking.parse(a.url)
				if (!queryParams) throw new Error('No available code found.')
				const { code } = queryParams
				const token = await client.fetchAccessToken(app.client_id, app.client_secret, code?.toString() || app.session_token || '', app.redirect_uri || '')
				const authrizedClient = generator(sns, domainWithProtocol, token.access_token)
				const { data: accountData } = await authrizedClient.verifyAccountCredentials()
				const { data: instanceData } = await authrizedClient.getInstance()

				const accounts = await listAccts()
				const id = accounts.length + 1
				const account: Account = {
					id,
					username: accountData.username,
					accountId: accountData.id,
					avatar: accountData.avatar,
					clientId: app.client_id,
					clientSecret: app.client_secret,
					accessToken: token.access_token,
					refreshToken: token.refresh_token || '',
					usual: false,
					color: null,
					avatarStatic: accountData.avatar_static,
					domain: domain,
					streamingUrl: instanceData.urls?.streaming_api || `wss://${domain}`,
					sns: sns,
					favicon: null,
					noStreaming: false,
					cannotSubscribe: sns === 'pleroma',
					emojiReactions: sns === 'misskey' || domain === 'fedibird.com',
					quoteSupport: sns === 'misskey' || domain === 'fedibird.com' || (sns === 'mastodon' && !semver.lt(semanticVersionCompatibleNumber, '4.5.0'))
				}
				accounts.push(account)
				await saveAccts(accounts)
                router.replace('/acct')
			} else {
				throw new Error('User cancelled login.')
			}
		} catch (e: any) {
			Alert.alert(t('login.failed'), `Reason: ${e.message || e.toString()}`)
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<KeyboardAvoidingView style={styles.container}>
			<TextInput
				value={domain}
				onChangeText={(t) => setDomain(t)}
				style={[staticStyles.input, { width: '100%', borderRadius: 20 }]}
				placeholder="mastodon.social"
				placeholderTextColor={isDark ? 'lightgray' : 'gray'}
				readOnly={isLoading}
			/>
			{isLoading ? <View style={{ marginTop: 20 }}>
                <ActivityIndicator />
            </View> : <CustomedButton isGlass={true} color="teal" isPrimary={true} style={styles.link} onPress={() => login()}>
				{t('screen.login')}
			</CustomedButton>}
		</KeyboardAvoidingView>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 0,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20
	},
	link: {
		marginTop: 15,
		paddingVertical: 15
	}
})
