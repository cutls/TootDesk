import ComposeSheet from '@/components/ComposeSheet'
import { useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Navigator from '../components/Navigator'

export default function Index() {
	const { width } = useWindowDimensions()
	const [isOpened, setIsOpened] = useState(false)
	return (
		<View style={styles.container}>
			<Navigator openComposer={() => setIsOpened(true)} />
			<ComposeSheet isOpened={isOpened} setIsOpened={setIsOpened} />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20
	},
	link: {
		marginTop: 15,
		paddingVertical: 15
	}
})
