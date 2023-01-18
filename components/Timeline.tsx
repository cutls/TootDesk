import React, { useContext, useEffect, useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, AppState, Dimensions, FlatList, RefreshControl, AppStateStatus } from 'react-native'
import { Text, View } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import deepClone from '../utils/deepClone'
import { RefObject } from 'react'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList, IState, Loading } from '../interfaces/ParamList'
import { TopBtnContext } from '../utils/context/topBtn'

interface FromRootToTimeline {
	timeline: TimelineProps
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
	loading: string | null
	setLoading: IState<Loading | null>
	setNewNotif: IState<boolean>
	reply: (id: string, acct: string) => void
	navigation: StackNavigationProp<ParamList, any>
}
export default (props: FromRootToTimeline) => {
	const appState = React.useRef(AppState.currentState)
	const [appStateVisible, setAppStateVisible] = useState(appState.current)
	const [toots, setToots] = useState([] as M.Toot[])
	const [ids, setIds] = useState([] as string[])
	const [minId, setMinId] = useState('')
	const [errorMsg, setErrorMsg] = useState('')
	const [acct, setAcct] = useState('')
	const [domain, setDomain] = useState('')
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [refreshing, setRefreshing] = useState(false)
	const [onScroll, setOnScroll] = useState(false)
	const { show: showToTop, setShow: setShowToTop, setFlatList } = useContext(TopBtnContext)

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
				deletable={deletable}
				imgModalTrigger={(url: string[], i: number, show: boolean) => props.imgModalTrigger(url, i, show)}
				reply={reply}
				acctId={timeline.acct}
			/>
		)
	}
	let ct = 0
	const tootUpdator = (item: M.Toot[]) => setToots(deepClone(item))
	const loadTimeline = async (mode?: 'more' | 'update') => {
		if (!mode) setToots([])
		let internalToot: M.Toot[] = mode ? toots : []
		console.log('re rendering')
		const moreLoad = mode === 'more'
		const updateLoad = mode === 'update'
		if (!timeline) return false
		if (loading === 'Loading...') return
		if (!mode) setLoading('Loading...')
		const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
		setAcct(acct.acct)
		setDomain(acct.domain)
		let streamable: string | false = false
		let data: M.Toot[] = []
		const param = {} as any
		if (moreLoad) param.max_id = minId
		if (updateLoad && !toots) return console.log('no deps')
		if (updateLoad) param.since_id = toots[0].id
		try {
			switch (timeline.type) {
				case 'home':
					streamable = 'user'
					data = await api.getV1TimelinesHome(acct.domain, acct.at, param)
					if (data.length) setMinId(data[data.length - 1].id)
					break
				case 'local':
					streamable = 'public:local'
					data = await api.getV1TimelinesLocal(acct.domain, acct.at, param)
					if (data.length) setMinId(data[data.length - 1].id)
					break
				case 'public':
					streamable = 'public'
					data = await api.getV1TimelinesPublic(acct.domain, acct.at, param)
					if (data.length) setMinId(data[data.length - 1].id)
					break
				case 'hashtag':
					streamable = 'hashtag'
					data = await api.getV1TimelinesHashtag(acct.domain, acct.at, timeline.timelineData.target, param)
					if (data.length) setMinId(data[data.length - 1].id)
					break
				case 'list':
					streamable = 'list'
					data = await api.getV1TimelinesList(acct.domain, acct.at, timeline.timelineData.target, param)
					if (data.length) setMinId(data[data.length - 1].id)
					break
				case 'bookmark':
					streamable = false
					const bkm = await api.getV1Bookmarks(acct.domain, acct.at, param)
					setMinId(bkm[1] || '')
					data = bkm[0] || []
					break
				case 'fav':
					streamable = false
					const fav = await api.getV1Favourites(acct.domain, acct.at, param)
					setMinId(fav[1] || '')
					data = fav[0] || []
					break
				case 'user':
					streamable = false
					data = await api.getV1AccountsStatuses(acct.domain, acct.at, timeline.timelineData.target, param)
					break
			}
		} catch (e: any) {
			console.error('Error', e)
			setErrorMsg(e.toString())
		}
		if (moreLoad) {
			const clone = toots
			const newData = clone.concat(data)
			internalToot = newData
			setToots(newData)
			return true
		} else if (updateLoad) {
			const clone = toots
			const newData = data.concat(clone)
			internalToot = newData
			tootUpdator(newData)
		}
		if (!updateLoad && toots.length) setToots([])
		if (!updateLoad) {
			setToots(data)
			internalToot = data
		}
		setLoading(null)
		if (streamable) {
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
					if (streamable === 'hashtag') wsParam.tag = timeline.timelineData.target
					wss.send(JSON.stringify(wsParam))
				}
			}
			wss.onmessage = async (e) => {
				const { event } = JSON.parse(e.data)
				const clone = internalToot
				console.log('stream received', event)
				if (event === 'update' || event === 'conversation') {
					//markers show中はダメ
					const { stream, payload } = JSON.parse(e.data)
					if (!stream.includes(streamable)) return console.log('incompatible stream')
					console.log(stream)
					const obj = JSON.parse(payload)
					clone.unshift(obj)
					internalToot = clone
					tootUpdator(clone)
				} else if (event === 'notification') {
					setNewNotif(true)
				} else if (event === 'delete') {
					const { payload } = JSON.parse(e.data)
					const newTl = clone.filter((item) => item.id !== payload)
					internalToot = newTl
					tootUpdator(newTl)
				} else if (event === 'status.update') {
					const { payload } = JSON.parse(e.data)
					const obj: M.Toot = JSON.parse(payload)
					const newTl = clone.map((item) => item.id !== obj.id ? item : obj)
					console.log(newTl.map((item) => item.content))
					internalToot = newTl
					tootUpdator(newTl)
				}
			}
			wss.onclose = async () => {
				console.log('closed')
				setWs(null)
				//if (!killStreaming) await loadTimeline()
			}
			wss.onerror = async (e) => {
				console.log(e)
			}
		}
	}
	useEffect(() => {
		const _handleAppStateChange = async (nextAppState: AppStateStatus) => {
			if ((nextAppState === 'inactive' || nextAppState === 'background') && appState.current === 'active') {
				console.log('App has come to the background!')
				ws?.close()
			}
			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				console.log('App has come to the foreground!')
				await loadTimeline('update')
			}
			appState.current = nextAppState
			setAppStateVisible(appState.current)
		}
		if (timeline && toots.length) {
			const e = AppState.addEventListener('change', _handleAppStateChange)
			return () => {
				e.remove()
			}
		}
	}, [timeline, toots])
	const flatlistRef = React.useRef<FlatList>() as RefObject<FlatList<any>>
	useEffect(() => {
		setFlatList(flatlistRef)
	}, [])
	console.log(loading)
	React.useEffect(() => {
		console.log(loading)
		if (loading === 'Initializing' || loading === 'Change Timeline') {
			if (loading === 'Change Timeline') {
				if (ws && typeof ws.close === 'function') ws.close()
			}
			loadTimeline()
		}
	}, [loading, timeline])
	if (loading) {
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
		loadTimeline('more')
	}
	return (
		<View style={[styles.container]}>
			<View style={{ position: 'absolute', backgroundColor: 'red', width: 4, height: 4, opacity: ws ? 1 : 0, zIndex: 999, borderRadius: 2, marginLeft: 5 }} />
			<FlatList
				maintainVisibleContentPosition={onScroll ? { minIndexForVisible: 0 } : null}
				onEndReached={moreLoad}
				onScroll={vc}
				ref={flatlistRef}
				data={toots}
				renderItem={renderItem}
				initialNumToRender={20}
				ListEmptyComponent={<Text>No data {errorMsg}</Text>}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				onScrollEndDrag={() => {
					setShowToTop(true)
					setTimeout(() => setShowToTop(false), 2000)
				}}
			/>
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
