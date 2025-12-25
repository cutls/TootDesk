import type { Account } from '@/entities/account'
import { useTimelineStore } from '@/utils/store/timelines'
import { getAllMentions, getSourceText } from '@/utils/timeline'
import type { ActionProps, IState } from '@/utils/type'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import type { FlashListRef } from '@shopify/flash-list'
import * as Localization from 'expo-localization'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import PagerView from 'react-native-pager-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Conversations } from '../timeline/Conversations'
import { Notifications } from './Notifications'
import { Timeline } from './Timeline'

interface IProps {
	context: {
		current: number
		setCurrent: IState<number>
		relayRef: React.Ref<FlashListRef<any>>
		setComposeAction: IState<ActionProps | null>
	}
}
export const Columns = ({ context }: IProps) => {
	const { current, setCurrent, relayRef, setComposeAction } = context
	const { timelines } = useTimelineStore()
	const { width, height } = useWindowDimensions()
	const ref = useRef<PagerView>(null)
	const lang = Localization.getLocales()[0]?.languageTag === 'ja-JP' ? 'ja' : 'en'
	const action = async (client: MegalodonInterface, account: Account, type: 'quote' | 'reply' | 'edit', target: Entity.Status) => {
		const isMe = target.account.acct !== account.username ? `@${target.account.acct} ` : ''
		if (type === 'reply') setComposeAction({ type: 'reply', acctId: '1', targetId: target.id, addText: `${isMe}${getAllMentions(target)}` })
		if (type === 'quote') setComposeAction({ type: 'quote', acctId: '1', targetId: target.id })
		if (type === 'edit') setComposeAction({ type: 'edit', acctId: '1', targetId: target.id, addText: await getSourceText(target, client), status: target })
	}
	useEffect(() => {
		ref.current?.setPage(current)
	}, [current])

	const styles = createStyles({ width, height })
	return (
		<SafeAreaView style={[styles.container]}>
			<PagerView ref={ref} style={{ height: '100%', width: '100%' }} initialPage={0} onPageSelected={(a) => setCurrent(a.nativeEvent.position)}>
				{timelines.map((timeline, index) => (
					<View style={styles.page} key={timeline.id}>
						{timeline.kind !== 'notifications' && timeline.kind !== 'direct' && <Timeline timeline={timeline} relayRef={current === index ? relayRef : undefined} composeAction={action} columnWidth={width} lang={lang} />}
						{timeline.kind === 'notifications' && <Notifications timeline={timeline} relayRef={current === index ? relayRef : undefined} composeAction={action} columnWidth={width} lang={lang} />}
						{timeline.kind === 'direct' && <Conversations timeline={timeline} relayRef={current === index ? relayRef : undefined} composeAction={action} columnWidth={width} lang={lang} />}
					</View>
				))}
			</PagerView>
		</SafeAreaView>
	)
}

const createStyles = ({ width, height }: { width: number; height: number }) =>
	StyleSheet.create({
		container: {},
		page: {}
	})
