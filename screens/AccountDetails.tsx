import React, { useState } from 'react'
import { StyleSheet, Dimensions, Modal, Image, FlatList, ActionSheetIOS, ScrollView } from 'react-native'
import { Text, View, TouchableOpacity } from '../components/Themed'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import * as Alert from '../utils/alert'
import * as api from '../utils/api'
import { commonStyle } from '../utils/styles'
import ImageModal from '../components/modal/ImageModal'
import Post from '../components/Post'
import { AccountName, emojify } from '../components/AccountName'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import Account from '../components/Account'
import * as WebBrowser from 'expo-web-browser'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { statusBarHeight } from '../utils/statusBar'
import moment from 'moment-timezone'
import 'moment/locale/ja'
import Toot from '../components/Toot'
moment.locale('ja')
moment.tz.setDefault('Asia/Tokyo')
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed,
	}),
}
const deviceWidth = Dimensions.get('window').width
export default function AccountDetails({ navigation, route }: StackScreenProps<ParamList, 'AccountDetails'>) {
	const [openUrl, setOpenUrl] = useState('https://toot.thedesk.top')
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Root'))} style={{ marginLeft: 10 }}>
					<Ionicons name="arrow-back" size={30} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity onPress={async () => await WebBrowser.openBrowserAsync(openUrl)} style={{ marginRight: 10 }}>
					<MaterialIcons name="open-in-browser" size={30} />
				</TouchableOpacity>
			),
		})
	}, [navigation, openUrl, WebBrowser])
	const [ready, setReady] = useState(false)
	const [inited, setInited] = useState(false)
	const [tooting, setTooting] = useState(false)
	const [deletable, setDeletable] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [account, setAccount] = useState({} as M.Account)
	const [relationship, setRelationship] = useState({} as M.Relationship)
	const [fffw, setFffw] = useState([{}, {}] as [M.Account[], M.Account[]])
	const [uTl, setUtl] = useState([] as M.Toot[])
	const [acctId, setAcctId] = useState('')
	const [text, setText] = useState('' as string)
	const [replyId, setReplyId] = useState('' as string)
	const [imageModal, setImageModal] = useState({ url: [''], i: 0, show: false })
	let at: string | undefined
	let notfId: string | undefined
	const init = async (acctIdGet: string, id: string) => {
		try {
			setInited(true)
			const { domain, at, acct } = (await storage.getCertainItem('accounts', 'id', acctIdGet)) as S.Account
			const acctData = await api.getV1Account(domain, at, id)
			const pinnedUserTlRaw = await api.getV1AccountsStatuses(domain, at, id, { pinned: true })
			const pinnedUserTl = pinnedUserTlRaw.map((item) => {
				item.customPinned = true
				return item
			})
			const standardUserTl = await api.getV1AccountsStatuses(domain, at, id)
			const userTl = pinnedUserTl.concat(standardUserTl)
			const relationships = await api.getV1Relationships(domain, at, [id])
			setOpenUrl(acctData.url)
			setRelationship(relationships[0])
			setUtl(userTl)
			const fings = await api.getV1Follows(domain, at, id)
			const fers = await api.getV1Follower(domain, at, id)
			setFffw([fings, fers])
			setDeletable(`@${acctData.acct}@${domain}` === acct)
			setAcctId(acctIdGet)
			setAccount(acctData)
			setReady(true)
		} catch (e: any) {
			Alert.alert('Error', e.toString())
			console.log(e)
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
			const status = data.account
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
	const accountAction = () => {
		const { following, requested, muting, blocking, followed_by } = relationship
		const options = [following ? 'フォロー解除' : requested ? 'リクエスト解除' : 'フォロー', muting ? 'ミュート解除' : 'ミュート', blocking ? 'ブロック解除' : 'ブロック', 'リスト管理', 'キャンセル']
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				title: followed_by ? 'フォローされています' : 'フォローされていません',
				destructiveButtonIndex: 2,
				cancelButtonIndex: options.length - 1,
			},
			async (buttonIndex) => {
				if (buttonIndex === 3) return navigation.navigate('ListManager', { acctId, targetAcct: account.id })
				if (buttonIndex === 4) return true
				const a = await Alert.promise('確認', `${options[buttonIndex]}します。よろしいですか？`, Alert.UNSAVE)
				if (a === 1) {
					try {
						const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
						let newR = {} as M.Relationship
						if (buttonIndex === 0 && following) newR = await api.postV1UnFollow(domain, at, account.id)
						if (buttonIndex === 0 && !following && !requested) newR = await api.postV1Follow(domain, at, account.id)
						if (buttonIndex === 0 && !following && requested) newR = await api.postV1UnFollow(domain, at, account.id)
						if (buttonIndex === 1 && following) newR = await api.postV1UnMute(domain, at, account.id)
						if (buttonIndex === 1 && !following) newR = await api.postV1Mute(domain, at, account.id)
						if (buttonIndex === 2 && following) newR = await api.postV1UnBlock(domain, at, account.id)
						if (buttonIndex === 2 && !following) newR = await api.postV1Block(domain, at, account.id)
						setRelationship(newR)
					} catch (e: any) {
						Alert.alert('Error', e.toString())
					}
				}
			}
		)
	}
	const compactAcct = (e: any) => {
		const item = e.item as M.Account
		return (
			<TouchableOpacity onPress={() => init(acctId, item.id)} style={styles.acct}>
				<Account acctId={acctId} account={item} key={`notification ${item.id}`} goToAccount={(id: string) => init(acctId, id)} />
			</TouchableOpacity>
		)
	}
	const compactToot = (e: any) => {
		const item = e.item as M.Toot
		return (
			<>
				<Toot
					toot={item}
					acctId={acctId}
					navigation={navigation}
					deletable={false}
					key={`acctDetails ${item.id}`}
					imgModalTrigger={(url: string[], i: number, show: boolean) => true}
					reply={() => true} />
				<View style={commonStyle.separator} />
			</>
		)
	}

	const showAccts = fffw[selectedIndex === 1 ? 0 : 1]
	const fields = account.fields ? account.fields : []
	interface IField {
		name: string
		value: string
		verified_at?: string | null | undefined
	}
	interface ParamField {
		field: IField
	}
	const Fields = (fieldParam: ParamField) => {
		const { field } = fieldParam
		const iVeri = field.verified_at
		const addStyle = iVeri ? { backgroundColor: `#a7d9ae`, paddingTop: 20 } : {}
		const veriDate = iVeri && moment(new Date(iVeri)).format('YYYY/MM/DD')
		return (
			<View style={commonStyle.horizonal}>
				<View style={[styles.fieldName, addStyle]}>
					{!!iVeri && <Text style={styles.veriText}>{veriDate}</Text>}
					<Text>{field.name}</Text>
				</View>
				<View style={styles.fieldValue}>
					<HTML
						source={{ html: field.value }}
						tagsStyles={{ p: { margin: 0 } }}
						contentWidth={deviceWidth - 150}
						customHTMLElementModels={renderers}
						renderersProps={{
							a: {
								onPress: async (e, href) => await WebBrowser.openBrowserAsync(href),
							},
						}}
					/>
				</View>
			</View>
		)
	}
	return (
		<View style={commonStyle.container}>
			<Modal visible={imageModal.show} animationType="slide" presentationStyle="formSheet">
				<ImageModal url={imageModal.url} i={imageModal.i} imgModalTrigger={(url: string[], i: number, show: boolean) => setImageModal({ url, i, show })} />
			</Modal>
			<TouchableOpacity style={styles.followed} onPress={() => accountAction()}>
				<Text style={{ color: 'white' }}>
					→{relationship.following ? '〇' : relationship.requested ? '△' : '✕'} / ←{relationship.followed_by ? '〇' : '✕'}
				</Text>
				<Text style={{ color: 'white', fontSize: 8 }}>タップしてアクション</Text>
			</TouchableOpacity>
			<Image source={{ uri: account.header }} style={{ width: deviceWidth, height: 150, top: -10, left: -10 }} resizeMode="cover" />
			<View style={commonStyle.horizonal}>
				<Image source={{ uri: account.avatar }} style={{ width: 100, height: 100, marginRight: 10 }} />
				<View style={{ width: deviceWidth - 130 }}>
					<AccountName account={account} fontSize={20} showWithoutEllipsis={true} />
					<ScrollView style={{ width: deviceWidth - 130, maxHeight: 100 }}>
						<HTML
							source={{ html: emojify(account.note, account.emojis) }}
							tagsStyles={{ p: { margin: 0 } }}
							contentWidth={deviceWidth - 150}
							customHTMLElementModels={renderers}
							renderersProps={{
								a: {
									onPress: async (e, href) => await WebBrowser.openBrowserAsync(href),
								},
							}}
						/>
					</ScrollView>
				</View>
			</View>
			<View style={{ height: 10 }} />
			<ScrollView style={{ maxHeight: fields.length ? 180 : 0, minHeight: fields.length ? 50 : 0 }}>
				{fields[0] ? <Fields field={fields[0]} /> : null}
				{fields[1] ? <Fields field={fields[1]} /> : null}
				{fields[2] ? <Fields field={fields[2]} /> : null}
				{fields[3] ? <Fields field={fields[3]} /> : null}
			</ScrollView>
			<SegmentedControl
				style={{ marginVertical: 15 }}
				values={[`${account.statuses_count}トゥート`, `${account.following_count}フォロー`, `${account.followers_count}フォロワー`]}
				selectedIndex={selectedIndex}
				onChange={(event) => {
					setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
				}}
			/>
			{selectedIndex > 0 ? <FlatList ListEmptyComponent={() => <Text>データがありません</Text>} data={showAccts} renderItem={compactAcct} /> : null}
			{selectedIndex === 0 ? <FlatList ListEmptyComponent={() => <Text>データがありません</Text>} data={uTl} renderItem={compactToot} /> : null}
			<Post show={tooting} acct={acctId} tooting={setTooting} setText={setText} text={text} replyId={replyId} setReplyId={setReplyId} />
		</View>
	)
}
const styles = StyleSheet.create({
	fieldName: {
		width: (deviceWidth - 20) / 3,
		padding: 10,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ddd',
	},
	fieldValue: {
		width: ((deviceWidth - 20) / 3) * 2,
		padding: 10,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#eee',
	},
	followed: {
		position: 'absolute',
		right: 10,
		top: statusBarHeight() + 10,
		zIndex: 2,
		backgroundColor: 'rgba(0,0,0,0.7)',
		padding: 5,
		borderRadius: 10,
		display: 'flex',
		alignItems: 'center',
	},
	toot: {
		marginVertical: 2,
		paddingVertical: 4,
		borderBottomColor: '#aaa',
		borderBottomWidth: 1
	},
	acct: {
		marginVertical: 2,
		paddingVertical: 4,
		borderBottomColor: '#aaa',
		borderBottomWidth: 1
	},
	veriText: {
		fontWeight: 'bold',
		position: 'absolute',
		color: '#1d7a2a',
		top: 5,
		right: 5
	}
})
