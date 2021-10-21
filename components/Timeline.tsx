import React, { useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Platform, Dimensions, FlatList, RefreshControl } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'

interface FromRootToTimeline {
	timeline: TimelineProps
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
}
export default (props: FromRootToTimeline) => {
	const [loading, setLoading] = useState('Initializing' as null | string)
	const [toots, setToots] = useState([] as M.Toot[])
	const [minId, setMinId] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const onRefresh = React.useCallback(async () => {
		setRefreshing(true)
		await loadTimeline()
		setRefreshing(false)
	}, [])
	const { timeline } = props
	const renderItem = (e: any) => {
		const item = e.item
		return <Toot toot={item} key={item.id} imgModalTrigger={(url: string[], i: number, show: boolean) => props.imgModalTrigger(url, i, show)} />
	}
	const loadTimeline = async () => {
		const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
		let streamable = false
		let min_id: string = ''
		let data: M.Toot[] = []
		switch (timeline.type) {
			case 'home':
				streamable = true
				data = await api.getV1TimelinesHome(acct.domain, acct.at, {})
				break
			case 'local':
				streamable = true
				data = await api.getV1TimelinesLocal(acct.domain, acct.at, {})
				break
			case 'public':
				streamable = true
				data = await api.getV1TimelinesPublic(acct.domain, acct.at, {})
				break
			case 'hashtag':
				streamable = true
				data = await api.getV1TimelinesHashtag(acct.domain, acct.at, timeline.timelineData.target, {})
				break
			case 'list':
				streamable = true
				data = await api.getV1TimelinesList(acct.domain, acct.at, timeline.timelineData.target, {})
				break
			case 'bookmark':
				streamable = false
				const bkm = await api.getV1Bookmarks(acct.domain, acct.at, {})
				min_id = bkm[1]
				data = bkm[0]
				break
			case 'fav':
				streamable = false
				const fav = await api.getV1Favourites(acct.domain, acct.at, {})
				min_id = fav[1]
				data = fav[0]
				break
			case 'user':
				streamable = false
				data = await api.getV1AccountsStatuses(acct.domain, acct.at, timeline.timelineData.target, {})
				break
		}
		setToots(data)
		if(streamable) {
			//const ws = new WebSocket('ws://host.com/path')
		}
		setLoading(null)
	}
	if (loading) {
		loadTimeline()
		return (
			<View style={[styles.container, styles.center]}>
				<Text>{loading}</Text>
			</View>
		)
	}
	if (!timeline.activated) {
		return null
	}
	return <FlatList data={toots} renderItem={renderItem} style={styles.container} initialNumToRender={20} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
}
const styles = StyleSheet.create({
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flex: 0,
		height: Dimensions.get('window').height - 55,
		width: Dimensions.get('window').width,
		backgroundColor: 'transparent',
		marginBottom: 75,
	},
})
