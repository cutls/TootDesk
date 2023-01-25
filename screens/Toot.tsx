import React, { useState } from 'react'
import { StatusBar, Modal, FlatList, useWindowDimensions, useColorScheme } from 'react-native'
import { Text, View, TouchableOpacity } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import { commonStyle } from '../utils/styles'
import Toot from '../components/Toot'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { AccountName, emojify } from '../components/AccountName'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Account from '../components/Account'
import * as WebBrowser from 'expo-web-browser'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { SetConfigContext } from '../utils/context/config'
import { ImageModalContext } from '../utils/context/imageModal'
import { configInit, IConfig } from '../interfaces/Config'
import { stripTags } from '../utils/stringUtil'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed,
	}),
}
export default function TootIndv({ navigation, route }: StackScreenProps<ParamList, 'Toot'>) {
	const [openUrl, setOpenUrl] = useState('https://toot.thedesk.top')
	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20

	const theme = useColorScheme()
	const isDark = theme === 'dark'
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
			headerTitleStyle: { color: isDark ? 'white' : 'black' },
			headerLeft: () => (
				<TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Root'))} style={{ marginLeft: 10 }}>
					<Ionicons name="arrow-back" size={30} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={async () => await WebBrowser.openBrowserAsync(openUrl)} style={{ marginRight: 10 }}>
					<MaterialIcons name="open-in-browser" size={30} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			)
		})
	}, [navigation, openUrl, WebBrowser, isDark])
	const [config, setConfig] = useState<IConfig>(configInit)
	const [ready, setReady] = useState(false)
	const [inited, setInited] = useState(false)
	const [tooting, setTooting] = useState(false)
	const [deletable, setDeletable] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [toot, setToot] = useState({} as M.Toot)
	const [ancestors, setAncestors] = useState([] as M.Toot[])
	const [descendants, setDescendants] = useState([] as M.Toot[])
	const [accounts, setAccounts] = useState([] as M.Account[][])
	const [acctId, setAcctId] = useState('')
	const [text, setText] = useState('' as string)
	const [txtActionId, setTxtActionId] = useState('' as string)
	const [imageModal, setImageModal] = useState({
		url: [''],
		i: 0,
		show: false,
	})
	let at: string | undefined
	let notfId: string | undefined
	const init = async (acctIdGet: string, id: string) => {
		try {
			setInited(true)
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
			setReady(true)
		} catch (e: any) {
			Alert.alert('Error', e.toString())
		}
	}
	const solve = async (domain: string, at: string, notfId: string) => {
		try {
			setInited(true)
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
	if (!route.params) return null

	if (route.params.notification) {
		let domain = route.params.domain
		at = route.params.at
		notfId = route.params.notfId
		if (!domain || !at || !notfId) return null
		if (!inited) solve(domain, at, notfId)
	} else {
		const acctIdGet = route.params.acctId
		const id = route.params.id
		if (!acctIdGet || !id) return null
		if (!inited) init(acctIdGet, id)
	}
	if (!ready) {
		return (
			<View style={[commonStyle.container, commonStyle.blockCenter]}>
				<Text>Loading...</Text>
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
				const r = await Alert.promise('Error', '編集非対応(~v4.0.0)のサーバーの可能性があります。「削除して再編集」を実行しますか？', Alert.DELETE)
				if (r === 0) return
				const data = await api.deleteV1Status(acct.domain, acct.at, id)
				const text = data.text || stripTags(data.content)
				if (!text) throw ''
				setText(text)
			}
		}
	}
	const compactToot = (e: any) => {
		const item = e.item as M.Toot
		const txtColor = isDark ? 'white' : 'black'
		return (
			<TouchableOpacity onPress={() => init(acctId, item.id)} style={{ maxHeight: 50, overflow: 'hidden' }}>
				<AccountName account={item.account} miniEmoji={true} width={deviceWidth} />
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

	const showAccts = accounts[selectedIndex]
	return (
		<SetConfigContext.Provider value={{ config, setConfig }}>
			<ImageModalContext.Provider value={{ imageModal, setImageModal }}>
				<View style={commonStyle.container}>
					<Modal visible={imageModal.show} animationType="fade" presentationStyle="fullScreen">
						<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url, i, show })} />
					</Modal>
					{ancestors.length ? (
						<FlatList
							data={ancestors}
							renderItem={compactToot}
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
							renderItem={compactToot}
							keyExtractor={(item) => item.id}
							style={{
								maxHeight: descendants.length * 50 > deviceHeight / 4 ? deviceHeight / 4 : descendants.length * 50,
							}}
						/>
					) : null}
					<SegmentedControl
						style={{ marginVertical: 15 }}
						values={['お気に入りした人', 'ブーストした人']}
						selectedIndex={selectedIndex}
						onChange={(event) => {
							setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
						}}
					/>
					{showAccts ? (
						<FlatList
							data={showAccts}
							renderItem={compactAcct}
							keyExtractor={(item) => item.id}
							ListEmptyComponent={() => <Text>データがありません</Text>}
							style={{
							}}
						/>
					) : (
						<Text style={commonStyle.textCenter}>いません</Text>
					)}
					<Post show={tooting} acct={acctId} tooting={setTooting} insertText={text} txtActionId={txtActionId} />
				</View>
			</ImageModalContext.Provider>
		</SetConfigContext.Provider>
	)
}
