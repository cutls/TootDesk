import AddTimeline from '@/components/AddTimeline'
import ComposeSheet from '@/components/ComposeSheet'
import { Timelines } from '@/components/timeline/Timelines.demo'
import { listAccts } from '@/utils/storage'
import type { ActionProps } from '@/utils/type'
import type { Entity } from '@cutls/megalodon'
import type { FlashListRef } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Navigator from '../components/Navigator'

export default function Index() {
	const { width } = useWindowDimensions()
	const [isComposeOpened, setIsComposeOpened] = useState(false)
	const [isAddTLOpened, setIsAddTLOpened] = useState(false)
	const [current, setCurrent] = useState(0)
	const [composeAction, setComposeAction] = useState<ActionProps | null>(null)
	const relayRef = useRef<FlashListRef<Entity.Status>>(null)
	const router = useRouter()
	useEffect(() => {
		const fn = async () => {
			const accts = await listAccts()
			if (accts.length === 0) router.replace('/login')
		}
		fn()
	}, [])
	useEffect(() => setComposeAction({ acctId: 1 }), [current])
	return (
		<View style={styles.container}>
			<Timelines context={{ current, setCurrent, relayRef, setComposeAction }} />
			<Navigator context={{ current, setCurrent, relayRef }} openComposer={() => setIsComposeOpened(true)} openAddTimeline={() => setIsAddTLOpened(true)} />
			<ComposeSheet isOpened={isComposeOpened} setIsOpened={setIsComposeOpened} composeAction={composeAction} clearComposeAction={() => setComposeAction({ acctId: 1 })} />
			<AddTimeline context={{ current, setCurrent }} isOpened={isAddTLOpened} setIsOpened={setIsAddTLOpened} />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		height: '100%',
		width: '100%'
	},
	link: {
		marginTop: 15,
		paddingVertical: 15
	}
})
