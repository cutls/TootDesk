import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, AppState, Dimensions, FlatList, RefreshControl, AppStateStatus } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import { RefObject } from 'react'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { MaterialIcons } from '@expo/vector-icons'
import { commonStyle } from '../utils/styles'

interface FromRootToTimeline {
	timeline: TimelineProps
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
	loading: string | null
	setLoading: React.Dispatch<React.SetStateAction<string | null>>
	setNewNotif: React.Dispatch<React.SetStateAction<boolean>>
	reply: (id: string, acct: string) => void
	navigation: StackNavigationProp<ParamList, any>
}
export default (props: FromRootToTimeline) => {
	const appState = React.useRef(AppState.currentState)
	const [appStateVisible, setAppStateVisible] = useState(appState.current)
	const [toots, setToots] = useState([] as M.Toot[])
	const [ids, setIds] = useState([] as string[])
	const [minId, setMinId] = useState('')
	const [acct, setAcct] = useState('')
	const [domain, setDomain] = useState('')
	const [ws, setWs] = useState({} as WebSocket)
	const [refreshing, setRefreshing] = useState(false)
	const [onScroll, setOnScroll] = useState(false)
	const [showToTop, setShowToTop] = useState(false)
	const onRefresh = React.useCallback(async () => {
		setRefreshing(true)
		await loadTimeline()
		setRefreshing(false)
	}, [])
	const { timeline, loading, setLoading, setNewNotif, reply, navigation } = props
	const renderItem = (e: any) => {
		const item = e.item as M.Toot
		const deletable = (item.reblog ? `@${item.reblog.account.acct}@${domain}` : `@${item.account.acct}@${domain}`) === acct
		return (
			<Toot
				navigation={navigation}
				toot={item}
				key={`${timeline.key} ${item.id}`}
				statusPost={statusPost}
				deletable={deletable}
				imgModalTrigger={(url: string[], i: number, show: boolean) => props.imgModalTrigger(url, i, show)}
				reply={reply}
				acctId={timeline.acct}
			/>
		)
	}
	let ct = 0
	const loadTimeline = async (moreLoad?: boolean) => {
		if (!timeline) return false
		if (!moreLoad) setLoading('Loading...')
		const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
		setAcct(acct.acct)
		setDomain(acct.domain)
		let streamable: string | false = false
		let data: M.Toot[] = []
		const param = {} as any
		if (moreLoad) param.max_id = minId
		switch (timeline.type) {
			case 'home':
				streamable = 'user'
				data = await api.getV1TimelinesHome(acct.domain, acct.at, param)
				setMinId(data[data.length - 1].id)
				break
			case 'local':
				streamable = 'public:local'
				data = await api.getV1TimelinesLocal(acct.domain, acct.at, param)
				setMinId(data[data.length - 1].id)
				break
			case 'public':
				streamable = 'public'
				data = await api.getV1TimelinesPublic(acct.domain, acct.at, param)
				setMinId(data[data.length - 1].id)
				break
			case 'hashtag':
				streamable = 'hashtag'
				data = await api.getV1TimelinesHashtag(acct.domain, acct.at, timeline.timelineData.target, param)
				setMinId(data[data.length - 1].id)
				break
			case 'list':
				streamable = 'list'
				data = await api.getV1TimelinesList(acct.domain, acct.at, timeline.timelineData.target, param)
				setMinId(data[data.length - 1].id)
				break
			case 'bookmark':
				streamable = false
				const bkm = await api.getV1Bookmarks(acct.domain, acct.at, param)
				setMinId(bkm[1])
				data = bkm[0]
				break
			case 'fav':
				streamable = false
				const fav = await api.getV1Favourites(acct.domain, acct.at, param)
				setMinId(fav[1])
				data = fav[0]
				break
			case 'user':
				streamable = false
				data = await api.getV1AccountsStatuses(acct.domain, acct.at, timeline.timelineData.target, param)
				break
		}
		if (moreLoad) {
			const clone = toots
			for (const obj of data) {
				clone.push(obj)
			}
			setToots(clone)
			return true
		}
		if (toots.length) setToots([])
		setTimeout(() => setToots(data), 200)
		setLoading(null)
		if (streamable) {
			let firstStep = true
			console.log('get stream')
			ct++
			if (ct > 2) return false
			const wss = new WebSocket(`wss://${acct.domain}/api/v1/streaming/?access_token=${acct.at}`)
			setWs(wss)
			wss.onopen = async (e) => {
				console.log('onopen', new Date())
				wss.send(JSON.stringify({ type: 'subscribe', stream: 'user' }))
				if (streamable !== 'user') {
					const wsParam = { type: 'subscribe', stream: streamable } as any
					if (streamable === 'list') wsParam.list = timeline.timelineData.target
					wss.send(JSON.stringify(wsParam))
				}
			}
			wss.onmessage = async (e) => {
				const { event } = JSON.parse(e.data)
				if (event === 'update' || event === 'conversation') {
					//markers show中はダメ
					const { stream, payload } = JSON.parse(e.data)
					const obj = JSON.parse(payload)
					const clone = firstStep ? data : toots
					//firstStep = false
					clone.unshift(obj)
					if (clone.length > 2) setToots(clone)
					//setIds(obj.id)
				} else if (event === 'notification') {
					setNewNotif(true)
				}
			}
			wss.onclose = async () => {
				console.log('closed')
				//if (!killStreaming) await loadTimeline()
			}
			wss.onerror = async (e) => {
				console.log(e)
			}
		}
	}
	const flatlistRef = React.useRef<FlatList>() as RefObject<FlatList<any>>
	const statusPost = async (action: 'boost' | 'fav' | 'unboost' | 'unfav' | 'delete', id: string, changeStatus: React.Dispatch<any>) => {
		try {
			const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
			let positive = true
			let ct = 0
			if (action === 'delete') {
				const data = await api.deleteV1Status(acct.domain, acct.at, id)
				return false
			} else if (action === 'boost') {
				const data = await api.postV1Boost(acct.domain, acct.at, id)
				ct = data.reblogs_count
			} else if (action === 'fav') {
				const data = await api.postV1Fav(acct.domain, acct.at, id)
				ct = data.favourites_count
			} else if (action === 'unboost') {
				positive = false
				const data = await api.postV1Unboost(acct.domain, acct.at, id)
				ct = data.reblogs_count
			} else if (action === 'unfav') {
				positive = false
				const data = await api.postV1Unfav(acct.domain, acct.at, id)
				ct = data.favourites_count
			}
			changeStatus({ is: positive, ct })
		} catch (e) {}
	}
	React.useEffect(() => {
		const _handleAppStateChange = async (nextAppState: AppStateStatus) => {
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				console.log('App has come to the foreground!')
				await loadTimeline()
			}
			appState.current = nextAppState
			setAppStateVisible(appState.current)
		}
		AppState.addEventListener('change', _handleAppStateChange)
		return () => {
			AppState.removeEventListener('change', _handleAppStateChange)
		}
	}, [loadTimeline])
	console.log(loading)
	if (loading) {
		if (loading === 'Initializing' || loading === 'Change Timeline') {
			if (loading === 'Change Timeline') {
				if (typeof ws.close === 'function') ws.close()
			}
			loadTimeline()
		}
		return (
			<View style={[styles.container, styles.center]}>
				<Text>{loading}</Text>
			</View>
		)
	}
	if (!timeline.activated) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text>Not activated</Text>
			</View>
		)
	}
	const vc = (event: any) => {
		let yOffset = event.nativeEvent.contentOffset.y
		if (yOffset > 0) setOnScroll(true)
		if (yOffset <= 0) setOnScroll(false)
	}
	const moreLoad = () => {
		loadTimeline(true)
	}
	const cntAdd = {
		height: Dimensions.get('window').height - 65 - (showToTop ? 50 : 0),
	}
	return (
		<View style={[styles.container, cntAdd]}>
			<FlatList
				maintainVisibleContentPosition={onScroll ? { minIndexForVisible: 0 } : null}
				onEndReached={moreLoad}
				onScroll={vc}
				ref={flatlistRef}
				data={toots}
				renderItem={renderItem}
				initialNumToRender={20}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				onScrollBeginDrag={() => setShowToTop(true)}
				onScrollEndDrag={() => {
					setTimeout(() => setShowToTop(false), 2000)
				}}
			/>
			{showToTop ? (
				<TouchableOpacity style={[styles.toTop, commonStyle.horizonal]} onPress={() => flatlistRef.current?.scrollToIndex({ index: 0 })}>
					<MaterialIcons size={40} name="arrow-upward" color="white" />
					<Text style={{color: 'white'}}>最上部へスクロール</Text>
				</TouchableOpacity>
			) : null}
		</View>
	)
}
const styles = StyleSheet.create({
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flex: 0,
		width: Dimensions.get('window').width,
		backgroundColor: 'transparent',
		marginBottom: 95,
	},
	toTop: {
		padding: 5,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		backgroundColor: 'rgba(0,0,0,0.5)',
		zIndex: 999999,
		justifyContent: 'center',
		alignItems: 'center'
	},
})
