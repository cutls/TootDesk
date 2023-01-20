import React, { useContext, useEffect, useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Dimensions, FlatList, RefreshControl } from 'react-native'
import { Text, View } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import { RefObject } from 'react'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import { TopBtnContext } from '../utils/context/topBtn'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'

interface FromTimelineRootToTimeline {
	timeline: TimelineProps
	imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
	loading: string | null
	tlId: number
	reply: (id: string, acct: string) => void
	navigation: StackNavigationProp<ParamList, any>
	onRefresh: () => Promise<void>
	moreLoad: (i: number) => void
	errorMsg: string
	toots: M.Toot[]
	refreshing: boolean
	width: number
}
export default (props: FromTimelineRootToTimeline) => {
	const [onScroll, setOnScroll] = useState(false)
	const [acct, setAcct] = useState('')
	const [domain, setDomain] = useState('')
	const { show: showToTop, setShow: setShowToTop, setFlatList } = useContext(TopBtnContext)
	const { timeline, loading, reply, navigation, onRefresh, moreLoad, toots, errorMsg, tlId, refreshing, width } = props
	const styles = createStyle(width)
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
				width={width}
			/>
		)
	}
	const flatlistRef = React.useRef<FlatList>() as RefObject<FlatList<any>>
	const init = async () => {
		const { acct } = timeline
		const account = (await storage.getCertainItem('accounts', 'id', acct)) as S.Account
		setAcct(account.acct)
		setDomain(account.domain)
	}
	useEffect(() => {
		init()
		setFlatList(flatlistRef)
	}, [])
	if (loading && !toots.length) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text>{loading}</Text>
			</View>
		)
	}
	if (!timeline || !timeline.activated) {
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
	return (
		<View style={[styles.container]}>
			{!!loading && <Text>{loading}</Text>}
			<FlatList
				maintainVisibleContentPosition={onScroll ? { minIndexForVisible: 0 } : null}
				onEndReached={() => moreLoad(tlId)}
				onScroll={vc}
				ref={flatlistRef}
				data={toots}
				renderItem={renderItem}
				initialNumToRender={20}
				ListEmptyComponent={<Text>No data {errorMsg}</Text>}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
				onScrollEndDrag={() => {
					setShowToTop(true)
					setTimeout(() => setShowToTop(false), 2000)
				}}
			/>
		</View>
	)
}
function createStyle(width: number) {
	return StyleSheet.create({
		center: {
			justifyContent: 'center',
			alignItems: 'center',
		},
		container: {
			flex: 0,
			width: width,
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
}