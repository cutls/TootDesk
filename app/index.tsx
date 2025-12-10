import ComposeSheet from '@/components/ComposeSheet'
import { Timelines } from '@/components/timeline/Timelines.demo'
import { listAccts } from '@/utils/storage'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Navigator from '../components/Navigator'

export default function Index() {
	const { width } = useWindowDimensions()
	const [isOpened, setIsOpened] = useState(false)
	const router = useRouter()
	useEffect(() => {
		const fn = async () => {
			const accts = await listAccts()
			if (accts.length === 0) router.replace('/login')
		}
		fn()
	})
	return (
		<View style={styles.container}>
			<Timelines />
			<Navigator openComposer={() => setIsOpened(true)} />
			<ComposeSheet isOpened={isOpened} setIsOpened={setIsOpened} />
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
