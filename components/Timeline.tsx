import React, { useContext, useEffect, useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, Dimensions, FlatList, RefreshControl, useWindowDimensions } from 'react-native'
import { Text, TouchableOpacity, View } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import { RefObject } from 'react'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList } from '../interfaces/ParamList'
import { IFlatList, TopBtnContext } from '../utils/context/topBtn'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import { MaterialIcons } from '@expo/vector-icons'
import { isIPhoneX } from '../utils/statusBar'

interface FromTimelineRootToTimeline {
	timeline: TimelineProps
	loading: string | null
	tlId: number
	txtAction: (id: string, insertText: string, type: 'reply' | 'edit') => void
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
	const [showToTop, setShowToTop] = useState(false)
	const [flatList, setFlatList] = useState<IFlatList>(undefined)
	const { timeline, loading, txtAction, navigation, onRefresh, moreLoad, toots, errorMsg, tlId, refreshing, width } = props
	const { height: deviceHeight } = useWindowDimensions()
	const styles = createStyle(width, deviceHeight)
	const renderItem = (e: any) => {
		const item = e.item as M.Toot
		const deletable = (item.reblog ? `@${item.reblog.account.acct}@${domain}` : `@${item.account.acct}@${domain}`) === acct
		if (timeline.config?.languageHide && timeline.config?.languageHide.includes(item.language || '')) return null
		return (
			<Toot
				navigation={navigation}
				toot={item}
				deletable={deletable}
				txtAction={txtAction}
				acctId={timeline.acct}
				width={width}
				tlId={tlId}
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
		<TopBtnContext.Provider value={{ show: showToTop, setShow: setShowToTop, flatList, setFlatList }}>
		<View style={[styles.container]}>
			{!!loading && <Text>{loading}</Text>}
			<FlatList
				maintainVisibleContentPosition={onScroll ? { minIndexForVisible: 0 } : null}
				onEndReached={() => moreLoad(tlId)}
				onScroll={vc}
				ref={flatlistRef}
				data={toots}
				renderItem={renderItem}
				key={tlId}
				keyExtractor={item => `${item.TootDeskStream || ''}${timeline.key}${tlId}${item.id}`}
				initialNumToRender={20}
				ListEmptyComponent={<Text>No data {errorMsg}</Text>}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
				onScrollEndDrag={() => {
					setShowToTop(true)
					setTimeout(() => setShowToTop(false), 2000)
				}}
			/>
			<TouchableOpacity style={[styles.toTop, { opacity: showToTop ? 1 : 0.3 }]} onPress={() => flatList && flatList.current?.scrollToIndex({ index: 0 })}>
				<MaterialIcons name="keyboard-arrow-up" size={27} />
			</TouchableOpacity>
		</View>
		</TopBtnContext.Provider>
	)
}
function createStyle(width: number, height: number) {
	return StyleSheet.create({
		center: {
			justifyContent: 'center',
			alignItems: 'center',
		},
		container: {
			flex: 0,
			width: width,
			backgroundColor: 'transparent',
			marginBottom: 0,
			borderRightColor: '#eee',
			borderRightWidth: 1
		},
		toTop: {
			position: 'absolute',
			top: height - (isIPhoneX(width, height) ? 95 : 75) - 110,
			height: 50,
			width: 50,
			borderTopLeftRadius: 10,
			backgroundColor: '#eee',
			right: 0,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center'
		},
	})
}