import React, { useEffect, useLayoutEffect, useState } from 'react'
import { StatusBar, Modal, FlatList, useWindowDimensions, useColorScheme, ActionSheetIOS, ActivityIndicator, StyleSheet } from 'react-native'
import { Text, View, TouchableOpacity } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import { Octicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import { commonStyle } from '../utils/styles'
import Toot from '../components/Toot'
import Post from '../components/Post'
import { AccountName, emojify } from '../components/AccountName'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Account from '../components/Account'
import * as WebBrowser from 'expo-web-browser'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { SetConfigContext } from '../utils/context/config'
import { configInit, IConfig } from '../interfaces/Config'
import { stripTags } from '../utils/stringUtil'
import { resolveStatus } from '../utils/tootAction'
import { LoadingContext } from '../utils/context/loading'
import * as Localization from 'expo-localization'
const locale = Localization.getLocales()
const langCode = locale[0].languageCode
const isJa = langCode === 'ja'
import moment from 'moment-timezone'
import 'moment/locale/ja'
moment.locale(isJa ? 'ja' : 'en')
import i18n from '../utils/i18n'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed,
	}),
}
export default function TootIndv({ navigation, route }: StackScreenProps<ParamList, 'Toot'>) {
	const [openUrl, setOpenUrl] = useState('https://toot.thedesk.top')
	const [rootLoading, setRootLoading] = useState<null | string>(null)
	const { height, width } = useWindowDimensions()

	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(width, height)
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	useLayoutEffect(() => {
		navigation.setOptions({
			headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
			headerTitleStyle: { color: isDark ? 'white' : 'black' },
			headerLeft: () => (
				<TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Root'))} style={{ marginLeft: 10 }}>
					<Octicons name="arrow-left" size={30} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={async () => await WebBrowser.openBrowserAsync(openUrl)} style={{ marginRight: 10 }}>
					<Octicons name="link-external" size={30} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			)
		})
	}, [navigation, openUrl, WebBrowser, isDark])
	const [config, setConfig] = useState<IConfig>(configInit)
	const [ready, setReady] = useState(false)
	const [tooting, setTooting] = useState(false)
	const [deletable, setDeletable] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [toot, setToot] = useState({} as M.Toot)
	const [ancestors, setAncestors] = useState<M.Toot[]>([])
	const [descendants, setDescendants] = useState<M.Toot[]>([])
	const [editHistory, setEditHistory] = useState<M.Toot[]>([])
	const [accounts, setAccounts] = useState<M.Account[][]>([])
	const [acctId, setAcctId] = useState('')
	const [text, setText] = useState('')
	const [txtActionId, setTxtActionId] = useState('')
	let at: string | undefined
	let notfId: string | undefined
	const init = async (acctIdGet: string, id: string) => {
		try {
			if (acctIdGet === 'noAuth') return
			const { domain, at, acct } = (await storage.getCertainItem('accounts', 'id', acctIdGet)) as S.Account
			const tootData = await api.getV1Toot(domain, at, id)
			const context = await api.getV1Context(domain, at, id)
			const faved = await api.getV1Faved(domain, at, id)
			const bted = await api.getV1Bted(domain, at, id)
			setAccounts([faved, bted])
			setDeletable(`@${tootData.account.acct}@${domain}` === acct)
			setAcctId(acctIdGet)
			setToot(tootData)
			setOpenUrl(tootData.uri)
			setAncestors(context.ancestors)
			setDescendants(context.descendants)
			console.log(tootData)
			if (tootData.edited_at) {
				const history = await api.getV1History(domain, at, id)
				setEditHistory(history)
			}
			setReady(true)
		} catch (e: any) {
			Alert.alert('Error', e.toString())
		}
	}
	const solve = async (domain: string, at: string, notfId: string) => {
		try {
			const acct = (await storage.getItem('accounts')) as S.Account[]
			const my = await api.getV1AccountsVerifyCredentials(domain, at)
			let acctId
			for (const a of acct) {
				if (a.acct === `@${my.acct}@${domain}`) acctId = a.id
			}
			if (!acctId) return false
			const data = await api.getV1NotificationId(domain, at, notfId)
			const status = data.status
			if (!status) return false
			init(acctId, status.id)
		} catch (e: any) {
			Alert.alert('Error', e.toString())
		}
	}
	const useOtherAccount = route.params?.acctId === 'noAuth'
	const operateAsOtherAccount = async () => {
		const accts = (await storage.getItem('accounts')) as S.Account[]
		const acctsTxt = accts.map((a) => a.acct)
		const url = route.params?.url
		if (!url) return
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options: acctsTxt,
			},
			async (buttonIndex) => {
				const acct = accts[buttonIndex]
				setRootLoading(i18n.t('検索中'))
				const newToot = await resolveStatus(acct.id, url)
				setRootLoading(null)
				if (!newToot) return Alert.alert('Error', i18n.t('このアカウントでは参照できませんでした'))
				navigation.replace('Toot', { acctId: acct.id, id: newToot.id, notification: false })
			}
		)
	}
	useEffect(() => {
		if (toot && useOtherAccount) operateAsOtherAccount()
	}, [useOtherAccount, toot])
	useEffect(() => {
		if (!route.params) return
		if (route.params.notification) {
			let domain = route.params.domain
			at = route.params.at
			notfId = route.params.notfId
			if (!domain || !at || !notfId) return
			solve(domain, at, notfId)
		} else {
			const acctIdGet = route.params.acctId
			const id = route.params.id
			if (!acctIdGet || !id) return
			init(acctIdGet, id)
		}
	}, [])
	
	if (!ready) {
		return (
			<View style={[commonStyle.container, commonStyle.blockCenter]}>
				{!rootLoading && <ActivityIndicator style={{ marginBottom: 10 }} size="large" />}
				<Text>Loading...</Text>
				<Modal visible={!!rootLoading} transparent={true}>
					<View style={[styles.rootLoading, bgColorAI]}>
						<ActivityIndicator size="large" />
						<Text style={commonStyle.rootLoadingText}>{rootLoading}</Text>
					</View>
				</Modal>
			</View>
		)
	}

	const txtAction = async (id: string, insertText: string, type: 'reply' | 'edit') => {
		if (type === 'reply') {
			setText(`@${insertText} `)
			setTxtActionId(`${type}:${id}`)
		}
		if (type === 'edit') {
			const acct = (await storage.getCertainItem('accounts', 'id', insertText)) as S.Account
			try {
				const data = await api.getV1Source(acct.domain, acct.at, id)
				const text = data.text
				if (!text) throw ''
				setText(text)
				setTxtActionId(`${type}:${id}`)
			} catch (e: any) {
				const r = await Alert.promise('Error ~v4.0.0', i18n.t('編集非対応のサーバーの可能性があります。「削除して再編集」を実行しますか？'), Alert.DELETE)
				if (r === 0) return
				const data = await api.deleteV1Status(acct.domain, acct.at, id)
				const text = data.text || stripTags(data.content)
				if (!text) throw ''
				setText(text)
			}
		}
	}
	const compactToot = (e: any, edited: boolean) => {
		const item = e.item as M.Toot
		const txtColor = isDark ? 'white' : 'black'
		return (
			<TouchableOpacity onPress={() => !edited && init(acctId, item.id)} style={{ maxHeight: 50, overflow: 'hidden' }}>
				<AccountName account={item.account} miniEmoji={true} width={deviceWidth} />
				{edited && <Text>{moment(item.created_at, 'YYYY-MM-DDTHH:mm:ss.000Z').format(i18n.t("'YY年M月D日 HH:mm:ss"))}</Text>}
				<HTML source={{ html: emojify(item.content, item.emojis, false, config.showGif) }} tagsStyles={{ p: { margin: 0, color: txtColor } }} customHTMLElementModels={renderers} contentWidth={deviceWidth - 50} />
			</TouchableOpacity>
		)
	}
	const compactAcct = (e: any) => {
		const item = e.item as M.Account
		return (
			<TouchableOpacity onPress={() => true}>
				<Account
					account={item}
					acctId={acctId}
					key={`notification ${item.id}`}
					width={deviceWidth}
					goToAccount={(id: string) =>
						navigation.navigate('AccountDetails', {
							acctId,
							id,
							notification: false,
						})
					}
				/>
			</TouchableOpacity>
		)
	}
	const segment = [i18n.t('お気に入りした人'), i18n.t('ブーストした人')]
	if (toot.edited_at) segment.push(i18n.t('編集履歴'))
	const showAccts = accounts[selectedIndex]
	return (
		<LoadingContext.Provider value={{ loading: rootLoading, setLoading: setRootLoading }}>
			<SetConfigContext.Provider value={{ config, setConfig }}>
					<View style={commonStyle.container}>
						{ancestors.length ? (
							<FlatList
								data={ancestors}
								renderItem={(item) => compactToot(item, false)}
								keyExtractor={(item) => item.id}
								style={{
									maxHeight: ancestors.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : ancestors.length * 50,
								}}
							/>
						) : null}
						<Toot
							navigation={navigation}
							deletable={deletable}
							acctId={acctId}
							toot={toot}
							txtAction={txtAction}
							width={deviceWidth}
							tlId={-1}
						/>
						{descendants.length ? (
							<FlatList
								data={descendants}
								renderItem={(item) => compactToot(item, false)}
								keyExtractor={(item) => item.id}
								style={{
									maxHeight: descendants.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : descendants.length * 50,
								}}
							/>
						) : null}
						<SegmentedControl
							style={{ marginVertical: 15 }}
							values={segment}
							selectedIndex={selectedIndex}
							onChange={(event) => {
								setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
							}}
						/>
						{selectedIndex < 2 && (
							<FlatList
								data={showAccts}
								renderItem={compactAcct}
								keyExtractor={(item) => item.id}
								ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>}
								style={{
								}}
							/>
						)}
						{selectedIndex === 2 && (
							<FlatList
								data={editHistory}
								renderItem={(item) => compactToot(item, true)}
								keyExtractor={(item) => item.id}
								ListEmptyComponent={() => <Text>{i18n.t('データがありません')}</Text>}
								style={{
								}}
							/>
						)}
						<Post show={tooting} acct={acctId} tooting={setTooting} insertText={text} txtActionId={txtActionId} />
					</View>
			</SetConfigContext.Provider>
		</LoadingContext.Provider>
	)
}
function createStyle(deviceWidth: number, deviceHeight: number) {
	return StyleSheet.create({
		rootLoading: {
			width: 200,
			height: 100,
			top: (deviceHeight / 2) - 50,
			left: (deviceWidth / 2) - 100,
			justifyContent: 'center',
			borderRadius: 10,
		},
	})
}