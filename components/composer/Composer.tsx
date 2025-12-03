import type { Account } from '@/entities/account'
import { uploadCallback } from '@/utils/picture'
import type { ComposeMode } from '@/utils/type'
import { frame } from '@expo/ui/swift-ui/modifiers'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformColor, StyleSheet, Text, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native'
import Avatar from '../Avatar'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'

interface Props {
	acct: Account
	isOpened: boolean
	changeMode: (m: ComposeMode) => void
}

const data = [
	{ title: 'composer.vis.public', systemImage: 'globe' as const },
	{ title: 'composer.vis.unlisted', systemImage: 'eye.slash' as const },
	{ title: 'composer.vis.private', systemImage: 'person.2.fill' as const },
	{ title: 'composer.vis.direct', systemImage: 'envelope.fill' as const }
]
export default function Composer({ acct, isOpened, changeMode }: Props) {
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
		<View>
			<Button variant="bordered" onPress={() => changeMode('acct')} style={{ marginBottom: 10 }}>
				<View style={styles.acctContainer}>
					<View>
						<Avatar src={acct.avatar || acct.favicon} size={20} />
					</View>
					<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
						{acct.username}@{acct.domain}
					</Text>
				</View>
			</Button>
			<TextInput ref={textInput} multiline={true} style={styles.textarea} placeholder={t('composer.placeholder')} placeholderTextColor={isDark ? 'lightgray' : 'gray'} />
			<View style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, flexDirection: 'row', gap: 10 }}>
				<Dropdown data={data} onSelect={(title) => setVis(title)} modifiers={[frame({ width: 50, height: 50 })]} style={{ width: 50, height: 50 }}>
					<Button variant="glass" systemImage={data.find((d) => d.title === vis)?.systemImage || 'globe'} />
				</Dropdown>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="photo" onPress={() => uploadCallback((e) => console.log(e))} />
				<Button style={{ width: 100, height: 50 }} variant="glassProminent" color="teal" systemImage="square.and.pencil">
					{t('composer.post')}
				</Button>
			</View>
			<View style={{ height: 30 }} />
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
			paddingBottom: 10
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		}
	})
