import type { Account } from '@/entities/account'
import { uploadCallback } from '@/utils/picture'
import type { ComposeMode, IState } from '@/utils/type'
import { Button as SwiftButton } from '@expo/ui/swift-ui'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'

interface Props {
	text: string
	setText: IState<string>
	acct: Account
	isOpened: boolean
	changeMode: (m: ComposeMode) => void
}

const data = [
	{ title: 'composer.vis.public', value: 'public', systemImage: 'globe' as const },
	{ title: 'composer.vis.unlisted', value: 'unlisted', systemImage: 'eye.slash' as const },
	{ title: 'composer.vis.private', value: 'private', systemImage: 'person.2.fill' as const },
	{ title: 'composer.vis.direct', value: 'direct', systemImage: 'envelope.fill' as const }
]
export default function Composer({ acct, isOpened, changeMode, text, setText }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [vis, setVis] = useState('public')
	const textInput = React.useRef<TextInput>(null)
	useEffect(() => {
		if (isOpened) textInput.current?.focus()
	}, [isOpened])
	return (
		<View style={{ display: isOpened ? 'contents' : 'none' }}>
			<TextInput value={text} onChangeText={(t) => setText(t)} ref={textInput} multiline={true} style={styles.textarea} placeholder={t('composer.placeholder')} placeholderTextColor={isDark ? 'lightgray' : 'gray'} />
			<View style={{ display: 'flex', justifyContent: 'flex-end', marginVertical: 10, paddingBottom: 80, flexDirection: 'row', gap: 10 }}>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="line.3.horizontal" onPress={() => changeMode('menu')} modifiers={[]} />
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="face.smiling" onPress={() => changeMode('emoji')} modifiers={[]} />
				<Dropdown data={data} onSelect={(title) => setVis(title)} modifiers={[]} style={{ width: 50, height: 50 }}>
					<SwiftButton variant="glass" systemImage={data.find((d) => d.title === vis)?.systemImage || 'globe'} />
				</Dropdown>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="photo" onPress={() => uploadCallback((e) => console.log(e))} modifiers={[]} />
				<Button style={{ width: 100, height: 50 }} variant="glassProminent" color="teal" systemImage="square.and.pencil">
					{t('composer.post')}
				</Button>
			</View>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		textarea: {
			width: width - 40,
			height: 200
		},
		acctContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingBottom: 10,
			height: 40
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		}
	})
